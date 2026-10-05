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
   vendorRequestStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    // Details the customer submits when requesting to become a vendor
    vendorRequestDetails: {
      businessName: { type: String, trim: true },
      businessAddress: { type: String, trim: true },
      businessPhone: { type: String, trim: true },
      reason: { type: String, trim: true },
      requestedAt: { type: Date },
    },
    // Admin's action record
    vendorRequestReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    vendorRequestReviewedAt: { type: Date },
    vendorRejectionReason: { type: String, trim: true },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
