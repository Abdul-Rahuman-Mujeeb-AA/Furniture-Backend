const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error("Only JPEG, PNG, and WebP images are allowed");
    }

    const isCategoryImage = req.baseUrl.includes("categories");

    return {
      folder: isCategoryImage
        ? "furniture/categories"
        : "furniture/products",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      resource_type: "image",
    };
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const uploadProductImages = upload.array("images", 5);
const uploadCategoryImage = upload.single("image");

module.exports = {
  uploadProductImages,
  uploadCategoryImage,
};