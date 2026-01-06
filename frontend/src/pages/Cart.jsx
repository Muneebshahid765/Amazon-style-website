import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiHeart, FiShoppingBag, FiMinus, FiPlus } from 'react-icons/fi';
import { fetchCart, removeFromCart, clearCart, updateCartItemQuantity } from '../redux/slices/cartSlice';
import styles from '../styles/Cart.module.css';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal, status } = useSelector((state) => state.cart);
  const [couponCode, setCouponCode] = useState('');

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    dispatch(updateCartItemQuantity({ productId, quantity: newQuantity }));
  };

  const handleRemove = (productId) => {
    dispatch(removeFromCart(productId));
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart());
    }
  };

  if (status === 'loading' && items.length === 0) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <FiShoppingBag size={80} />
        <h2>Your cart is empty</h2>
        <p>Add some products to get started</p>
        <Link to="/products" className={styles.shopBtn}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  const estimatedTax = subtotal * 0.18;
  const shipping = subtotal > 5000 ? 0 : 200;
  const total = subtotal + estimatedTax + shipping;

  return (
    <div className={styles.cartContainer}>
      <div className={styles.cartHeader}>
        <h1>Shopping Cart ({items.length} items)</h1>
        <button onClick={handleClearCart} className={styles.clearBtn}>
          <FiTrash2 /> Clear Cart
        </button>
      </div>

      <div className={styles.cartContent}>
        <div className={styles.cartItems}>
          {items.map((item) => (
            <article key={item.productId} className={styles.cartItem}>
              <Link to={`/products/${item.slug || item.productId}`} className={styles.itemImage}>
                <img src={item.image || '/placeholder.png'} alt={item.name} />
              </Link>

              <div className={styles.itemDetails}>
                <Link to={`/products/${item.slug || item.productId}`} className={styles.itemName}>
                  {item.name}
                </Link>
                <p className={styles.itemPrice}>Rs. {item.price}</p>
                {item.stock < 5 && item.stock > 0 && (
                  <p className={styles.lowStock}>Only {item.stock} left in stock</p>
                )}
                {item.stock === 0 && <p className={styles.outOfStock}>Out of stock</p>}
              </div>

              <div className={styles.itemActions}>
                <div className={styles.quantityControl}>
                  <button
                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                    disabled={item.quantity === 1}
                  >
                    <FiMinus />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                  >
                    <FiPlus />
                  </button>
                </div>

                <p className={styles.itemTotal}>Rs. {item.price * item.quantity}</p>

                <div className={styles.itemButtons}>
                  <button className={styles.iconBtn} title="Move to Wishlist">
                    <FiHeart />
                  </button>
                  <button
                    className={styles.iconBtn}
                    onClick={() => handleRemove(item.productId)}
                    title="Remove"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className={styles.cartSummary}>
          <h3>Order Summary</h3>

          <div className={styles.summaryRow}>
            <span>Subtotal:</span>
            <span>Rs. {subtotal.toFixed(2)}</span>
          </div>

          <div className={styles.summaryRow}>
            <span>Tax (18%):</span>
            <span>Rs. {estimatedTax.toFixed(2)}</span>
          </div>

          <div className={styles.summaryRow}>
            <span>Shipping:</span>
            <span>{shipping === 0 ? 'FREE' : `Rs. ${shipping}`}</span>
          </div>

          {subtotal < 5000 && (
            <p className={styles.shippingNote}>
              Add Rs. {(5000 - subtotal).toFixed(2)} more for FREE shipping
            </p>
          )}

          <div className={styles.couponSection}>
            <input
              type="text"
              placeholder="Coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <button>Apply</button>
          </div>

          <div className={`${styles.summaryRow} ${styles.total}`}>
            <strong>Total:</strong>
            <strong>Rs. {total.toFixed(2)}</strong>
          </div>

          <button className={styles.checkoutBtn} onClick={() => navigate('/checkout')}>
            Proceed to Checkout
          </button>

          <Link to="/products" className={styles.continueShoppingLink}>
            Continue Shopping
          </Link>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
