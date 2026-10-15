const Razorpay = require("razorpay");

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

let razorpay;

if (key_id && key_secret) {
  razorpay = new Razorpay({
    key_id,
    key_secret,
  });
} else {
  console.warn(
    "Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment for live payment processing."
  );

  razorpay = {
    orders: {
      create: async () => {
        const err = new Error(
          "Razorpay keys are not configured. Set them in your environment before processing live payments."
        );
        err.code = "NO_RAZORPAY_KEYS";
        throw err;
      },
    },
  };
}

module.exports = razorpay;
