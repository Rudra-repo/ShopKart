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
  // Do NOT include real keys in source. When keys are missing we export a lightweight mock
  // that throws when used - controllers already handle errors and can fallback to mock orders.
  console.warn(
    "Razorpay keys not set. Razorpay API calls will fail fast. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment for production."
  );
  razorpay = {
    orders: {
      create: async () => {
        const err = new Error("Razorpay keys not configured");
        err.code = "NO_RAZORPAY_KEYS";
        throw err;
      },
    },
  };
}

module.exports = razorpay;
