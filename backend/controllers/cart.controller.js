const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

// @desc    Add product to cart (or increment quantity if already exists)
// @route   POST /cart/:productId
// @access  Private
const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const existingIndex = customer.cart.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    let targetQuantity = 1;
    if (existingIndex > -1) {
      targetQuantity = customer.cart[existingIndex].quantity + 1;
    }

    if (targetQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Cannot add to cart. Requested quantity (${targetQuantity}) exceeds available stock (${product.stock}).`,
      });
    }

    if (existingIndex > -1) {
      customer.cart[existingIndex].quantity = targetQuantity;
    } else {
      customer.cart.push({ product: productId, quantity: 1 });
    }

    await customer.save();
    await customer.populate({
      path: "cart.product",
      select: "name price category image stock description",
    });

    return res.status(200).json({
      success: true,
      message: "Cart updated",
      cart: customer.cart,
    });
  } catch (error) {
    console.error("addToCart error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get authenticated user's cart
// @route   GET /cart
// @access  Private
const getCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: "cart.product",
      select: "name price category image stock description",
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      cart: customer.cart,
    });
  } catch (error) {
    console.error("getCart error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Update quantity of product in cart
// @route   PATCH /cart/:productId
// @access  Private
const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const numQty = Number(quantity);
    if (typeof quantity === "undefined" || isNaN(numQty) || numQty < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const cartItem = customer.cart.find(
      (item) => item.product.toString() === productId.toString()
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    if (numQty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Quantity (${numQty}) exceeds available stock (${product.stock}).`,
      });
    }

    cartItem.quantity = numQty;

    await customer.save();
    await customer.populate({
      path: "cart.product",
      select: "name price category image stock description",
    });

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated",
      cart: customer.cart,
    });
  } catch (error) {
    console.error("updateQuantity error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Remove product from cart
// @route   DELETE /cart/:productId
// @access  Private
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const exists = customer.cart.some(
      (item) => item.product.toString() === productId.toString()
    );

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    customer.cart = customer.cart.filter(
      (item) => item.product.toString() !== productId.toString()
    );

    await customer.save();
    await customer.populate({
      path: "cart.product",
      select: "name price category image stock description",
    });

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart: customer.cart,
    });
  } catch (error) {
    console.error("removeFromCart error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateQuantity,
  removeFromCart,
};
