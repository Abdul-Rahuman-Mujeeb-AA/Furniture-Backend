const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Add a product to the cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        message: "Valid product ID and quantity are required",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        message: "Not enough stock available",
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > product.stock) {
        return res.status(400).json({
          message: "Requested quantity exceeds available stock",
        });
      }

      existingItem.quantity = newQuantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
      });
    }

    await cart.save();

    await cart.populate(
      "items.product",
      "name price discountPrice images stock"
    );

    return res.status(200).json({
      message: "Product added to cart",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to add product to cart",
      error: error.message,
    });
  }
};

// View the user's cart
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name price discountPrice images stock"
    );

    if (!cart) {
      return res.status(200).json({
        message: "Cart is empty",
        cart: {
          items: [],
        },
        totalAmount: 0,
      });
    }

    let totalAmount = 0;

    cart.items.forEach((item) => {
      if (item.product) {
        const price =
          item.product.discountPrice != null
            ? item.product.discountPrice
            : item.product.price;

        totalAmount += price * item.quantity;
      }
    });

    return res.status(200).json({
      cart,
      totalAmount,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
};

// Update a cart item's quantity
const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        message: "Valid product ID and quantity are required",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        message: "Requested quantity exceeds available stock",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        message: "Product not found in cart",
      });
    }

    item.quantity = quantity;

    await cart.save();
    await cart.populate(
      "items.product",
      "name price discountPrice images stock"
    );

    return res.status(200).json({
      message: "Cart quantity updated",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update cart quantity",
      error: error.message,
    });
  }
};

// Remove one product from the cart
const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    const itemExists = cart.items.some(
      (item) => item.product.toString() === productId
    );

    if (!itemExists) {
      return res.status(404).json({
        message: "Product not found in cart",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();
    await cart.populate(
      "items.product",
      "name price discountPrice images stock"
    );

    return res.status(200).json({
      message: "Product removed from cart",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to remove product from cart",
      error: error.message,
    });
  }
};

// Clear the entire cart
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(200).json({
        message: "Cart is already empty",
        cart: {
          items: [],
        },
      });
    }

    cart.items = [];

    await cart.save();

    return res.status(200).json({
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to clear cart",
      error: error.message,
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};