const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const asyncHandler = require("../middlewares/async.handler");
const { cacheGet, cacheInvalidatePrefix } = require("../utils/cache");

// ---------- helper: recalculate Product rating + numReviews ----------
const recalcProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: "$product",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(stats[0].avgRating * 10) / 10, // 1 decimal
      numReviews: stats[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      rating: 0,
      numReviews: 0,
    });
  }
};

// ============================================================
// @desc    Add a review (only if user purchased & received the product)
// @route   POST /api/reviews/:productId
// @access  Private (user)
// ============================================================
const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const { productId } = req.params;

  // ---- validation ----
  if (!rating || !comment) {
    const error = new Error("Rating and comment are required");
    error.statusCode = 400;
    throw error;
  }

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    const error = new Error("Rating must be between 1 and 5");
    error.statusCode = 400;
    throw error;
  }

  if (comment.trim().length < 3) {
    const error = new Error("Comment must be at least 3 characters");
    error.statusCode = 400;
    throw error;
  }

  // ---- product exists? ----
  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  // ---- verify purchase + delivery ----
  const purchased = await Order.findOne({
    user: req.user._id,
    "items.product": productId,
    orderStatus: "delivered",
  });

  if (!purchased) {
    const error = new Error(
      "You can only review products you have purchased and received",
    );
    error.statusCode = 403;
    throw error;
  }

  // ---- already reviewed? ----
  const existing = await Review.findOne({
    user: req.user._id,
    product: productId,
  });

  if (existing) {
    const error = new Error("You have already reviewed this product");
    error.statusCode = 409;
    throw error;
  }

  // ---- create review ----
  const review = await Review.create({
    user: req.user._id,
    product: productId,
    rating: numRating,
    comment: comment.trim(),
  });

  await recalcProductRating(product._id);
  await review.populate("user", "name");

  cacheInvalidatePrefix(`reviews:${productId}`);
  cacheInvalidatePrefix("products:");
  
  res.status(201).json({
    success: true,
    message: "Review added successfully",
    review,
  });
});

// ============================================================
// @desc    Get all reviews for a product (public)
// @route   GET /api/reviews/:productId
// @access  Public
// ============================================================
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const cacheKey = `reviews:${productId}`;

  const { data, cached } = await cacheGet(
    cacheKey,
    async () => {
      const product = await Product.findById(productId).select(
        "name rating numReviews",
      );
      if (!product) {
        const error = new Error("Product not found");
        error.statusCode = 404;
        throw error;
      }

      const reviews = await Review.find({ product: productId })
        .populate("user", "name")
        .sort({ createdAt: -1 });

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const r of reviews) {
        distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      }

      return {
        product: {
          id: product._id,
          name: product.name,
          rating: product.rating,
          numReviews: product.numReviews,
        },
        count: reviews.length,
        distribution,
        reviews,
      };
    },
    120,
  );

  res.set("X-Cache", cached ? "HIT" : "MISS");
  res.status(200).json({ success: true, ...data });
});

// ============================================================
// @desc    Get my own reviews
// @route   GET /api/reviews/my
// @access  Private (user)
// ============================================================
const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate("product", "name images price")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    reviews,
  });
});

// ============================================================
// @desc    Update my review
// @route   PUT /api/reviews/:reviewId
// @access  Private (user, owner)
// ============================================================
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);

  if (!review) {
    const error = new Error("Review not found");
    error.statusCode = 404;
    throw error;
  }

  if (review.user.toString() !== req.user._id.toString()) {
    const error = new Error("Not authorized to update this review");
    error.statusCode = 403;
    throw error;
  }

  if (req.body.rating !== undefined) {
    const numRating = Number(req.body.rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      const error = new Error("Rating must be between 1 and 5");
      error.statusCode = 400;
      throw error;
    }
    review.rating = numRating;
  }

  if (req.body.comment) {
    if (req.body.comment.trim().length < 3) {
      const error = new Error("Comment must be at least 3 characters");
      error.statusCode = 400;
      throw error;
    }
    review.comment = req.body.comment.trim();
  }

  await review.save();
  await recalcProductRating(review.product);
  await review.populate("user", "name");

  res.status(200).json({
    success: true,
    message: "Review updated successfully",
    review,
  });
});

// ============================================================
// @desc    Delete my review (or any review if admin)
// @route   DELETE /api/reviews/:reviewId
// @access  Private (owner or admin)
// ============================================================
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);

  if (!review) {
    const error = new Error("Review not found");
    error.statusCode = 404;
    throw error;
  }

  const isOwner = review.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    const error = new Error("Not authorized to delete this review");
    error.statusCode = 403;
    throw error;
  }

  const productId = review.product;
  await review.deleteOne();
  await recalcProductRating(productId);

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});

module.exports = {
  addReview,
  getProductReviews,
  getMyReviews,
  updateReview,
  deleteReview,
};
