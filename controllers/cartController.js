
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const PRODUCT_FIELDS = "name price discountPrice images stock";

// Validate product IDs before querying MongoDB
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Ensure authentication middleware supplied a user
const requireUser = (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401).json({
      message: "Please log in to access your cart",
    });
    return false;
  }

  return true;
};

// Standard server error handler
const handleError = (res, error, message) => {
  console.error(`${message}:`, error);

  return res.status(500).json({
    message,
  });
};

// Add a product to the cart
const addToCart = async (req, res) => {
  try {
    if (!requireUser(req, res)) return;

    const { productId, quantity = 1 } = req.body || {};

    if (
      !productId ||
      !isValidId(productId) ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
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

    if (
      typeof product.stock !== "number" ||
      product.stock < quantity
    ) {
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
      (item) =>
        item.product &&
        item.product.toString() === productId
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
        product: product._id,
        quantity,
      });
    }

    await cart.save();
    await cart.populate("items.product", PRODUCT_FIELDS);

    return res.status(200).json({
      message: "Product added to cart",
      cart,
    });
  } catch (error) {
    return handleError(res, error, "Failed to add product to cart");
  }
};

// View the user's cart
const getCart = async (req, res) => {
  try {
    if (!requireUser(req, res)) return;

    const cart = await Cart.findOne({
      user: req.user._id,
    }).populate("items.product", PRODUCT_FIELDS);

    if (!cart) {
      return res.status(200).json({
        message: "Cart is empty",
        cart: { items: [] },
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
    return handleError(res, error, "Failed to fetch cart");
  }
};

// Update a cart item's quantity
const updateCartItem = async (req, res) => {
  try {
    if (!requireUser(req, res)) return;

    const { productId, quantity } = req.body || {};

    if (
      !productId ||
      !isValidId(productId) ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
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

    if (
      typeof product.stock !== "number" ||
      quantity > product.stock
    ) {
      return res.status(400).json({
        message: "Requested quantity exceeds available stock",
      });
    }

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    const item = cart.items.find(
      (item) =>
        item.product &&
        item.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        message: "Product not found in cart",
      });
    }

    item.quantity = quantity;

    await cart.save();
    await cart.populate("items.product", PRODUCT_FIELDS);

    return res.status(200).json({
      message: "Cart quantity updated",
      cart,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      "Failed to update cart quantity"
    );
  }
};

// Remove one product from the cart
const removeCartItem = async (req, res) => {
  try {
    if (!requireUser(req, res)) return;

    const { productId } = req.params;

    if (!productId || !isValidId(productId)) {
      return res.status(400).json({
        message: "Valid product ID is required",
      });
    }

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    const itemExists = cart.items.some(
      (item) =>
        item.product &&
        item.product.toString() === productId
    );

    if (!itemExists) {
      return res.status(404).json({
        message: "Product not found in cart",
      });
    }

    cart.items = cart.items.filter(
      (item) =>
        item.product &&
        item.product.toString() !== productId
    );

    await cart.save();
    await cart.populate("items.product", PRODUCT_FIELDS);

    return res.status(200).json({
      message: "Product removed from cart",
      cart,
    });
  } catch (error) {
    return handleError(res, error, "Failed to remove product from cart");
  }
};

// Clear the entire cart
const clearCart = async (req, res) => {
  try {
    if (!requireUser(req, res)) return;

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(200).json({
        message: "Cart is already empty",
        cart: { items: [] },
      });
    }

    cart.items = [];
    await cart.save();

    return res.status(200).json({
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    return handleError(res, error, "Failed to clear cart");
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
