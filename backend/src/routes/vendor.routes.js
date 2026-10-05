const express = require("express");
const vendorControllers = require("../controllers/vendor.controllers");
const { protect, authorize } = require("../middlewares/auth.middlewares");

const router = express.Router();

router.use(protect, authorize("vendor", "admin"));

router.get("/dashboard", vendorControllers.getDashboard);
router.get("/orders", vendorControllers.getMyOrders);
router.get("/reviews", vendorControllers.getMyReviews);

module.exports = router;