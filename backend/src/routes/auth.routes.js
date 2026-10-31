const express = require("express");
const passport = require("passport");
const authControllers = require("../controllers/auth.controller");
const { protect, authorize } = require("../middlewares/auth.middlewares");

const router = express.Router();

// ---------- Public routes ----------
router.post("/register", authControllers.register);
router.post("/login", authControllers.login);
router.get("/isloggedin", authControllers.isLoggedIn);

// ---------- Google OAuth routes ----------
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || "http://localhost:5173"}/login?error=oauth_failed`,
  }),
  authControllers.googleCallback
);

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