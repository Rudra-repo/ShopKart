import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShoppingBag,
  Tag,
  PackageCheck,
  PackageX,
  ShieldCheck,
  Truck,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Heart,
} from "lucide-react";
import { getProductById } from "../services/api";
import { useCart } from "../context/CartContext";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cartItems, addItemToCart, isItemWishlisted, toggleWishlist } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [cartError, setCartError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getProductById(id);
        if (response.success && response.product) {
          setProduct(response.product);
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error("Fetch product details error:", err);
        const msg = err.response?.data?.message || "Failed to load product details";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const inCartItem = product ? cartItems.find((item) => item.product?._id === product._id) : null;
  const inCartQty = inCartItem ? inCartItem.quantity : 0;
  const isWishlisted = product ? isItemWishlisted(product._id) : false;

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0) return;
    setCartLoading(true);
    setCartError("");
    try {
      await addItemToCart(product._id);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2500);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        const msg = err.response?.data?.message || "Failed to add to cart";
        setCartError(msg);
        setTimeout(() => setCartError(""), 3500);
      }
    } finally {
      setCartLoading(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!product) return;
    setWishlistLoading(true);
    setCartError("");
    try {
      await toggleWishlist(product._id);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setCartError(err.response?.data?.message || "Failed to update wishlist");
        setTimeout(() => setCartError(""), 3500);
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  const formattedPrice = product
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(product.price)
    : "";

  if (loading) {
    return (
      <div className="full-screen-loader">
        <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }}></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-details-container">
        <div className="glass-card error-state">
          <AlertTriangle size={54} className="error-icon" />
          <h2>Product Not Found</h2>
          <p>{error || "The requested product does not exist or has been removed."}</p>
          <button onClick={() => navigate("/products")} className="btn-primary" style={{ marginTop: "1.25rem" }}>
            <ArrowLeft size={16} /> Back to Products
          </button>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="product-details-container">
      {/* Back Button */}
      <button onClick={() => navigate(-1)} className="btn-outline" style={{ marginBottom: "1.5rem" }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Main Details Card */}
      <div className="glass-card details-card">
        {/* Left Image Showcase */}
        <div className="details-image-wrapper">
          <img
            src={product.image}
            alt={product.name}
            className="details-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&q=80";
            }}
          />
        </div>

        {/* Right Info Section */}
        <div className="details-info-section">
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(255, 255, 255, 0.1)", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.25)", padding: "0.3rem 0.8rem", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 700, width: "fit-content", marginBottom: "1rem" }}>
            <Tag size={13} /> {product.category}
          </div>

          <h1 className="details-title">{product.name}</h1>

          <div className="details-price">{formattedPrice}</div>

          <div style={{ marginBottom: "1.5rem" }}>
            {isOutOfStock ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.85rem", borderRadius: "8px", fontSize: "0.88rem", fontWeight: 600, background: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                <PackageX size={16} /> Out of Stock
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.85rem", borderRadius: "8px", fontSize: "0.88rem", fontWeight: 600, background: "rgba(255, 255, 255, 0.1)", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.25)" }}>
                <PackageCheck size={16} /> In Stock ({product.stock} units left)
              </span>
            )}
          </div>

          <p style={{ fontSize: "1.05rem", color: "var(--text-muted)", lineHeight: 1.65, marginBottom: "2rem" }}>
            {product.description}
          </p>

          {cartError && (
            <div className="wishlist-error-inline" style={{ marginBottom: "1rem" }}>
              {cartError}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || cartLoading}
              className="btn-primary"
              style={{ flex: 1, minWidth: 200, padding: "0.95rem 1.75rem", fontSize: "1.05rem", justifyContent: "center" }}
            >
              {cartLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Adding...
                </>
              ) : addedToCart ? (
                <>
                  <CheckCircle2 size={18} /> Added to Cart!
                </>
              ) : inCartQty > 0 ? (
                <>
                  <ShoppingBag size={18} /> Add Another ({inCartQty} in Cart)
                </>
              ) : (
                <>
                  <ShoppingBag size={18} /> Add to Cart
                </>
              )}
            </button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className="btn-outline"
              style={{
                padding: "0.95rem 1.5rem",
                fontSize: "1rem",
                color: isWishlisted ? "#ef4444" : "var(--text-main)",
                borderColor: isWishlisted ? "rgba(239, 68, 68, 0.5)" : "var(--bg-card-border)",
                background: isWishlisted ? "rgba(239, 68, 68, 0.15)" : "transparent",
              }}
              title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
            >
              {wishlistLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Heart size={18} fill={isWishlisted ? "#ef4444" : "none"} color={isWishlisted ? "#ef4444" : "currentColor"} />
                  <span>{isWishlisted ? "Wishlisted" : "Wishlist"}</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Value Props & Assurance Badges */}
          <div style={{ marginTop: "2rem", paddingTop: "1.75rem", borderTop: "1px solid var(--bg-card-border)", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
              <Truck size={18} color="#ffffff" />
              <span>Free Express Shipping</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
              <ShieldCheck size={18} color="#e4e4e7" />
              <span>100% Authentic Product</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
              <RotateCcw size={18} color="#d4d4d8" />
              <span>7 Days Easy Return Policy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
