const Category = require("../models/Category");
const cloudinary = require("../config/cloudinary");

// Create category
const createCategory = async (req, res) => {
  let uploadedPublicId = null;

  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Category image is required",
      });
    }

    uploadedPublicId = req.file.filename;

    const existingCategory = await Category.findOne({
      name: name.trim(),
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description,
      image: req.file.path,
      imagePublicId: req.file.filename,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId);
      } catch (cleanupError) {
        console.error("Cloudinary cleanup failed:", cleanupError.message);
      }
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single category
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid category ID",
    });
  }
};

// Update category
const updateCategory = async (req, res) => {
  let uploadedPublicId = null;

  try {
    const { name, description } = req.body;

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category name cannot be empty",
        });
      }

      const existingCategory = await Category.findOne({
        name: name.trim(),
        _id: { $ne: category._id },
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Category name already exists",
        });
      }

      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description;
    }

    if (req.file) {
      uploadedPublicId = req.file.filename;

      const oldPublicId = category.imagePublicId;

      category.image = req.file.path;
      category.imagePublicId = req.file.filename;

      await category.save();

      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (cleanupError) {
        console.error("Old image deletion failed:", cleanupError.message);
      }

      return res.status(200).json({
        success: true,
        message: "Category updated successfully",
        category,
      });
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId);
      } catch (cleanupError) {
        console.error("Cloudinary cleanup failed:", cleanupError.message);
      }
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const productExists = await require("../models/Product").exists({
      category: category._id,
    });

    if (productExists) {
      return res.status(400).json({
        success: false,
        message: "Delete or reassign the category's products first",
      });
    }

    await category.deleteOne();

    try {
      await cloudinary.uploader.destroy(category.imagePublicId);
    } catch (cleanupError) {
      console.error("Cloudinary image deletion failed:", cleanupError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Unable to delete category",
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};