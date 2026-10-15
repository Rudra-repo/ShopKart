import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../services/api";

const CartContext = createContext();

export const CartProvider = ({ children, user }) => {
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load user's cart on mount or when user session changes
  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCart();
      if (response.success) {
        const validItems = (response.cart || []).filter((item) => item && item.product);
        setCartItems(validItems);
      } else {
        setError(response.message || "Failed to load cart");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setCartItems([]);
      } else {
        const msg = err.response?.data?.message || "Failed to fetch cart";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user's wishlist on mount or when user session changes
  const fetchWishlist = useCallback(async () => {
    try {
      const response = await getWishlist();
      if (response.success) {
        const validItems = (response.wishlist || []).filter(Boolean);
        setWishlistItems(validItems);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setWishlistItems([]);
      }
    }
  }, []);

  useEffect(() => {
    fetchCart();
    fetchWishlist();
  }, [user, fetchCart, fetchWishlist]);

  // Derived Values
  const cartCount = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);

  const subtotal = cartItems.reduce((total, item) => {
    const price = item.product?.price || 0;
    const qty = item.quantity || 0;
    return total + price * qty;
  }, 0);

  const wishlistCount = wishlistItems.length;

  const isItemWishlisted = useCallback(
    (productId) => {
      if (!productId) return false;
      return wishlistItems.some((item) => {
        const id = typeof item === "object" ? item._id : item;
        return id?.toString() === productId?.toString();
      });
    },
    [wishlistItems]
  );

  // Actions
  const toggleWishlist = async (productId) => {
    const currentlyWishlisted = isItemWishlisted(productId);
    try {
      if (currentlyWishlisted) {
        const response = await removeFromWishlist(productId);
        if (response.success) {
          const validItems = (response.wishlist || []).filter(Boolean);
          setWishlistItems(validItems);
          return { success: true, isWishlisted: false };
        }
      } else {
        const response = await addToWishlist(productId);
        if (response.success) {
          const validItems = (response.wishlist || []).filter(Boolean);
          setWishlistItems(validItems);
          return { success: true, isWishlisted: true };
        }
      }
    } catch (err) {
      if (err.response?.status === 409) {
        // Already in wishlist
        fetchWishlist();
        return { success: true, isWishlisted: true };
      }
      throw err;
    }
  };

  const addItemToCart = async (productId) => {
    setError(null);
    try {
      const response = await addToCart(productId);
      if (response.success) {
        const validItems = (response.cart || []).filter((item) => item && item.product);
        setCartItems(validItems);
        return response;
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add item to cart";
      setError(msg);
      throw err;
    }
  };

  const updateItemQuantity = async (productId, newQuantity) => {
    setError(null);
    try {
      const response = await updateCartQuantity(productId, newQuantity);
      if (response.success) {
        const validItems = (response.cart || []).filter((item) => item && item.product);
        setCartItems(validItems);
        return response;
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update quantity";
      setError(msg);
      throw err;
    }
  };

  const removeItemFromCart = async (productId) => {
    setError(null);
    try {
      const response = await removeFromCart(productId);
      if (response.success) {
        const validItems = (response.cart || []).filter((item) => item && item.product);
        setCartItems(validItems);
        return response;
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to remove item";
      setError(msg);
      throw err;
    }
  };

  const clearCartState = () => {
    setCartItems([]);
    setError(null);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        wishlistItems,
        loading,
        error,
        cartCount,
        wishlistCount,
        subtotal,
        fetchCart,
        fetchWishlist,
        isItemWishlisted,
        toggleWishlist,
        addItemToCart,
        updateItemQuantity,
        removeItemFromCart,
        clearCartState,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
