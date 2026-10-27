const express = require("express");
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.use(authMiddleware);

// User routes
router.post("/", createOrder);
router.get("/my-orders", getMyOrders);
router.put("/:id/cancel", cancelOrder);

// Admin routes — keep these before /:id
router.get("/admin/all", adminMiddleware, getAllOrders);
router.put("/admin/:id/status", adminMiddleware, updateOrderStatus);

// Get a specific order belonging to the logged-in user
router.get("/:id", getOrderById);

module.exports = router;
