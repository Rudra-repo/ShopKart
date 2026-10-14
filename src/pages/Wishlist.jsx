import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, ArrowLeft, RefreshCw, AlertCircle, Trash2, ArrowRight } from "lucide-react";
import { getWishlist, removeFromWishlist } from "../services/api";

const Wishlist = () => {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const fetchWishlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getWishlist();
      if (response.success) {
        // Filter out any potential nulls if products were deleted from DB
        const validItems = (response.wishlist || []).filter(Boolean);
        setWishlistItems(validItems);
      } else {
        setError(response.message || "Failed to load wishlist");
      }
    } catch (err) {
      console.error("Fetch wishlist error:", err);
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      const msg = err.response?.data?.message || "Failed to load wishlist. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemoveItem = async (productId) => {
    setRemovingId(productId);
    try {
      const response = await removeFromWishlist(productId);
      if (response.success) {
        setWishlistItems((prev) => prev.filter((item) => item._id !== productId));
      }
    } catch (err) {
      console.error("Remove from wishlist error:", err);
      alert(err.response?.data?.message || "Failed to remove item from wishlist");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="full-screen-loader">
        <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }}></div>
        <p>Loading your saved items...</p>
      </div>
    );
  }

  return (
    <div className="products-container" style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Header Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={() => navigate(-1)} className="btn-outline" style={{ padding: "0.5rem 0.8rem" }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: "1.75rem", margin: 0, display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Heart size={24} fill="#ef4444" color="#ef4444" /> My Wishlist
            </h1>
            <p className="page-subtitle" style={{ margin: 0, fontSize: "0.9rem" }}>
              {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"} saved for later
            </p>
          </div>
        </div>

        <Link to="/products" className="btn-outline" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <ShoppingBag size={16} /> Browse Products
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <div className="glass-card error-state" style={{ marginBottom: "2rem", padding: "2rem", textAlign: "center" }}>
          <AlertCircle size={48} className="error-icon" style={{ color: "#ef4444", marginBottom: "1rem" }} />
          <h3>Unable to Load Wishlist</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem" }}>{error}</p>
          <button onClick={fetchWishlist} className="btn-primary" style={{ margin: "0 auto" }}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!error && wishlistItems.length === 0 && (
        <div className="glass-card empty-state" style={{ padding: "4rem 2rem", textAlign: "center", maxWidth: 600, margin: "2rem auto" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <Heart size={36} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Your Wishlist is Empty</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem", lineHeight: 1.6 }}>
            You haven't added any products to your wishlist yet. Explore our catalog and tap the heart icon to save products for later!
          </p>
          <Link to="/products" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.85rem 1.75rem" }}>
            <ShoppingBag size={18} /> Start Shopping <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Populated Wishlist Grid */}
      {!error && wishlistItems.length > 0 && (
        <div className="products-grid">
          {wishlistItems.map((product) => {
            const formattedPrice = new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(product.price);

            const isRemoving = removingId === product._id;

            return (
              <div key={product._id} className="glass-card product-card">
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
                  <span className="category-badge">{product.category}</span>

                  <button
                    onClick={() => handleRemoveItem(product._id)}
                    disabled={isRemoving}
                    className="wishlist-badge-btn active"
                    title="Remove from Wishlist"
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </button>
                </div>

                <div className="product-body">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">{product.description}</p>

                  <div className="product-meta">
                    <div className="product-price">{formattedPrice}</div>
                    <div className={`stock-status ${product.stock > 0 ? "available" : "empty"}`}>
                      {product.stock > 0 ? `${product.stock} left` : "Out of Stock"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                    <Link to={`/products/${product._id}`} className="btn-primary product-action-btn" style={{ flex: 1 }}>
                      <span>View Details</span>
                      <ArrowRight size={16} />
                    </Link>
                    <button
                      onClick={() => handleRemoveItem(product._id)}
                      disabled={isRemoving}
                      className="btn-outline"
                      style={{ padding: "0.6rem 0.8rem", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.3)" }}
                      title="Remove from Wishlist"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
