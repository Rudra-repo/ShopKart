import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Tag,
  Loader2,
} from "lucide-react";
import { useCart } from "../context/CartContext";

const Cart = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    loading,
    error,
    cartCount,
    subtotal,
    updateItemQuantity,
    removeItemFromCart,
    fetchCart,
  } = useCart();

  const [updatingId, setUpdatingId] = useState(null);
  const [itemErrors, setItemErrors] = useState({});

  const handleQuantityChange = async (productId, currentQty, delta, stock) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    if (newQty > stock) {
      setItemErrors((prev) => ({
        ...prev,
        [productId]: `Cannot exceed available stock (${stock} units)`,
      }));
      setTimeout(() => {
        setItemErrors((prev) => ({ ...prev, [productId]: null }));
      }, 3000);
      return;
    }

    setUpdatingId(productId);
    setItemErrors((prev) => ({ ...prev, [productId]: null }));
    try {
      await updateItemQuantity(productId, newQty);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update quantity";
      setItemErrors((prev) => ({ ...prev, [productId]: msg }));
      setTimeout(() => {
        setItemErrors((prev) => ({ ...prev, [productId]: null }));
      }, 3500);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (productId) => {
    setUpdatingId(productId);
    try {
      await removeItemFromCart(productId);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove item");
    } finally {
      setUpdatingId(null);
    }
  };

  const formattedSubtotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(subtotal);

  if (loading) {
    return (
      <div className="full-screen-loader">
        <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }}></div>
        <p>Loading your cart...</p>
      </div>
    );
  }

  return (
    <div className="products-container" style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={() => navigate(-1)} className="btn-outline" style={{ padding: "0.5rem 0.8rem" }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: "1.75rem", margin: 0, display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <ShoppingBag size={24} color="#ffffff" /> My Cart
            </h1>
            <p className="page-subtitle" style={{ margin: 0, fontSize: "0.9rem" }}>
              {cartCount} {cartCount === 1 ? "unit" : "total units"} in your cart
            </p>
          </div>
        </div>

        <Link to="/products" className="btn-outline" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <ShoppingBag size={16} /> Continue Shopping
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <div className="glass-card error-state" style={{ marginBottom: "2rem", padding: "2rem", textAlign: "center" }}>
          <AlertCircle size={48} className="error-icon" style={{ color: "#ef4444", marginBottom: "1rem" }} />
          <h3>Unable to Load Cart</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem" }}>{error}</p>
          <button onClick={fetchCart} className="btn-primary" style={{ margin: "0 auto" }}>
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!error && cartItems.length === 0 && (
        <div className="glass-card empty-state" style={{ padding: "4rem 2rem", textAlign: "center", maxWidth: 600, margin: "2rem auto" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255, 255, 255, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <ShoppingBag size={36} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Your cart is empty 🛒</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem", lineHeight: 1.6 }}>
            Looks like you haven't added anything to your cart yet. Explore our product catalog to find great items!
          </p>
          <Link to="/products" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.85rem 1.75rem" }}>
            <ShoppingBag size={18} /> Browse Products <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Populated Cart Layout */}
      {!error && cartItems.length > 0 && (
        <div className="cart-layout-grid">
          {/* Cart Items List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {cartItems.map((item) => {
              const product = item.product;
              if (!product) return null;

              const isUpdating = updatingId === product._id;
              const itemTotal = product.price * item.quantity;
              const formattedPrice = new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(product.price);

              const formattedItemTotal = new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(itemTotal);

              return (
                <div key={product._id} className="glass-card cart-item-card-responsive">
                  <div className="cart-item-meta-row">
                    {/* Product Thumbnail */}
                    <div style={{ width: 80, height: 80, borderRadius: "12px", overflow: "hidden", background: "#0e0e12", flexShrink: 0, border: "1px solid var(--bg-card-border)" }}>
                      <img
                        src={product.image}
                        alt={product.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&q=80";
                        }}
                      />
                    </div>

                    {/* Product Meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#a1a1aa", marginBottom: "0.25rem" }}>
                        <Tag size={11} /> {product.category}
                      </div>
                      <h3 style={{ fontSize: "1.02rem", fontWeight: 700, margin: "0 0 0.25rem 0", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {product.name}
                      </h3>
                      <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-muted)" }}>
                        {formattedPrice} per unit
                      </div>

                      {itemErrors[product._id] && (
                        <div className="wishlist-error-inline" style={{ marginTop: "0.4rem", fontSize: "0.8rem" }}>
                          {itemErrors[product._id]}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="cart-item-action-row">
                    {/* Quantity Controls */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.35rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(18, 18, 22, 0.7)", padding: "0.3rem 0.6rem", borderRadius: "8px", border: "1px solid var(--bg-card-border)" }}>
                        <button
                          onClick={() => handleQuantityChange(product._id, item.quantity, -1, product.stock)}
                          disabled={isUpdating || item.quantity <= 1}
                          className="btn-outline"
                          style={{ padding: "0.25rem", minWidth: 28, height: 28, borderRadius: "6px" }}
                          title="Decrease Quantity"
                        >
                          <Minus size={14} />
                        </button>

                        <span style={{ fontWeight: 700, minWidth: 24, textAlign: "center", fontSize: "0.95rem" }}>
                          {isUpdating ? <Loader2 size={14} className="animate-spin" /> : item.quantity}
                        </span>

                        <button
                          onClick={() => handleQuantityChange(product._id, item.quantity, 1, product.stock)}
                          disabled={isUpdating || item.quantity >= product.stock}
                          className="btn-outline"
                          style={{ padding: "0.25rem", minWidth: 28, height: 28, borderRadius: "6px" }}
                          title="Increase Quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemove(product._id)}
                        disabled={isUpdating}
                        style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.2rem" }}
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>

                    {/* Item Total Price */}
                    <div style={{ textAlign: "right", minWidth: 80 }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Total</span>
                      <div style={{ fontSize: "1.15rem", fontWeight: 800 }} className="price-gradient">
                        {formattedItemTotal}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Sidebar */}
          <div className="glass-card" style={{ padding: "1.5rem", position: "sticky", top: "90px" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.25rem", borderBottom: "1px solid var(--bg-card-border)", paddingBottom: "0.75rem" }}>
              Order Summary
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                <span>Total Items:</span>
                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{cartItems.length} products ({cartCount} units)</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{formattedSubtotal}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                <span>Shipping:</span>
                <span style={{ fontWeight: 600, color: "#ffffff" }}>FREE</span>
              </div>

              <div style={{ borderTop: "1px dashed var(--bg-card-border)", paddingTop: "0.85rem", display: "flex", justifyContent: "space-between", fontSize: "1.15rem", fontWeight: 800 }}>
                <span>Total:</span>
                <span className="price-gradient">{formattedSubtotal}</span>
              </div>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "0.85rem", fontSize: "1rem" }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </button>

            <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)", justifyContent: "center" }}>
              <ShieldCheck size={16} color="#06b6d4" />
              <span>100% Secure Checkout Guaranteed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
