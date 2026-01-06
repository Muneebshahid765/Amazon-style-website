import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiShoppingBag,
  FiShoppingCart,
  FiUsers,
  FiUserCheck,
  FiStar,
  FiTag,
  FiBarChart2,
  FiSettings,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import { useSelector } from 'react-redux';
import styles from './AdminSidebar.module.css';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const buildNav = (isMultiVendor) => [
  { label: 'Dashboard', icon: FiHome, path: '/admin' },
  {
    label: 'Products',
    icon: FiShoppingBag,
    children: [
      { label: 'All Products', path: '/admin/products' },
      { label: 'Add Product', path: '/admin/products/new' },
      { label: 'Categories', path: '/admin/products/categories' },
      { label: 'Brands', path: '/admin/products/brands' },
    ],
  },
  {
    label: 'Orders',
    icon: FiShoppingCart,
    children: [
      { label: 'All Orders', path: '/admin/orders' },
      { label: 'Pending Orders', path: '/admin/orders/pending' },
      { label: 'Completed Orders', path: '/admin/orders/completed' },
    ],
  },
  { label: 'Customers', icon: FiUsers, path: '/admin/customers' },
  ...(isMultiVendor ? [{ label: 'Sellers', icon: FiUserCheck, path: '/admin/sellers' }] : []),
  { label: 'Reviews', icon: FiStar, path: '/admin/reviews' },
  { label: 'Coupons', icon: FiTag, path: '/admin/coupons' },
  { label: 'Analytics', icon: FiBarChart2, path: '/admin/analytics' },
  { label: 'Settings', icon: FiSettings, path: '/admin/settings' },
];

const AdminSidebar = ({ collapsed, mobileOpen, onCollapseToggle, onCloseMobile }) => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [openMenus, setOpenMenus] = useState({ Products: !collapsed, Orders: !collapsed });
  const navItems = useMemo(() => buildNav(!!user?.isMultiVendor), [user]);

  useEffect(() => {
    setOpenMenus((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[key] = !collapsed;
      });
      return next;
    });
  }, [collapsed]);

  const handleToggle = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderNavItem = (item) => {
    if (item.children) {
      const expanded = openMenus[item.label];
      const childActive = item.children.some((child) => location.pathname.startsWith(child.path));
      return (
        <div key={item.label} className={styles.group}>
          <button
            type="button"
            className={cx(
              styles.navButton,
              collapsed && styles.collapsed,
              childActive && styles.activeLink
            )}
            onClick={() => handleToggle(item.label)}
            aria-expanded={expanded}
            aria-controls={`${item.label}-submenu`}
          >
            <item.icon />
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && (expanded ? <FiChevronUp /> : <FiChevronDown />)}
          </button>
          <div
            id={`${item.label}-submenu`}
            className={cx(styles.subMenu, expanded && styles.subMenuOpen)}
            data-collapsed={collapsed}
          >
            {item.children.map((child) => (
              <NavLink
                key={child.path}
                to={child.path}
                onClick={onCloseMobile}
                className={({ isActive: childActive }) =>
                  cx(styles.subLink, childActive && styles.activeLink)
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        </div>
      );
    }

    return (
      <NavLink
        key={item.label}
        to={item.path}
        onClick={onCloseMobile}
        className={({ isActive }) =>
          cx(styles.navLink, collapsed && styles.collapsed, isActive && styles.activeLink)
        }
      >
        <item.icon />
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <aside
      className={cx(styles.sidebar, collapsed && styles.sidebarCollapsed, mobileOpen && styles.mobileOpen)}
    >
      <div className={styles.logoRow}>
        <div className={styles.logoMark}>NM</div>
        {!collapsed && (
          <div className={styles.logoText}>
            <strong>NovaMart</strong>
            <span>Admin Suite</span>
          </div>
        )}
        <button type="button" className={styles.collapseBtn} onClick={onCollapseToggle} aria-label="Toggle sidebar">
          <span>{collapsed ? '⟩' : '⟨'}</span>
        </button>
      </div>

      <nav className={styles.nav}>{navItems.map((item) => renderNavItem(item))}</nav>

      <div className={styles.profileCard}>
        <div className={styles.avatar}>{user?.firstName?.[0] || 'A'}</div>
        {!collapsed && (
          <div>
            <strong>{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Admin User'}</strong>
            <span>{user?.role || 'admin'}</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
