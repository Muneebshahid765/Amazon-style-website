import { NavLink } from 'react-router-dom';
import {
  FiHome,
  FiPackage,
  FiShoppingCart,
  FiUsers,
  // FiStore,
  FiMessageSquare,
  FiTag,
  FiBarChart2,
  FiSettings,
  FiDollarSign,
  FiTrendingUp,
  FiGrid,
  FiAlertCircle,
  FiMail,
  FiFileText,
} from 'react-icons/fi';
import styles from './AdminSidebar.module.css';

const AdminSidebar = ({ isOpen, onToggle }) => {
  const navItems = [
    { path: '/admin', icon: FiHome, label: 'Dashboard', exact: true },
    { path: '/admin/analytics', icon: FiTrendingUp, label: 'Analytics' },
    {
      path: '/admin/sellers',
      // icon: FiStore,
      label: 'Sellers',
      badge: 5,
      children: [
        { path: '/admin/sellers', label: 'All Sellers' },
        { path: '/admin/sellers/pending', label: 'Pending' },
        { path: '/admin/sellers/verified', label: 'Verified' },
      ],
    },
    {
      path: '/admin/products',
      icon: FiPackage,
      label: 'Products',
      children: [
        { path: '/admin/products', label: 'All Products' },
        { path: '/admin/products/categories', label: 'Categories' },
        { path: '/admin/products/reviews', label: 'Reviews' },
        { path: '/admin/products/low-stock', label: 'Low Stock' },
      ],
    },
    {
      path: '/admin/orders',
      icon: FiShoppingCart,
      label: 'Orders',
      children: [
        { path: '/admin/orders', label: 'All Orders' },
        { path: '/admin/orders/pending', label: 'Pending' },
        { path: '/admin/orders/returns', label: 'Returns' },
      ],
    },
    {
      path: '/admin/customers',
      icon: FiUsers,
      label: 'Customers',
      children: [
        { path: '/admin/customers', label: 'All Customers' },
        { path: '/admin/customers/segments', label: 'Segments' },
        { path: '/admin/customers/support', label: 'Support' },
      ],
    },
    {
      path: '/admin/marketing',
      icon: FiMail,
      label: 'Marketing',
      children: [
        { path: '/admin/marketing/coupons', label: 'Coupons' },
        { path: '/admin/marketing/campaigns', label: 'Campaigns' },
        { path: '/admin/marketing/promotions', label: 'Promotions' },
      ],
    },
    {
      path: '/admin/finance',
      icon: FiDollarSign,
      label: 'Finance',
      children: [
        { path: '/admin/finance/revenue', label: 'Revenue' },
        { path: '/admin/finance/payouts', label: 'Payouts' },
        { path: '/admin/finance/transactions', label: 'Transactions' },
      ],
    },
    { path: '/admin/reports', icon: FiFileText, label: 'Reports' },
    { path: '/admin/settings', icon: FiSettings, label: 'Settings' },
  ];

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
      <div className={styles.logo}>
        <h2>Admin Panel</h2>
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

export default AdminSidebar;
