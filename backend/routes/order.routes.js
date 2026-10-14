const express = require("express");
const router = express.Router();
const protect = require("../middlewares/auth.middleware");
const {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  cancelOrder,
  payForOrder,
} = require("../controllers/order.controller");

router.use(protect);

router.post("/create-payment-order", createPaymentOrder);
router.post("/verify-payment", verifyPayment);
router.post("/:id/pay", payForOrder);
router.get("/", getMyOrders);
router.get("/:id", getOrderById);
router.delete("/:id", cancelOrder);

module.exports = router;
