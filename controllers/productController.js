const Product = require("../models/Product");
const Category = require("../models/Category");
const cloudinary = require("../config/cloudinary");

// Create product
const createProduct = async (req, res) => {
  const uploadedPublicIds = (req.files || []).map(
    (file) => file.filename
  );

  try {
    const {
      name,
      description,
      price,
      discountPrice,
      category,
      brand,
      material,
      color,
      stock,
      isFeatured,
    } = req.body;

    if (
      !name ||
      !description ||
      price === undefined ||
      !category ||
      stock === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, description, price, category and stock are required",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
    }

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    const parsedDiscount =
      discountPrice === undefined || discountPrice === ""
        ? undefined
        : Number(discountPrice);

    if (
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0 ||
      !Number.isInteger(parsedStock) ||
      parsedStock < 0 ||
      (parsedDiscount !== undefined &&
        (!Number.isFinite(parsedDiscount) ||
          parsedDiscount < 0 ||
          parsedDiscount > parsedPrice))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid price, discount price or stock",
      });
    }

    const existingCategory = await Category.findById(category);

    if (!existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category not found",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      description,
      price: parsedPrice,
      discountPrice: parsedDiscount,
      category,
      brand,
      material,
      color,
      stock: parsedStock,
      isFeatured: isFeatured === true || isFeatured === "true",
      images: req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      })),
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    await Promise.all(
      uploadedPublicIds.map(async (publicId) => {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (cleanupError) {
          console.error("Cloudinary cleanup failed:", cleanupError.message);
        }
      })
    );

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate product data",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all products with search, filtering, sorting and pagination
const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    const currentPage = Number(page);
    const perPage = Number(limit);

    if (
      !Number.isInteger(currentPage) ||
      currentPage < 1 ||
      !Number.isInteger(perPage) ||
      perPage < 1 ||
      perPage > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid page or limit",
      });
    }

    const filter = {};

    if (search) {
      // Escape regex characters so search input is treated as text.
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.name = { $regex: escapedSearch, $options: "i" };
    }

    if (category) {
      if (!/^[a-f\d]{24}$/i.test(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }

      filter.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};

      if (minPrice !== undefined) {
        const min = Number(minPrice);

        if (!Number.isFinite(min) || min < 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid minimum price",
          });
        }

        filter.price.$gte = min;
      }

      if (maxPrice !== undefined) {
        const max = Number(maxPrice);

        if (!Number.isFinite(max) || max < 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid maximum price",
          });
        }

        filter.price.$lte = max;
      }

      if (
        filter.price.$gte !== undefined &&
        filter.price.$lte !== undefined &&
        filter.price.$gte > filter.price.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "Minimum price cannot exceed maximum price",
        });
      }
    }

    const sortOptions = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      name_asc: { name: 1 },
    };

    const sortBy = sortOptions[sort] || sortOptions.newest;

    const products = await Product.find(filter)
      .populate("category", "name")
      .sort(sortBy)
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    const total = await Product.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: currentPage,
      totalPages: Math.ceil(total / perPage),
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get featured products
const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true })
      .populate("category", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single product
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name description");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID",
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  const uploadedPublicIds = (req.files || []).map(
    (file) => file.filename
  );

  let saved = false;

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Preserve old images before replacing them.
    const oldImages = [...product.images];

    const {
      name,
      description,
      price,
      discountPrice,
      category,
      brand,
      material,
      color,
      stock,
      isFeatured,
    } = req.body;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Product name cannot be empty",
        });
      }

      product.name = name.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        return res.status(400).json({
          success: false,
          message: "Description cannot be empty",
        });
      }

      product.description = description;
    }

    if (price !== undefined) {
      const parsedPrice = Number(price);

      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid price",
        });
      }

      product.price = parsedPrice;
    }

    if (discountPrice !== undefined) {
      if (discountPrice === "") {
        product.discountPrice = undefined;
      } else {
        const parsedDiscount = Number(discountPrice);

        if (!Number.isFinite(parsedDiscount) || parsedDiscount < 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid discount price",
          });
        }

        product.discountPrice = parsedDiscount;
      }
    }

    if (
      product.discountPrice !== undefined &&
      product.discountPrice > product.price
    ) {
      return res.status(400).json({
        success: false,
        message: "Discount price cannot exceed product price",
      });
    }

    if (category !== undefined) {
      const existingCategory = await Category.findById(category);

      if (!existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Category not found",
        });
      }

      product.category = category;
    }

    if (brand !== undefined) product.brand = brand;
    if (material !== undefined) product.material = material;
    if (color !== undefined) product.color = color;

    if (stock !== undefined) {
      const parsedStock = Number(stock);

      if (!Number.isInteger(parsedStock) || parsedStock < 0) {
        return res.status(400).json({
          success: false,
          message: "Stock must be a non-negative integer",
        });
      }

      product.stock = parsedStock;
    }

    if (isFeatured !== undefined) {
      if (
        isFeatured !== "true" &&
        isFeatured !== "false" &&
        isFeatured !== true &&
        isFeatured !== false
      ) {
        return res.status(400).json({
          success: false,
          message: "isFeatured must be true or false",
        });
      }

      product.isFeatured = isFeatured === true || isFeatured === "true";
    }

    // If new images are uploaded, replace the existing images.
    if (req.files && req.files.length > 0) {
      product.images = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));
    }

    await product.save();
    saved = true;

    // Delete old Cloudinary images only after saving successfully.
    if (req.files && req.files.length > 0) {
      await Promise.all(
        oldImages.map(async (image) => {
          try {
            await cloudinary.uploader.destroy(image.publicId);
          } catch (error) {
            console.error(
              "Old image deletion failed:",
              error.message
            );
          }
        })
      );
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    // Clean up new uploads only if the database update did not succeed.
    if (!saved) {
      await Promise.all(
        uploadedPublicIds.map(async (publicId) => {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (cleanupError) {
            console.error(
              "Cloudinary cleanup failed:",
              cleanupError.message
            );
          }
        })
      );
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.deleteOne();

    await Promise.all(
      product.images.map(async (image) => {
        try {
          await cloudinary.uploader.destroy(image.publicId);
        } catch (error) {
          console.error(
            "Cloudinary image deletion failed:",
            error.message
          );
        }
      })
    );

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getFeaturedProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};