const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { uploadCategoryImage } = require("../middleware/uploadMiddleware");

router.get("/", getCategories);
router.get("/:id", getCategoryById);

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  uploadCategoryImage,
  createCategory,
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  uploadCategoryImage,
  updateCategory,
);

router.delete("/:id", authMiddleware, adminMiddleware, deleteCategory);

module.exports = router;
