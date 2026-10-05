const express = require("express");
const authControllers = require("../controllers/auth.controller");
const { protect, authorize } = require("../middlewares/auth.middlewares");

const router = express.Router();

// ---------- Public routes ----------
router.post("/register", authControllers.register);
router.post("/login", authControllers.login);
router.get("/isloggedin", authControllers.isLoggedIn);

// ---------- Private routes (any logged-in role) ----------
router.post("/logout", protect, authControllers.logout);
router.get("/profile", protect, authControllers.getProfile);
router.put("/profile", protect, authControllers.updateProfile);
router.delete("/profile", protect, authControllers.deleteUser);

// ---------- Admin only ----------
router.post("/request-vendor", protect, authControllers.requestVendor);

router.get(
  "/vendor-request-status",
  protect,
  authControllers.getVendorRequestStatus,
);

module.exports = router;
