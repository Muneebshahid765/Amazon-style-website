import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMapPin, FiHeart, FiPackage, FiLock } from 'react-icons/fi';
import ProfilePage from './ProfilePage';
import AddressManager from '../components/user/AddressManager';
import ChangePassword from '../components/user/ChangePassword';
import OrderHistory from './OrderHistory';
import Wishlist from './Wishlist';
import styles from '../styles/UserDashboard.module.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, activeMode } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!user) return;

    const isSeller = user.role === 'seller' || user.accountType === 'seller';
    const isAdmin = user.role === 'admin' || user.accountType === 'admin';

    if (isAdmin && activeMode === 'admin') {
      navigate('/admin', { replace: true });
    } else if (isSeller && activeMode === 'seller') {
      navigate('/seller', { replace: true });
    }
  }, [user, activeMode, navigate]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'addresses', label: 'Addresses', icon: FiMapPin },
    { id: 'orders', label: 'Orders', icon: FiPackage },
    { id: 'wishlist', label: 'Wishlist', icon: FiHeart },
    { id: 'security', label: 'Security', icon: FiLock },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfilePage />;
      case 'addresses':
        return <AddressManager />;
      case 'orders':
        return <OrderHistory />;
      case 'wishlist':
        return <Wishlist />;
      case 'security':
        return <ChangePassword />;
      default:
        return <ProfilePage />;
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>My Account</h2>
        <nav className={styles.tabNav}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`${styles.tabBtn} ${activeTab === tab.id ? styles.active : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
};

export default UserDashboard;
