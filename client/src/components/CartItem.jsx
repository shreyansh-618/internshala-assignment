"use client";

import { useCart } from "../contexts/CartContext";
import "./CartItem.css";

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) {
      handleRemove();
      return;
    }
    updateQuantity(item._id, newQuantity);
  };

  const handleRemove = () => {
    if (window.confirm(`Remove ${item.name} from cart?`)) {
      removeFromCart(item._id);
    }
  };

  return (
    <div className="cart-item">
      <div
        className="item-image-container"
        style={{ backgroundColor: item.backgroundColor }}
      >
        <img
          src={item.image || "/placeholder.svg"}
          alt={item.name}
          className="item-image"
        />
      </div>

      <div className="item-details">
        <h3 className="item-name">{item.name}</h3>
        <p className="item-description">{item.description}</p>
        <p className="item-category">Category: {item.category}</p>
      </div>

      <div className="item-controls">
        <div className="quantity-controls">
          <label className="quantity-label">Quantity:</label>
          <div className="quantity-input-group">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              className="quantity-btn"
              disabled={item.quantity <= 1}
            >
              -
            </button>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) =>
                handleQuantityChange(Number.parseInt(e.target.value) || 1)
              }
              className="quantity-input"
              min="1"
            />
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              className="quantity-btn"
            >
              +
            </button>
          </div>
        </div>

        <div className="item-pricing">
          <div className="unit-price">${item.price.toFixed(2)} each</div>
          <div className="total-price">
            ${(item.price * item.quantity).toFixed(2)}
          </div>
        </div>

        <button onClick={handleRemove} className="remove-btn">
          Remove
        </button>
      </div>
    </div>
  );
};

export default CartItem;
