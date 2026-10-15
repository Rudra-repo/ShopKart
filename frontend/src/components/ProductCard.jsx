import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Tag, PackageCheck, PackageX, Heart, Loader2, ShoppingBag, Check } from "lucide-react";
import { addToWishlist, removeFromWishlist } from "../services/api";
import { useCart } from "../context/CartContext";

const ProductCard = ({ product, onWishlistChange }) => {
  const navigate = useNavigate();
  const { cartItems, addItemToCart, isItemWishlisted, toggleWishlist } = useCart();

  const isWishlisted = isItemWishlisted(product._id);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isOutOfStock = product.stock <= 0;
  const inCartItem = cartItems.find((item) => item.product?._id === product._id);
  const inCartQty = inCartItem ? inCartItem.quantity : 0;

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(product.price);

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistLoading(true);
    setErrorMsg("");

    try {
      const res = await toggleWishlist(product._id);
      if (onWishlistChange) onWishlistChange(product._id, res.isWishlisted);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setErrorMsg(err.response?.data?.message || "Wishlist error");
        setTimeout(() => setErrorMsg(""), 3000);
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    setCartLoading(true);
    setErrorMsg("");

    try {
      await addItemToCart(product._id);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        const msg = err.response?.data?.message || "Failed to add to cart";
        setErrorMsg(msg);
        setTimeout(() => setErrorMsg(""), 3500);
      }
    } finally {
      setCartLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`glass-card product-card ${isOutOfStock ? "out-of-stock" : ""}`}
    >
      {/* Product Image & Badges */}
      <div className="product-image-container">
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&q=80";
          }}
        />
        <span className="category-badge">
          <Tag size={12} /> {product.category}
        </span>

        {/* Wishlist Button */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          className={`wishlist-badge-btn ${isWishlisted ? "active" : ""}`}
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          aria-label="Wishlist"
        >
          {wishlistLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Heart size={16} fill={isWishlisted ? "#ef4444" : "none"} color={isWishlisted ? "#ef4444" : "currentColor"} />
          )}
        </motion.button>
      </div>

      {/* Product Details */}
      <div className="product-body">
        <h3 className="product-name" title={product.name}>
          {product.name}
        </h3>

        <p className="product-description">{product.description}</p>

        {errorMsg && <div className="wishlist-error-inline">{errorMsg}</div>}

        <div className="product-meta">
          <div className="product-price">{formattedPrice}</div>
          <div className={`stock-status ${isOutOfStock ? "empty" : "available"}`}>
            {isOutOfStock ? (
              <>
                <PackageX size={14} /> Out of Stock
              </>
            ) : (
              <>
                <PackageCheck size={14} /> {product.stock} left
              </>
            )}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
          <motion.button
            whileHover={{ scale: isOutOfStock ? 1 : 1.02 }}
            whileTap={{ scale: isOutOfStock ? 1 : 0.97 }}
            type="button"
            onClick={handleAddToCart}
            disabled={cartLoading || isOutOfStock}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "0.65rem 1rem", fontSize: "0.9rem" }}
          >
            {cartLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Adding...</span>
              </>
            ) : addedSuccess ? (
              <>
                <Check size={16} />
                <span>Added to Cart!</span>
              </>
            ) : inCartQty > 0 ? (
              <>
                <ShoppingBag size={16} />
                <span>Add Another ({inCartQty} in Cart)</span>
              </>
            ) : (
              <>
                <ShoppingBag size={16} />
                <span>Add to Cart</span>
              </>
            )}
          </motion.button>

          <Link
            to={`/products/${product._id}`}
            className="btn-outline"
            style={{ width: "100%", justifyContent: "center", padding: "0.55rem 1rem", fontSize: "0.85rem", textDecoration: "none" }}
          >
            <span>View Details</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
