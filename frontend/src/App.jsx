import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderSuccess from "./pages/OrderSuccess";
import { CartProvider } from "./context/CartContext";
import { getMyProfile } from "./services/api";
import ErrorBoundary from "./components/ErrorBoundary";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, [pathname]);

  return null;
};

const AnimatedRoutes = ({ user, setUser }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/order-success/:id" element={<OrderSuccess />} />
          <Route path="/orders/:id" element={<OrderSuccess />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home user={user} setUser={setUser} />} />
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const profile = await getMyProfile();
        if (profile && profile._id) {
          setUser(profile);
        }
      } catch (err) {
        // User is unauthenticated, leave as null
      }
    };
    fetchCurrentUser();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <CartProvider user={user}>
        <div className="app-container">
          <Navbar user={user} setUser={setUser} />
          <ErrorBoundary>
            <AnimatedRoutes user={user} setUser={setUser} />
          </ErrorBoundary>
        </div>
      </CartProvider>
    </Router>
  );
}

export default App;
