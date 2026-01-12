import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiHome,
  FiPackage,
  FiShoppingCart,
  FiDollarSign,
  FiStar,
  FiTrendingUp,
  FiGrid,
  FiSettings,
  FiUpload,
  FiTag,
  FiFileText,
  FiCreditCard,
  FiShield,
  FiLayers,
  FiHeadphones,
} from 'react-icons/fi';
import styles from './SellerSidebar.module.css';
import { setActiveMode, logoutUser } from '../../redux/slices/authSlice';
import { hasFeatureAccess } from '../../utils/featureAccess';

const SellerSidebar = ({ isOpen, onToggle }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, activeMode } = useSelector((state) => state.auth);
  const { subscriptionStatus } = useSelector((state) => state.seller);

  const isSeller = user?.role === 'seller' || user?.accountType === 'seller';
  const hasBuyerProfile = !!user?.hasBuyerProfile;
  
  const hasBulkOps = hasFeatureAccess(subscriptionStatus, 'bulkOperations');
  const hasAdvancedAnalytics = hasFeatureAccess(subscriptionStatus, 'advancedAnalytics');
  const hasPrioritySupport = hasFeatureAccess(subscriptionStatus, 'prioritySupport');

  const handleSwitchToBuyer = () => {
    if (!hasBuyerProfile) {
      navigate('/seller/settings');
      return;
    }
    dispatch(setActiveMode('buyer'));
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const logoutButton = (
    <button type="button" className={styles.logoutButton} onClick={handleLogout}>
      Logout
    </button>
  );

  const productChildren = [
    { path: '/seller/products', label: 'All Products' },
    { path: '/seller/products/add', label: 'Add Product' },
    { path: '/seller/products/categories', label: 'Categories' },
    { path: '/seller/products/inventory', label: 'Inventory' },
    { path: '/seller/products/bulk-upload', label: 'Bulk Upload' },
  ];
  
  if (hasBulkOps) {
    productChildren.push({ path: '/seller/products/bulk-operations', label: '⚡ Bulk Operations', premium: true });
  }

  const analyticsChildren = hasAdvancedAnalytics 
    ? [
        { path: '/seller/analytics', label: 'Overview' },
        { path: '/seller/analytics/advanced', label: '⚡ Advanced Analytics', premium: true },
      ]
    : undefined;

  const navItems = [
    { path: '/seller', icon: FiHome, label: 'Dashboard', exact: true },
    {
      path: '/seller/products',
      icon: FiPackage,
      label: 'Products',
      children: productChildren,
    },
    {
      path: '/seller/orders',
      icon: FiShoppingCart,
      label: 'Orders',
      children: [
        { path: '/seller/orders', label: 'All Orders' },
        { path: '/seller/orders/pending', label: 'Pending' },
        { path: '/seller/orders/processing', label: 'Processing' },
        { path: '/seller/orders/returns', label: 'Returns' },
      ],
    },
    {
      path: '/seller/earnings',
      icon: FiDollarSign,
      label: 'Earnings',
      children: [
        { path: '/seller/earnings', label: 'Overview' },
        { path: '/seller/earnings/transactions', label: 'Transactions' },
        { path: '/seller/earnings/payouts', label: 'Payouts' },
      ],
    },
    {
      path: '/seller/reports',
      icon: FiFileText,
      label: 'Reports',
      children: [
        { path: '/seller/reports', label: 'Sales Report' },
        { path: '/seller/reports/inventory', label: 'Inventory Report' },
      ],
    },
    { path: '/seller/verification', icon: FiShield, label: 'Verification' },
    { path: '/seller/reviews', icon: FiStar, label: 'Reviews' },
    {
      path: '/seller/analytics',
      icon: FiTrendingUp,
      label: 'Analytics',
      children: analyticsChildren,
    },
    {
      path: '/seller/marketing',
      icon: FiTag,
      label: 'Marketing',
      children: [
        { path: '/seller/marketing/promotions', label: 'Promotions' },
        { path: '/seller/marketing/discounts', label: 'Discounts' },
        { path: '/seller/marketing/coupons', label: 'Coupons' },
      ],
    },
    { path: '/seller/store', icon: FiGrid, label: 'My Store' },
    { path: '/seller/settings', icon: FiSettings, label: 'Settings' },
  ];
  
  if (hasPrioritySupport) {
    navItems.splice(navItems.length - 2, 0, {
      path: '/seller/support/priority',
      icon: FiHeadphones,
      label: '⚡ Priority Support',
      premium: true,
    });
  }

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
      <div className={styles.logo}>
        <h2>Seller Hub</h2>
      </div>
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <div key={item.path}>
            <NavLink
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <item.icon className={styles.icon} />
              <span className={styles.label}>{item.label}</span>
              {item.badge && <span className={styles.badge}>{item.badge}</span>}
            </NavLink>
            {item.children && isOpen && (
              <div className={styles.subMenu}>
                {item.children.map((child) => (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    className={({ isActive }) =>
                      `${styles.subMenuItem} ${isActive ? styles.activeSubItem : ''}`
                    }
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      {isSeller && (
        <div className={styles.sidebarActions}>
          <div className={styles.actionHeader}>
            <h4>Account Mode</h4>
            <span className={`${styles.modeBadge} ${activeMode === 'seller' ? styles.sellerMode : styles.buyerMode}`}>
              {activeMode === 'seller' ? 'Selling' : 'Buying'}
            </span>
          </div>
          <p className={styles.actionText}>
            {hasBuyerProfile
              ? 'Switch to your buyer dashboard anytime to browse the marketplace like your customers.'
              : 'Create your buyer profile from settings to start shopping like your customers.'}
          </p>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleSwitchToBuyer}
            disabled={!hasBuyerProfile}
          >
            {hasBuyerProfile ? 'Switch to Buyer Account' : 'Create Buyer Account'}
          </button>
          {!hasBuyerProfile && (
            <button type="button" className={styles.actionLink} onClick={() => navigate('/seller/settings')}>
              Go to Settings
            </button>
          )}
          {logoutButton}
        </div>
      )}
      {!isSeller && <div className={styles.sidebarActions}>{logoutButton}</div>}
    </aside>
  );
};

export default SellerSidebar;
