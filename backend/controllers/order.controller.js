const crypto = require("crypto");
const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const razorpay = require("../config/razorpay");

// @desc    Validate cart, calculate server total, create pending ShopKart order & Razorpay order
// @route   POST /orders/create-payment-order
// @access  Private
const createPaymentOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.addressLine1 ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.pincode ||
      !shippingAddress.fullName.trim() ||
      !shippingAddress.phone.trim() ||
      !shippingAddress.addressLine1.trim() ||
      !shippingAddress.city.trim() ||
      !shippingAddress.state.trim() ||
      !shippingAddress.pincode.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or incomplete shipping address details",
      });
    }

    const cleanPincode = shippingAddress.pincode.trim();
    if (!/^\d{6}$/.test(cleanPincode)) {
      return res.status(400).json({
        success: false,
        message: "Pincode must contain exactly 6 digits",
      });
    }

    const cleanPhone = shippingAddress.phone.trim();
    if (!/^\d{10,}$/.test(cleanPhone.replace(/[\s+-]/g, ""))) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be valid",
      });
    }

    const customer = await Customer.findById(req.user._id).populate("cart.product");
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!customer.cart || customer.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty. Cannot place an order.",
      });
    }

    const orderItems = [];
    let serverTotalAmount = 0;

    for (const item of customer.cart) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: "One or more items in your cart are no longer available.",
        });
      }

      const product = await Product.findById(item.product._id || item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: "Product not found in catalog.",
        });
      }

      if (item.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available stock: ${product.stock}, requested: ${item.quantity}.`,
        });
      }

      const itemTotal = product.price * item.quantity;
      serverTotalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image,
      });
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: cleanPhone,
        addressLine1: shippingAddress.addressLine1.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        pincode: cleanPincode,
      },
      totalAmount: serverTotalAmount,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
    });

    let razorpayOrderId = "";
    let isMock = false;
    let mockReason = "";

    try {
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(serverTotalAmount * 100),
        currency: "INR",
        receipt: order._id.toString(),
      });
      razorpayOrderId = razorpayOrder.id;
    } catch (rzpErr) {
      const errMsg =
        rzpErr?.error?.description || rzpErr?.message || JSON.stringify(rzpErr);
      console.warn("Razorpay API call warning, generating mock order ID:", errMsg);
      razorpayOrderId = "order_mock_" + crypto.randomBytes(7).toString("hex");
      isMock = true;
      mockReason = errMsg;
    }

    order.razorpayOrderId = razorpayOrderId;
    await order.save();

    const key = process.env.RAZORPAY_KEY_ID || null;

    return res.status(200).json({
      success: true,
      shopKartOrderId: order._id,
      razorpayOrderId: order.razorpayOrderId,
      amount: Math.round(serverTotalAmount * 100),
      currency: "INR",
      key,
      isMock,
      mockReason,
    });
  } catch (error) {
    console.error("createPaymentOrder error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during checkout",
    });
  }
};

// @desc    Verify Razorpay payment HMAC signature and confirm order
const verifyPayment = async (req, res) => {
  try {
    const { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!shopKartOrderId || !mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(shopKartOrderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You do not own this order.",
      });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        order,
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret && process.env.NODE_ENV === "production") {
      return res.status(500).json({
        success: false,
        message: "Server misconfiguration: RAZORPAY_KEY_SECRET missing",
      });
    }

    const trustedRzpOrderId = order.razorpayOrderId || razorpay_order_id;

    if (!trustedRzpOrderId || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification payload",
      });
    }

    let isValidSignature = false;

    if (secret) {
      const body = trustedRzpOrderId + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

      isValidSignature = expectedSignature === razorpay_signature;
    } else {
      isValidSignature = razorpay_signature === "mock_test_signature";
    }

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Cannot complete payment: "${item.name}" is no longer available in the catalog.`,
        });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot complete payment: "${product.name}" is out of stock (Available stock: ${product.stock}, required: ${item.quantity}). Please cancel this order or browse other products.`,
        });
      }
    }

    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    for (const item of order.items) {
      const prod = await Product.findById(item.product);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
        await prod.save();
      }
    }

    const customer = await Customer.findById(req.user._id);
    if (customer) {
      customer.cart = [];
      await customer.save();
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified and order placed successfully",
      order,
    });
  } catch (error) {
    console.error("verifyPayment error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during payment verification",
    });
  }
};

// @desc    Get current authenticated user's orders
// @route   GET /orders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate("items.product").sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("getMyOrders error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get single order details by ID
// @route   GET /orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id).populate("items.product");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You do not own this order.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("getOrderById error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Cancel a pending order
// @route   DELETE /orders/:id
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You do not own this order.",
      });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({
        success: false,
        message: "Paid orders cannot be cancelled directly.",
      });
    }

    await Order.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error("cancelOrder error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during order cancellation",
    });
  }
};

// @desc    Initiate or retry payment for an existing pending order (generates active Razorpay order)
// @route   POST /orders/:id/pay
// @access  Private
const payForOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id).populate("items.product");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You do not own this order.",
      });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({
        success: false,
        message: "This order has already been paid.",
      });
    }

    for (const item of order.items) {
      const prod = item.product || (await Product.findById(item.product));
      if (!prod) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.name}" is no longer available in the catalog.`,
        });
      }
      if (prod.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Product "${prod.name}" is out of stock (Available: ${prod.stock}, required: ${item.quantity}).`,
        });
      }
    }

    let razorpayOrderId = "";
    let isMock = false;
    let mockReason = "";

    try {
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(order.totalAmount * 100),
        currency: "INR",
        receipt: order._id.toString(),
      });
      razorpayOrderId = razorpayOrder.id;
    } catch (rzpErr) {
      const errMsg =
        rzpErr?.error?.description || rzpErr?.message || JSON.stringify(rzpErr);
      console.warn("Razorpay API call warning during order repayment:", errMsg);
      razorpayOrderId = "order_mock_" + crypto.randomBytes(7).toString("hex");
      isMock = true;
      mockReason = errMsg;
    }

    order.razorpayOrderId = razorpayOrderId;
    await order.save();

    return res.status(200).json({
      success: true,
      shopKartOrderId: order._id,
      razorpayOrderId: order.razorpayOrderId,
      amount: Math.round(order.totalAmount * 100),
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID || null,
      shippingAddress: order.shippingAddress,
      isMock,
      mockReason,
    });
  } catch (error) {
    console.error("payForOrder error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error initiating payment",
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  cancelOrder,
  payForOrder,
};
