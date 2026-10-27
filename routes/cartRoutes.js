const express = require("express");
const router = express.Router();

const {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cartController");

const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.post("/", addToCart);
router.get("/", getCart);
router.put("/", updateCartItem);
router.delete("/:productId", removeCartItem);
router.delete("/", clearCart);

module.exports = router;