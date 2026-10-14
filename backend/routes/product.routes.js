const express = require("express");
const {
  createProduct,
  getAllProducts,
  getProductById,
  seedProducts,
} = require("../controllers/product.controller");

const router = express.Router();

router.post("/", createProduct);
router.get("/", getAllProducts);
router.post("/seed", seedProducts);
router.get("/:id", getProductById);

module.exports = router;
