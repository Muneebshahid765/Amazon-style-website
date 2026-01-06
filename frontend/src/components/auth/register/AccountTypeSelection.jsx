import { FiShoppingBag, FiGrid } from 'react-icons/fi';
import styles from './AccountTypeSelection.module.css';

const AccountTypeSelection = ({ onSelect, loading }) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Choose Your Account Type</h2>
      <p className={styles.subtitle}>Select the type of account you want to create</p>

      <div className={styles.cardsContainer}>
        <div className={styles.card} onClick={() => !loading && onSelect('customer')}>
          <div className={styles.iconWrapper}>
            <FiShoppingBag className={styles.icon} />
          </div>
          <h3 className={styles.cardTitle}>Customer Account</h3>
          <ul className={styles.benefitsList}>
            <li>Shop from thousands of products</li>
            <li>Track your orders in real-time</li>
            <li>Create wishlists and save favorites</li>
            <li>Secure and fast checkout</li>
            <li>Write reviews and ratings</li>
          </ul>
          <button className={styles.selectButton} disabled={loading}>
            Continue as Customer
          </button>
        </div>

        <div className={styles.card} onClick={() => !loading && onSelect('seller')}>
          <div className={styles.iconWrapper}>
            <FiGrid className={styles.icon} />
          </div>
          <h3 className={styles.cardTitle}>Seller Account</h3>
          <ul className={styles.benefitsList}>
            <li>Sell your products online</li>
            <li>Manage inventory efficiently</li>
            <li>Track earnings and analytics</li>
            <li>Access seller dashboard</li>
            <li>Reach millions of customers</li>
          </ul>
          <button className={styles.selectButton} disabled={loading}>
            Continue as Seller
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountTypeSelection;
