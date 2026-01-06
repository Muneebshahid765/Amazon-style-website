import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiShoppingBag, FiUser, FiSun, FiMoon, FiLogOut } from 'react-icons/fi';
import { toggleTheme, toggleSidebar } from '../../redux/slices/uiSlice.js';
import { logoutUser } from '../../redux/slices/authSlice.js';
import styles from '../../styles/Navbar.module.css';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useSelector((state) => state.ui.theme);
  const cartCount = useSelector((state) => state.cart.items.length);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

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
        {isAuthenticated && user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
      </nav>

      <div className={styles.actions}>
        <NavLink to="/cart" className={styles.cartPill}>
          <FiShoppingBag />
          {cartCount > 0 && <span>{cartCount}</span>}
        </NavLink>
        {isAuthenticated ? (
          <>
            <NavLink to="/profile" aria-label="Account">
              <FiUser />
            </NavLink>
            <button onClick={handleLogout} aria-label="Logout" title="Logout">
              <FiLogOut />
            </button>
          </>
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
