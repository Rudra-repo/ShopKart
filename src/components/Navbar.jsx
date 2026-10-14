import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingBag,
  LogOut,
  User,
  LogIn,
  UserPlus,
  Grid,
  Heart,
  ShoppingCart,
  Package,
  Menu,
  X,
} from "lucide-react";
import { logoutCustomer } from "../services/api";
import { useCart } from "../context/CartContext";

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount, clearCartState } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await logoutCustomer();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearCartState();
      setUser(null);
      setMobileMenuOpen(false);
      navigate("/login");
    }
  };

  return (
    <>
      <header className="navbar">
        <Link to="/products" className="nav-brand">
          <div className="brand-icon-wrapper">
            <ShoppingBag size={22} color="#ffffff" />
          </div>
          <span className="brand-title">
            Shop<span style={{ color: "#34d399" }}>Kart</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="nav-links">
          <Link
            to="/products"
            className={`nav-link ${location.pathname === "/products" ? "active" : ""}`}
          >
            <Grid size={16} style={{ marginRight: 6 }} />
            Products
          </Link>

          <Link
            to="/wishlist"
            className={`nav-link ${location.pathname === "/wishlist" ? "active" : ""}`}
          >
            <Heart size={16} style={{ marginRight: 6 }} />
            Wishlist
          </Link>

          <Link
            to="/cart"
            className={`nav-link ${location.pathname === "/cart" ? "active" : ""}`}
          >
            <ShoppingCart size={16} style={{ marginRight: 6 }} />
            Cart {cartCount > 0 ? `(${cartCount})` : "(0)"}
          </Link>

          {user ? (
            <>
              <Link
                to="/orders"
                className={`nav-link ${location.pathname.startsWith("/orders") ? "active" : ""}`}
              >
                <Package size={16} style={{ marginRight: 6 }} />
                Orders
              </Link>

              <Link
                to="/home"
                className={`nav-link ${location.pathname === "/home" ? "active" : ""}`}
              >
                <User size={16} style={{ marginRight: 6 }} />
                Profile ({user?.fullName ? user.fullName.split(" ")[0] : "Account"})
              </Link>

              <button onClick={handleLogout} className="btn-logout">
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`nav-link ${location.pathname === "/login" ? "active" : ""}`}
              >
                <LogIn size={16} style={{ marginRight: 4 }} />
                Login
              </Link>

              <Link to="/register" className="btn-primary" style={{ padding: "0.55rem 1.1rem" }}>
                <UserPlus size={16} />
                Register
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Hamburger Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" role="dialog" aria-modal="true">
          <Link
            to="/products"
            onClick={() => setMobileMenuOpen(false)}
            className={`mobile-nav-link ${location.pathname === "/products" ? "active" : ""}`}
          >
            <Grid size={18} />
            Products
          </Link>

          <Link
            to="/wishlist"
            onClick={() => setMobileMenuOpen(false)}
            className={`mobile-nav-link ${location.pathname === "/wishlist" ? "active" : ""}`}
          >
            <Heart size={18} />
            Wishlist
          </Link>

          <Link
            to="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className={`mobile-nav-link ${location.pathname === "/cart" ? "active" : ""}`}
          >
            <ShoppingCart size={18} />
            Cart
            <span className="mobile-nav-badge">{cartCount}</span>
          </Link>

          {user && (
            <Link
              to="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className={`mobile-nav-link ${location.pathname.startsWith("/orders") ? "active" : ""}`}
            >
              <Package size={18} />
              My Orders
            </Link>
          )}

          <div className="mobile-nav-divider" />

          {user ? (
            <div className="mobile-nav-footer">
              <Link
                to="/home"
                onClick={() => setMobileMenuOpen(false)}
                className={`mobile-nav-link ${location.pathname === "/home" ? "active" : ""}`}
              >
                <User size={18} />
                Profile ({user?.fullName || "Account"})
              </Link>

              <button
                onClick={handleLogout}
                className="btn-outline"
                style={{ width: "100%", padding: "0.85rem", justifyContent: "center" }}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <div className="mobile-nav-footer">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-outline"
                style={{ width: "100%", padding: "0.85rem", justifyContent: "center" }}
              >
                <LogIn size={16} /> Login
              </Link>

              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary"
                style={{ width: "100%", padding: "0.85rem", justifyContent: "center" }}
              >
                <UserPlus size={16} /> Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Navbar;
