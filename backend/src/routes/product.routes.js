const express = require("express");
const productControllers = require("../controllers/product.controllers");
const { protect, authorize } = require("../middlewares/auth.middlewares");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

// ---------- Public ----------
router.get("/", productControllers.getProducts);

// ---------- Vendor only (before /:id to avoid route clash) ----------
router.get(
  "/mine",
  protect,
  authorize("vendor", "admin"),
  productControllers.getMyProducts
);

router.post(
  "/",
  protect,
  authorize("vendor", "admin"),
  upload.array("images", 5), // 🔑 "images" = form-data field name, max 5
  productControllers.createProduct
);

router.put(
  "/:id",
  protect,
  authorize("vendor", "admin"),
  upload.array("images", 5),
  productControllers.updateProduct
);

router.delete(
  "/:id",
  protect,
  authorize("vendor", "admin"),
  productControllers.deleteProduct
);

// ---------- Public (must come AFTER /mine) ----------
router.get("/:id", productControllers.getProduct);

module.exports = router;