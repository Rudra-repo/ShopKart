const mongoose = require("mongoose");
const Product = require("../models/product.model");

// CREATE PRODUCT (POST /products)
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    // Validate required fields
    if (
      !name ||
      !description ||
      price === undefined ||
      price === null ||
      !category ||
      !image ||
      stock === undefined ||
      stock === null
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required product fields",
      });
    }

    const numPrice = Number(price);
    const numStock = Number(stock);

    // Validate price
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a number greater than 0",
      });
    }

    // Validate stock
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: numPrice,
      category: category.trim(),
      image: image.trim(),
      stock: numStock,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create product",
    });
  }
};

// GET ALL PRODUCTS (GET /products?search=...&category=...&sort=...)
const getAllProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    const query = {};

    // Search filter (case-insensitive name regex)
    if (search && search.trim() !== "") {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    // Category filter
    if (category && category.trim() !== "" && category.trim().toLowerCase() !== "all") {
      query.category = { $regex: `^${category.trim()}$`, $options: "i" };
    }

    // Sorting option (Bonus Challenge)
    let sortOption = { createdAt: -1 };
    if (sort === "price_asc") {
      sortOption = { price: 1 };
    } else if (sort === "price_desc") {
      sortOption = { price: -1 };
    }

    const products = await Product.find(query).sort(sortOption);

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get All Products Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching products",
    });
  }
};

// GET SINGLE PRODUCT (GET /products/:id)
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get Single Product Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching product",
    });
  }
};

// SEED SAMPLE PRODUCTS (POST /products/seed)
const seedProducts = async (req, res) => {
  try {
    const count = await Product.countDocuments();
    if (count > 0) {
      const existing = await Product.find();
      return res.status(200).json({
        success: true,
        message: "Products already seeded",
        count: existing.length,
        products: existing,
      });
    }

    const sampleProducts = [
      {
        name: "Noise Cancelling Headphones",
        description: "Wireless over-ear headphones with active noise cancellation and 30-hour battery life.",
        price: 4999,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
        stock: 25,
      },
      {
        name: "Mechanical Gaming Keyboard",
        description: "RGB mechanical keyboard with tactile blue switches and detachable USB-C cable.",
        price: 2999,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
        stock: 10,
      },
      {
        name: "Ergonomic Wireless Mouse",
        description: "Precision wireless mouse with adjustable DPI and silent click technology.",
        price: 1499,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&q=80",
        stock: 40,
      },
      {
        name: "Ultra HD Smart Watch",
        description: "Fitness tracker smart watch with heart rate monitoring, GPS, and AMOLED display.",
        price: 3999,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
        stock: 15,
      },
      {
        name: "Classic Denim Jacket",
        description: "Premium vintage wash cotton denim jacket with button closure and relaxed fit.",
        price: 2499,
        category: "Fashion",
        image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80",
        stock: 18,
      },
      {
        name: "Minimalist Leather Backpack",
        description: "Water-resistant genuine leather laptop backpack with padded compartment.",
        price: 3499,
        category: "Fashion",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
        stock: 8,
      },
      {
        name: "Clean Code Engineering Book",
        description: "A handbook of agile software craftsmanship for developers and architects.",
        price: 899,
        category: "Books",
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80",
        stock: 50,
      },
      {
        name: "Smart Ceramic Coffee Mug",
        description: "Temperature controlled smart coffee mug with smartphone companion app.",
        price: 1999,
        category: "Home",
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80",
        stock: 30,
      },
    ];

    const seeded = await Product.insertMany(sampleProducts);

    return res.status(201).json({
      success: true,
      message: "Sample products seeded successfully",
      count: seeded.length,
      products: seeded,
    });
  } catch (error) {
    console.error("Seed Products Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to seed products",
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  seedProducts,
};
