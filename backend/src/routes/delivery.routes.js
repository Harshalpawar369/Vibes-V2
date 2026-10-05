const express = require("express");
const deliveryControllers = require("../controllers/delivery.controllers");
const { protect, authorize } = require("../middlewares/auth.middlewares");

const router = express.Router();

router.use(protect, authorize("delivery", "admin"));

router.get("/orders", deliveryControllers.getAssignedOrders);
router.get("/history", deliveryControllers.getDeliveryHistory);
router.put("/orders/:id/status", deliveryControllers.updateOrderStatus);
router.put("/orders/:id/confirm-cod", deliveryControllers.confirmCodPayment);
router.put("/orders/:id/deliver", deliveryControllers.markDelivered);

module.exports = router;