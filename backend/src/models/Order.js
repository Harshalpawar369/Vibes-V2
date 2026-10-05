const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // Human-friendly order ID (also stored for support lookup)
    orderId: {
      type: String,
      required: true,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        vendor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        name: { type: String, required: true }, // snapshot
        price: { type: Number, required: true }, // snapshot
        quantity: { type: Number, required: true, min: 1 },
        image: { type: String, default: "" }, // snapshot
      },
    ],

    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },

    itemsPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },

    paymentMethod: {
      type: String,
      enum: ["cod", "razorpay"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },

    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },

    orderStatus: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "shipped",
        "out-for-delivery",
        "delivered",
        "cancelled",
      ],
      default: "placed",
    },

    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    deliveryBoy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // COD-specific: delivery boy confirms cash collected
    codConfirmed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ "items.vendor": 1 });
orderSchema.index({ deliveryBoy: 1, orderStatus: 1 });

module.exports = mongoose.model("Order", orderSchema);