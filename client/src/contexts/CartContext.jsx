"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { apiService } from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadCartFromBackend();
    } else {
      const savedCart = localStorage.getItem("shopeasy-cart");
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem("shopeasy-cart", JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  const loadCartFromBackend = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await apiService.getCart();

      const transformedItems = response.cartItems.map((item) => ({
        _id: item.product._id,
        name: item.product.name,
        price: item.product.price,
        category: item.product.category,
        description: item.product.description,
        image: item.product.image,
        backgroundColor: item.product.backgroundColor,
        quantity: item.quantity,
        cartItemId: item._id,
      }));

      setCartItems(transformedItems);
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product) => {
    if (user) {
      try {
        await apiService.addToCart(product._id, 1);
        await loadCartFromBackend();
      } catch (error) {
        console.error("Failed to add to backend cart:", error);
        throw error;
      }
    } else {
      setCartItems((prevItems) => {
        const existingItem = prevItems.find((item) => item._id === product._id);
        if (existingItem) {
          return prevItems.map((item) =>
            item._id === product._id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prevItems, { ...product, quantity: 1 }];
      });
    }
  };

  const removeFromCart = async (productId) => {
    if (user) {
      try {
        const cartItem = cartItems.find((item) => item._id === productId);
        if (cartItem && cartItem.cartItemId) {
          await apiService.removeFromCart(cartItem.cartItemId);
          await loadCartFromBackend();
        }
      } catch (error) {
        console.error("Failed to remove from backend cart:", error);
        throw error;
      }
    } else {
      setCartItems((prevItems) =>
        prevItems.filter((item) => item._id !== productId)
      );
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    if (user) {
      try {
        const cartItem = cartItems.find((item) => item._id === productId);
        if (cartItem && cartItem.cartItemId) {
          await apiService.updateCartItem(cartItem.cartItemId, quantity);
          await loadCartFromBackend();
        }
      } catch (error) {
        console.error("Failed to update backend cart:", error);
        throw error;
      }
    } else {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item._id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = async () => {
    if (user) {
      try {
        await apiService.clearCart();
        setCartItems([]);
      } catch (error) {
        console.error("Failed to clear backend cart:", error);
        throw error;
      }
    } else {
      setCartItems([]);
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const syncCartOnLogin = async () => {
    const localCart = JSON.parse(localStorage.getItem("shopeasy-cart") || "[]");

    if (localCart.length > 0) {
      try {
        for (const item of localCart) {
          await apiService.addToCart(item._id, item.quantity);
        }

        localStorage.removeItem("shopeasy-cart");

        await loadCartFromBackend();
      } catch (error) {
        console.error("Failed to sync cart:", error);
      }
    }
  };

  useEffect(() => {
    if (user) {
      syncCartOnLogin();
    }
  }, [user]);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    loading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
