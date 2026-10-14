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
    return true;
  }
  if (isConnecting) {
    return false;
  }
  try {
    isConnecting = true;
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected");
    return true;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    return false;
  } finally {
    isConnecting = false;
  }
};

// Database connection middleware with clear diagnostic feedback
app.use(async (req, res, next) => {
  // Allow health check / root routes through even if database is connecting
  if (
    req.path === "/" ||
    req.path === "/api" ||
    req.path === "/health" ||
    req.path === "/api/health"
  ) {
    return next();
  }

  await connectDB();

  if (mongoose.connection.readyState < 1) {
    return res.status(503).json({
      success: false,
      message:
        "Database connection unavailable. If you deployed to Vercel, please ensure MONGO_URI is set to your MongoDB Atlas cloud URI in Vercel Project Settings > Environment Variables (cloud servers cannot reach 127.0.0.1).",
    });
  }
  next();
});

// Unified API Router (handles routes whether /api prefix is present or stripped by Vercel rewrites)
const apiRouter = express.Router();
apiRouter.use("/customers", customerRoutes);
apiRouter.use("/products", productRoutes);
apiRouter.use("/wishlist", wishlistRoutes);
apiRouter.use("/cart", cartRoutes);
apiRouter.use("/orders", orderRoutes);

apiRouter.get(["/", "/health"], (req, res) => {
  res.json({
    success: true,
    message: "ShopKart API is running",
    environment: process.env.NODE_ENV || "development",
    database: mongoose.connection.readyState >= 1 ? "connected" : "disconnected",
  });
});

// Mount on both /api and root /
app.use("/api", apiRouter);
app.use("/", apiRouter);

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
