const express = require("express");
const adminControllers = require("../controllers/admin.controllers");
const { protect, authorize } = require("../middlewares/auth.middlewares");

const router = express.Router();

router.use(protect, authorize("admin"));

// Dashboard
router.get("/dashboard", adminControllers.getDashboard);

// Vendor requests
router.get("/vendor-requests", adminControllers.getPendingVendorRequests);
router.get("/vendors", adminControllers.getAllVendors);
router.put("/vendor-requests/:id/approve", adminControllers.approveVendor);
router.put("/vendor-requests/:id/reject", adminControllers.rejectVendor);

// Delivery boys (for assignment dropdown)
router.get("/delivery-boys", adminControllers.getDeliveryBoys);

// Orders
router.get("/orders", adminControllers.getAllOrders);
router.get("/orders/:id", adminControllers.getOrderById);
router.put("/orders/:id/assign", adminControllers.assignDelivery);
router.put("/orders/:id/status", adminControllers.updateOrderStatus);

router.post("/create-staff", adminControllers.createStaff);
router.get("/users", adminControllers.getAllUsers);
router.put("/users/:id/toggle-active", adminControllers.toggleUserActive);
router.delete("/users/:id", adminControllers.deleteUser);

module.exports = router;