const express = require("express");
const router = express.Router();

const {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

const authMiddleware = require("../middleware/authMiddleware");

// Public route
router.get("/product/:productId", getProductReviews);

// Authenticated routes
router.post("/", authMiddleware, createReview);
router.put("/:id", authMiddleware, updateReview);
router.delete("/:id", authMiddleware, deleteReview);

module.exports = router;