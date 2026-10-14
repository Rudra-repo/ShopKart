const path = require("path");
// Support .env in root as well as in backend directory
require("dotenv").config({ path: path.join(__dirname, "../.env") });
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const customerRoutes = require("./routes/customer.routes");
const productRoutes = require("./routes/product.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");

const app = express();

// CORS Middleware with credentials enabled for cookies
app.use(
  cors({
    origin: function (origin, callback) {
      // In production and dev, allow credentials
      callback(null, true);
    },
    credentials: true,
  })
);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Database connection with state caching for serverless environments (Vercel)
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shopkart";
let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  if (isConnecting) {
    return;
  }
  try {
    isConnecting = true;
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  } finally {
    isConnecting = false;
  }
};

// Ensure database connection before processing API routes
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Routes (mounted at both / and /api for seamless local dev & Vercel serverless functions)
app.use("/api/customers", customerRoutes);
app.use("/customers", customerRoutes);

app.use("/api/products", productRoutes);
app.use("/products", productRoutes);

app.use("/api/wishlist", wishlistRoutes);
app.use("/wishlist", wishlistRoutes);

app.use("/api/cart", cartRoutes);
app.use("/cart", cartRoutes);

app.use("/api/orders", orderRoutes);
app.use("/orders", orderRoutes);

// Health check route
app.get(["/", "/api"], (req, res) => {
  res.json({
    success: true,
    message: "ShopKart API is running",
    environment: process.env.NODE_ENV || "development",
  });
});

const PORT = process.env.PORT || 8082;

// Standalone server execution (e.g. npm run server or node backend/index.js)
if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

module.exports = app;
