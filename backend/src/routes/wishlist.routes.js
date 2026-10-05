const express = require("express");
const wishlistControllers = require("../controllers/wishlist.controllers");
const { protect, authorize } = require("../middlewares/auth.middlewares");

const router = express.Router();

router.use(protect, authorize("user", "admin"));

router.get("/", wishlistControllers.getWishlist);
router.post("/:productId", wishlistControllers.toggleWishlist);
router.delete("/", wishlistControllers.clearWishlist);

module.exports = router;