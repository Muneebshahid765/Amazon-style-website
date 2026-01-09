import { FiMenu, FiLogOut } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../redux/slices/authSlice';
import NotificationBell from '../notifications/NotificationBell.jsx';
import styles from './SellerHeader.module.css';

const SellerHeader = ({ onMenuClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { store } = useSelector((state) => state.seller);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <header className={styles.header}>
      <button className={styles.menuButton} onClick={onMenuClick}>
        <FiMenu />
      </button>
      
      <div className={styles.storeInfo}>
        <span className={styles.storeName}>{store?.storeName || 'My Store'}</span>
      </div>

      <div className={styles.actions}>
        <NotificationBell variant="seller" />
        
        <div className={styles.userMenu}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.firstName || 'Seller'}</span>
            <span className={styles.userRole}>Seller</span>
          </div>
          <button className={styles.iconButton} onClick={handleLogout}>
            <FiLogOut />
          </button>
        </div>
      </div>
    </header>
  );
};

export default SellerHeader;
