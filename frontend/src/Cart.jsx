// src/components/Cart.js
import React from 'react';
import './cart.css'
const Cart = ({ cartItems, removeItem }) => {
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className='Cart'>
      <h2>Cart</h2>
      {cartItems.length === 0 ? (
        <p>No items in cart.</p>
      ) : (
        <div>
          <ul>
            {cartItems.map((item, index) => (
              <li key={index}>
                {item.name} - ${item.price} x {item.quantity}
                <button className="toa"onClick={() => removeItem(item)}>Remove</button>
              </li>
            ))}
          </ul>
          <p>Total Items: {totalItems}</p>
          <p>Total Amount: Ksh. {totalAmount.toFixed(2)}</p>
        <div className="chceckout">
            Buy Now
        </div>

        </div>
      )}
    </div>
  );
};

export default Cart;
