const crypto = require("crypto");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order.
 * @param {Number} amountInRupees
 * @param {String} receipt
 * @returns {Promise<Object>} Razorpay order object
 */
const createRazorpayOrder = async (amountInRupees, receipt) => {
  return razorpay.orders.create({
    amount: Math.round(amountInRupees * 100), // paise
    currency: "INR",
    receipt,
    payment_capture: 1, // auto-capture
  });
};

/**
 * Verify the payment signature returned by Razorpay.
 * @returns {Boolean} true if signature matches
 */
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