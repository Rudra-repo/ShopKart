import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Heart,
  ShoppingCart,
  ArrowRight,
  Package,
} from "lucide-react";
import { getMyProfile, getWishlist, getMyOrders } from "../services/api";
import { useCart } from "../context/CartContext";

const Home = ({ user, setUser }) => {
  const navigate = useNavigate();
  const { cartCount } = useCart();

  const [loading, setLoading] = useState(!user);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [latestOrder, setLatestOrder] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        const profileData = await getMyProfile();
        if (isMounted) {
          setUser(profileData);
          setLoading(false);
        }

        // Fetch Wishlist count
        try {
          const wishRes = await getWishlist();
          if (isMounted && wishRes.success) {
            setWishlistCount((wishRes.wishlist || []).length);
          }
        } catch (e) {
          console.warn("Could not fetch wishlist count:", e);
        }

        // Fetch Orders count & latest order
        try {
          const orderRes = await getMyOrders();
          if (isMounted && orderRes.success) {
            const orders = orderRes.orders || [];
            setOrdersCount(orders.length);
            if (orders.length > 0) {
              setLatestOrder(orders[0]);
            }
          }
        } catch (e) {
          console.warn("Could not fetch orders count:", e);
        }
      } catch (err) {
        if (isMounted) {
          setLoading(false);
          navigate("/login");
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [navigate, setUser]);

  if (loading) {
    return (
      <div className="full-screen-loader">
        <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }}></div>
        <p>Loading your ShopKart profile...</p>
      </div>
    );
  }

  if (!user && !loading) {
    return null;
  }

  const initialLetter = user.fullName ? user.fullName.charAt(0).toUpperCase() : "U";

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card welcome-banner"
      >
        <div className="welcome-header">
          <div className="avatar-lg">{initialLetter}</div>
          <div className="welcome-text">
            <h1>Welcome back, {user.fullName}!</h1>
            <p>Here is your ShopKart customer account overview</p>
            <div className="user-badge">
              <ShieldCheck size={14} /> Verified ShopKart Customer
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid layout */}
      <div className="dashboard-grid">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="glass-card profile-card"
        >
          <h2 className="card-title">
            <User size={20} className="info-icon" /> Customer Profile
          </h2>

          <div className="info-list">
            <div className="info-item">
              <div className="info-icon">
                <User size={18} />
              </div>
              <div className="info-content">
                <label>Full Name</label>
                <p>{user.fullName}</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <Mail size={18} />
              </div>
              <div className="info-content">
                <label>Email Address</label>
                <p>{user.email}</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <Phone size={18} />
              </div>
              <div className="info-content">
                <label>Phone Number</label>
                <p>{user.phone}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Shop Overview / Features Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="glass-card shop-card"
        >
          <h2 className="card-title">
            <ShoppingBag size={20} className="info-icon" /> Quick Dashboard
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {/* Orders Card */}
            <motion.div
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/orders")}
              style={{
                background: "rgba(18, 18, 22, 0.6)",
                padding: "1.25rem",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              className="dashboard-quick-card"
            >
              <Package size={24} color="#ffffff" style={{ marginBottom: "0.5rem" }} />
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>My Orders</span>
                <ArrowRight size={14} color="var(--text-muted)" />
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                {ordersCount} {ordersCount === 1 ? "order" : "orders"} placed
              </p>
            </motion.div>

            {/* Wishlist Card */}
            <motion.div
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/wishlist")}
              style={{
                background: "rgba(18, 18, 22, 0.6)",
                padding: "1.25rem",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              className="dashboard-quick-card"
            >
              <Heart size={24} color="#ec4899" style={{ marginBottom: "0.5rem" }} />
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Wishlist</span>
                <ArrowRight size={14} color="var(--text-muted)" />
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                {wishlistCount} {wishlistCount === 1 ? "saved item" : "saved items"}
              </p>
            </motion.div>

            {/* Shopping Cart Card */}
            <motion.div
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/cart")}
              style={{
                background: "rgba(18, 18, 22, 0.6)",
                padding: "1.25rem",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              className="dashboard-quick-card"
            >
              <ShoppingCart size={24} color="#e4e4e7" style={{ marginBottom: "0.5rem" }} />
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Cart</span>
                <ArrowRight size={14} color="var(--text-muted)" />
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                {cartCount} {cartCount === 1 ? "item in cart" : "items in cart"}
              </p>
            </motion.div>

            {/* Delivery Status Card */}
            <motion.div
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/orders")}
              style={{
                background: "rgba(10, 19, 15, 0.6)",
                padding: "1.25rem",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              className="dashboard-quick-card"
            >
              <Truck size={24} color="#14b8a6" style={{ marginBottom: "0.5rem" }} />
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Delivery</span>
                <ArrowRight size={14} color="var(--text-muted)" />
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                {latestOrder ? `Latest: ${latestOrder.status}` : "Express Shipping Active"}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
