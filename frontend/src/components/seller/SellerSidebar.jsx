import { NavLink } from 'react-router-dom';
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
} from 'react-icons/fi';
import styles from './SellerSidebar.module.css';

const SellerSidebar = ({ isOpen, onToggle }) => {
  const navItems = [
    { path: '/seller', icon: FiHome, label: 'Dashboard', exact: true },
    {
      path: '/seller/products',
      icon: FiPackage,
      label: 'Products',
      children: [
        { path: '/seller/products', label: 'All Products' },
        { path: '/seller/products/add', label: 'Add Product' },
        { path: '/seller/products/categories', label: 'Categories' },
        { path: '/seller/products/inventory', label: 'Inventory' },
        { path: '/seller/products/bulk-upload', label: 'Bulk Upload' },
      ],
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
    { path: '/seller/analytics', icon: FiTrendingUp, label: 'Analytics' },
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
    </aside>
  );
};

export default SellerSidebar;
