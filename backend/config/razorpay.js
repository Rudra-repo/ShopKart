const Razorpay = require("razorpay");

const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_shopkart_key";
const key_secret = process.env.RAZORPAY_KEY_SECRET || "shopkart_razorpay_secret_123";

const razorpay = new Razorpay({
  key_id,
  key_secret,
});

module.exports = razorpay;
