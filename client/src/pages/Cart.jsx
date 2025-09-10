"use client";

import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import CartItem from "../components/CartItem";
import "./Cart.css";

const Cart = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();

  const handleCheckout = () => {
    // TODO: Implement checkout functionality with backend
    alert(
      "Checkout functionality will be implemented with backend integration!"
    );
  };

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      clearCart();
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="container">
          <div className="cart-header">
            <h1 className="cart-title">Shopping Cart</h1>
          </div>
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add some products to get started!</p>
            <a href="/products" className="continue-shopping-btn">
              Continue Shopping
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="container">
        <div className="cart-header">
          <h1 className="cart-title">
            Shopping Cart ({cartItems.length} items)
          </h1>
          <button onClick={handleClearCart} className="clear-cart-btn">
            Clear Cart
          </button>
        </div>

        <div className="cart-content">
          <div className="cart-items">
            {cartItems.map((item) => (
              <CartItem key={item._id} item={item} />
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-card">
              <h3 className="summary-title">Order Summary</h3>

              <div className="summary-details">
                <div className="summary-row">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="summary-row">
                  <span>Tax</span>
                  <span>${(getCartTotal() * 0.08).toFixed(2)}</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total-row">
                  <span>Total</span>
                  <span>${(getCartTotal() * 1.08).toFixed(2)}</span>
                </div>
              </div>

              <button onClick={handleCheckout} className="checkout-btn">
                Proceed to Checkout
              </button>

              <div className="user-info">
                <p>
                  Signed in as:{" "}
                  <strong>{user?.displayName || user?.email}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
