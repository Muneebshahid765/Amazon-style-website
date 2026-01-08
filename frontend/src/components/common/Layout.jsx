import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import Sidebar from './Sidebar.jsx';
import { setActiveMode } from '../../redux/slices/authSlice.js';
import styles from '../../styles/Layout.module.css';

const Layout = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, activeMode } = useSelector((state) => state.auth);
  const modeRef = useRef(activeMode);

  useEffect(() => {
    modeRef.current = activeMode;
  }, [activeMode]);

  useEffect(() => {
    if (!user) return;
    const isSeller = user.role === 'seller' || user.accountType === 'seller';
    const inSellerArea = location.pathname.startsWith('/seller');

    if (!isSeller) return;

    const desiredMode = inSellerArea ? 'seller' : 'buyer';
    if (modeRef.current !== desiredMode) {
      dispatch(setActiveMode(desiredMode));
    }
  }, [user, location.pathname, dispatch]);

  return (
    <div className={styles.layoutShell}>
      <Navbar />
      <Sidebar />
      <main className={styles.mainContent}>{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
