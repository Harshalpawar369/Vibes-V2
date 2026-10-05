const express = require("express");
const reviewControllers = require("../controllers/review.controllers");
const { protect } = require("../middlewares/auth.middlewares");

const router = express.Router();

router.get("/my/list", protect, reviewControllers.getMyReviews);
router.post("/:productId", protect, reviewControllers.addReview);
router.put("/:reviewId", protect, reviewControllers.updateReview);
router.delete("/:reviewId", protect, reviewControllers.deleteReview);


router.get("/:productId", reviewControllers.getProductReviews);

module.exports = router;