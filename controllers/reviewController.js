const Review = require("../models/Review");
const Product = require("../models/Product");

// Create a review
const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || rating === undefined || !comment?.trim()) {
      return res.status(400).json({
        message: "Product, rating, and comment are required",
      });
    }

    const parsedRating = Number(rating);

    if (
      !Number.isInteger(parsedRating) ||
      parsedRating < 1 ||
      parsedRating > 5
    ) {
      return res.status(400).json({
        message: "Rating must be an integer between 1 and 5",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId,
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this product",
      });
    }

    const review = await Review.create({
      user: req.user._id,
      product: productId,
      rating: parsedRating,
      comment: comment.trim(),
    });

    await review.populate("user", "name");

    return res.status(201).json({
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: "You have already reviewed this product",
      });
    }

    return res.status(500).json({
      message: "Failed to add review",
      error: error.message,
    });
  }
};

// Get all reviews for a product
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const reviews = await Review.find({
      product: productId,
    })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews > 0
        ? Number(
            (
              reviews.reduce((total, review) => total + review.rating, 0) /
              totalReviews
            ).toFixed(1)
          )
        : 0;

    return res.status(200).json({
      totalReviews,
      averageRating,
      reviews,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    return res.status(500).json({
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

// Update your own review
const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (rating === undefined && comment === undefined) {
      return res.status(400).json({
        message: "Provide a rating or comment to update",
      });
    }

    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    if (rating !== undefined) {
      const parsedRating = Number(rating);

      if (
        !Number.isInteger(parsedRating) ||
        parsedRating < 1 ||
        parsedRating > 5
      ) {
        return res.status(400).json({
          message: "Rating must be an integer between 1 and 5",
        });
      }

      review.rating = parsedRating;
    }

    if (comment !== undefined) {
      if (typeof comment !== "string" || !comment.trim()) {
        return res.status(400).json({
          message: "Comment cannot be empty",
        });
      }

      review.comment = comment.trim();
    }

    await review.save();
    await review.populate("user", "name");

    return res.status(200).json({
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid review ID",
      });
    }

    return res.status(500).json({
      message: "Failed to update review",
      error: error.message,
    });
  }
};

// Delete your own review
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    await Review.findByIdAndDelete(review._id);

    return res.status(200).json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid review ID",
      });
    }

    return res.status(500).json({
      message: "Failed to delete review",
      error: error.message,
    });
  }
};

module.exports = {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
};