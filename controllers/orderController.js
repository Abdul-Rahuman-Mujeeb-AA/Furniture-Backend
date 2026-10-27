const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Place an order from the user's cart
const createOrder = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      address,
      city,
      state,
      postalCode,
      country = "India",
    } = req.body;

    if (
      !fullName ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !postalCode
    ) {
      return res.status(400).json({
        message: "Please provide all shipping address details",
      });
    }

    const cart = await Cart.findOne({
      user: req.user._id,
    }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        message: "Your cart is empty",
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    // Check product stock and calculate the order total
    for (const item of cart.items) {
      const product = item.product;

      if (!product) {
        return res.status(400).json({
          message: "A product in your cart no longer exists",
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `${product.name} does not have enough stock`,
        });
      }

      const price =
        product.discountPrice != null
          ? product.discountPrice
          : product.price;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images.length > 0
          ? product.images[0].url
          : "",
        price,
        quantity: item.quantity,
      });

      totalAmount += price * item.quantity;
    }

    // Reduce stock only after validating all cart items
    for (const item of cart.items) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.product._id,
          stock: { $gte: item.quantity },
        },
        {
          $inc: { stock: -item.quantity },
        },
        {
          new: true,
        }
      );

      if (!updatedProduct) {
        // Restore stock for products already updated
        for (const previousItem of cart.items) {
          if (
            previousItem.product._id.toString() ===
            item.product._id.toString()
          ) {
            break;
          }

          await Product.findByIdAndUpdate(previousItem.product._id, {
            $inc: { stock: previousItem.quantity },
          });
        }

        return res.status(400).json({
          message: "Stock changed while placing the order. Please try again.",
        });
      }
    }

    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress: {
        fullName,
        phone,
        address,
        city,
        state,
        postalCode,
        country,
      },
      totalAmount,
      paymentMethod: "COD",
      paymentStatus: "pending",
      orderStatus: "placed",
    });

    // Empty the cart after the order is created
    cart.items = [];
    await cart.save();

    return res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to place order",
      error: error.message,
    });
  }
};

// Get orders belonging to the logged-in user
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      count: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch your orders",
      error: error.message,
    });
  }
};

// Get one order belonging to the logged-in user
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.status(200).json({ order });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    return res.status(500).json({
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// Cancel an order belonging to the logged-in user
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (!["placed", "confirmed"].includes(order.orderStatus)) {
      return res.status(400).json({
        message: "This order can no longer be cancelled",
      });
    }

    // Restore stock for each ordered product
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    order.orderStatus = "cancelled";
    await order.save();

    return res.status(200).json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    return res.status(500).json({
      message: "Failed to cancel order",
      error: error.message,
    });
  }
};

// Admin: Get all orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch all orders",
      error: error.message,
    });
  }
};

// Admin: Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const allowedStatuses = [
      "placed",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({
        message: "A cancelled order cannot be updated",
      });
    }

    if (order.orderStatus === "delivered") {
      return res.status(400).json({
        message: "A delivered order cannot be updated",
      });
    }

    // Restore stock when an admin cancels an order
    if (orderStatus === "cancelled") {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    order.orderStatus = orderStatus;
    await order.save();

    return res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    return res.status(500).json({
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
};