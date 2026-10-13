const crypto = require("crypto");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order with multi-vendor transfers.
 */
const createRazorpayOrder = async (amountInRupees, receipt, transfers = []) => {
  const options = {
    amount: Math.round(amountInRupees * 100), // paise
    currency: "INR",
    receipt,
    payment_capture: 1, // auto-capture
  };

  // If there are vendors with linked accounts, append the split logic
  if (transfers && transfers.length > 0) {
    options.transfers = transfers;
  }

  return razorpay.orders.create(options);
};

const verifyRazorpaySignature = (
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
) => {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return expected === razorpaySignature;
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpaySignature,
};