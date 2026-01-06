import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiPackage, FiTruck, FiDownload } from 'react-icons/fi';
import styles from '../styles/OrderSuccess.module.css';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!orderId) {
      navigate('/');
    }
  }, [orderId, navigate]);

  return (
    <div className={styles.successContainer}>
      <div className={styles.successCard}>
        <div className={styles.successIcon}>
          <FiCheckCircle size={80} />
        </div>

        <h1>Order Placed Successfully!</h1>
        <p className={styles.subtitle}>Thank you for your purchase</p>

        <div className={styles.orderInfo}>
          <div className={styles.infoRow}>
            <span>Order Number:</span>
            <strong>{orderId}</strong>
          </div>
          <div className={styles.infoRow}>
            <span>Estimated Delivery:</span>
            <strong>3-5 Business Days</strong>
          </div>
        </div>

        <div className={styles.timeline}>
          <div className={styles.timelineItem}>
            <div className={`${styles.timelineIcon} ${styles.active}`}>
              <FiCheckCircle />
            </div>
            <div className={styles.timelineContent}>
              <strong>Order Confirmed</strong>
              <p>Your order has been placed successfully</p>
            </div>
          </div>

          <div className={styles.timelineItem}>
            <div className={styles.timelineIcon}>
              <FiPackage />
            </div>
            <div className={styles.timelineContent}>
              <strong>Processing</strong>
              <p>We're preparing your items</p>
            </div>
          </div>

          <div className={styles.timelineItem}>
            <div className={styles.timelineIcon}>
              <FiTruck />
            </div>
            <div className={styles.timelineContent}>
              <strong>Shipped</strong>
              <p>Your order is on the way</p>
            </div>
          </div>

          <div className={styles.timelineItem}>
            <div className={styles.timelineIcon}>
              <FiCheckCircle />
            </div>
            <div className={styles.timelineContent}>
              <strong>Delivered</strong>
              <p>Package delivered to you</p>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <Link to={`/dashboard?tab=orders`} className={styles.primaryBtn}>
            View Order Details
          </Link>
          <button className={styles.secondaryBtn}>
            <FiDownload /> Download Invoice
          </button>
        </div>

        <Link to="/products" className={styles.continueShoppingLink}>
          Continue Shopping
        </Link>
      </div>

      <div className={styles.infoCards}>
        <div className={styles.infoCard}>
          <h3>What's Next?</h3>
          <ul>
            <li>You'll receive an email confirmation shortly</li>
            <li>Track your order in real-time from your dashboard</li>
            <li>We'll notify you when your order ships</li>
          </ul>
        </div>

        <div className={styles.infoCard}>
          <h3>Need Help?</h3>
          <p>Contact our customer support team:</p>
          <p>
            <strong>Email:</strong> support@novamart.com
          </p>
          <p>
            <strong>Phone:</strong> +92 300 1234567
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
