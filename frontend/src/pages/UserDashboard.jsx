import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMapPin, FiHeart, FiPackage, FiLock, FiCreditCard } from 'react-icons/fi';
import ProfilePage from './ProfilePage';
import AddressManager from '../components/user/AddressManager';
import ChangePassword from '../components/user/ChangePassword';
import OrderHistory from './OrderHistory';
import Wishlist from './Wishlist';
import BuyerTransactions from './BuyerTransactions';
import styles from '../styles/UserDashboard.module.css';
import { logoutUser } from '../redux/slices/authSlice';

const UserDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, activeMode } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('profile');
  const isSellerAccount = Boolean(user && (user.role === 'seller' || user.accountType === 'seller'));

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

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

  const tabs = useMemo(() => {
    const baseTabs = [
      { id: 'profile', label: 'Profile', icon: FiUser },
      { id: 'addresses', label: 'Addresses', icon: FiMapPin },
      { id: 'orders', label: 'Orders', icon: FiPackage },
      { id: 'transactions', label: 'Transactions', icon: FiCreditCard },
      { id: 'wishlist', label: 'Wishlist', icon: FiHeart },
      { id: 'security', label: 'Security', icon: FiLock },
    ];
    if (!isSellerAccount) {
      return baseTabs;
    }
    return baseTabs.filter((tab) => tab.id !== 'addresses' && tab.id !== 'security');
  }, [isSellerAccount]);

  useEffect(() => {
    if (tabs.length === 0) return;
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfilePage />;
      case 'addresses':
        return <AddressManager />;
      case 'orders':
        return <OrderHistory />;
      case 'transactions':
        return <BuyerTransactions />;
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
        <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
};

export default UserDashboard;
