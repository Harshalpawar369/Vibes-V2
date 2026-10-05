const express = require("express");
const cartControllers = require("../controllers/cart.controllers");
const { protect, authorize } = require("../middlewares/auth.middlewares");

const router = express.Router();

// All cart routes require login (user role)
router.use(protect, authorize("user", "admin"));

router.get("/", cartControllers.getCart);
router.post("/", cartControllers.addToCart);
router.put("/:productId", cartControllers.updateCartItem);
router.delete("/:productId", cartControllers.removeFromCart);
router.delete("/", cartControllers.clearCart);

module.exports = router;
