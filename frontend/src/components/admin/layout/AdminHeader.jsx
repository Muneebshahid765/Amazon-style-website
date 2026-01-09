import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiMenu,
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiSettings,
  FiLogOut,
} from 'react-icons/fi';
import { logoutUser } from '../../../redux/slices/authSlice';
import styles from './AdminHeader.module.css';
import NotificationBell from '../../notifications/NotificationBell.jsx';

const AdminHeader = ({ onMenuToggle, onCollapseToggle, collapsed }) => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.replace(/^\/+/, '').split('/');
    const crumbs = [];
    segments.reduce((prev, curr) => {
      const path = `${prev}/${curr}`.replace('//', '/');
      if (curr && curr !== 'admin') {
        crumbs.push({ label: curr.replace(/-/g, ' '), path });
      }
      return path;
    }, '');
    return crumbs;
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dropdownRef.current || dropdownRef.current.contains(event.target)) {
        return;
      }
      setDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    dispatch(logoutUser());
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftControls}>
        <button type="button" className={styles.iconButton} onClick={onMenuToggle} aria-label="Toggle mobile navigation">
          <FiMenu />
        </button>
        <button type="button" className={styles.iconButton} onClick={onCollapseToggle} aria-label="Collapse sidebar">
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
        <div className={styles.crumbs}>
          <Link to="/admin">Admin</Link>
          {breadcrumbs.map((crumb) => (
            <span key={crumb.path}>
              <span>/</span>
              <Link to={crumb.path}>{crumb.label}</Link>
            </span>
          ))}
        </div>
      </div>

      <div className={styles.centerControls}>
        <FiSearch />
        <input type="search" placeholder="Global search (orders, products, users...)" aria-label="Global admin search" />
      </div>

      <div className={styles.rightControls}>
        <NotificationBell />

        <div className={styles.profile} ref={dropdownRef}>
          <button type="button" className={styles.profileButton} onClick={() => setDropdownOpen((prev) => !prev)}>
            <div className={styles.avatar}>{user?.firstName?.[0] || 'A'}</div>
            <div>
              <strong>{user?.firstName || 'Admin'}</strong>
              <span>{user?.role || 'Administrator'}</span>
            </div>
            <FiChevronDown />
          </button>

          {dropdownOpen && (
            <div className={styles.dropdown}>
              <button type="button" onClick={() => setDropdownOpen(false)}>
                <FiUser /> View Profile
              </button>
              <button type="button" onClick={() => setDropdownOpen(false)}>
                <FiSettings /> Settings
              </button>
              <button type="button" onClick={handleLogout}>
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
