const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    phone: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      enum: ["user", "customer", "vendor", "delivery", "admin"],
      default: "user",
    },

    // --- VENDOR ONBOARDING ---
    vendorRequestStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    vendorRequestDetails: {
      businessName: { type: String, trim: true },
      businessAddress: { type: String, trim: true },
      businessPhone: { type: String, trim: true },
      reason: { type: String, trim: true },
      requestedAt: { type: Date },
    },
    vendorRequestReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    vendorRequestReviewedAt: { type: Date },
    vendorRejectionReason: { type: String, trim: true },

    // --- RAZORPAY SPLIT PAYMENTS (NEW) ---
    razorpayAccountId: {
      type: String,
      trim: true,
      default: "", // Populated when admin links vendor's bank account (e.g., "acc_JMX...")
    },

    // --- DELIVERY ONBOARDING (NEW) ---
    deliveryRequestStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    deliveryRequestDetails: {
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
      vehicleType: { type: String, enum: ["bike", "scooter", "car"] },
      vehicleNumber: { type: String, trim: true, uppercase: true },
      licenseNumber: { type: String, trim: true, uppercase: true },
      requestedAt: { type: Date },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;