import { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiShoppingBag, FiUser, FiSun, FiMoon } from 'react-icons/fi';
import { toggleTheme, toggleSidebar } from '../../redux/slices/uiSlice.js';
import { setActiveMode } from '../../redux/slices/authSlice.js';
import ModeSwitch from './ModeSwitch.jsx';
import styles from '../../styles/Navbar.module.css';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useSelector((state) => state.ui.theme);
  const cartCount = useSelector((state) => state.cart.items.length);
  const { isAuthenticated, user, activeMode } = useSelector((state) => state.auth);

  const isSeller = useMemo(() => user && (user.role === 'seller' || user.accountType === 'seller'), [user]);
  const isAdmin = useMemo(() => user && (user.role === 'admin' || user.accountType === 'admin'), [user]);

  const goToModeRoute = (mode) => {
    if (mode === 'seller') {
      navigate('/seller');
    } else if (mode === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSellerToggle = () => {
    if (!isSeller) return;
    const targetMode = activeMode === 'seller' ? 'buyer' : 'seller';
    dispatch(setActiveMode(targetMode));
    goToModeRoute(targetMode);
  };

  const showModeSwitch = isAuthenticated && !isSeller;

  return (
    <header className={styles.navbar}>
      <button className={styles.menuButton} onClick={() => dispatch(toggleSidebar())}>
        <span />
        <span />
        <span />
      </button>

      <NavLink to="/" className={styles.brand}>
        <FiShoppingBag /> NovaMart
      </NavLink>

      <nav className={styles.links}>
        <NavLink to="/products">Shop</NavLink>
        {isAuthenticated && <NavLink to="/profile">Profile</NavLink>}
        {isAuthenticated && isAdmin && <NavLink to="/admin">Admin</NavLink>}
      </nav>

      <div className={styles.actions}>
        {isAuthenticated && isSeller && (
          <button
            type="button"
            className={styles.switchBtn}
            onClick={handleSellerToggle}
            title={activeMode === 'seller' ? 'Switch to Buyer Account' : 'Switch to Selling Account'}
          >
            {activeMode === 'seller' ? 'Switch to Buying' : 'Switch to Selling'}
          </button>
        )}
        {showModeSwitch && <ModeSwitch onChange={goToModeRoute} />}
        <NavLink to="/cart" className={styles.cartPill}>
          <FiShoppingBag />
          {cartCount > 0 && <span>{cartCount}</span>}
        </NavLink>
        {isAuthenticated ? (
          <NavLink to="/profile" aria-label="Account">
            <FiUser />
          </NavLink>
        ) : (
          <NavLink to="/login" aria-label="Login">
            <FiUser />
          </NavLink>
        )}
        <button onClick={() => dispatch(toggleTheme())} aria-label="Theme toggle">
          {theme === 'light' ? <FiMoon /> : <FiSun />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
