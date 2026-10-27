const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  getFeaturedProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { uploadProductImages } = require("../middleware/uploadMiddleware");

// Public routes
router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);
router.get("/:id", getProductById);

// Admin routes
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  uploadProductImages,
  createProduct,
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  uploadProductImages,
  updateProduct,
);

router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct);

module.exports = router;
