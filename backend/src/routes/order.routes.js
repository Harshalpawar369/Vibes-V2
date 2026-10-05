const express = require("express");
const orderControllers = require("../controllers/order.controllers");
const { protect, authorize } = require("../middlewares/auth.middlewares");

const router = express.Router();

router.use(protect, authorize("user", "admin"));

router.post("/", orderControllers.createOrder);
router.post("/verify", orderControllers.verifyPayment);
router.get("/my", orderControllers.getMyOrders);
router.get("/:id", orderControllers.getOrder);
router.put("/:id/cancel", orderControllers.cancelOrder);

module.exports = router;