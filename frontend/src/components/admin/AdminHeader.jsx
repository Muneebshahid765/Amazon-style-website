import { FiMenu, FiBell, FiUser, FiLogOut } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../redux/slices/authSlice';
import styles from './AdminHeader.module.css';

const AdminHeader = ({ onMenuClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className={styles.header}>
      <button className={styles.menuButton} onClick={onMenuClick}>
        <FiMenu />
      </button>
      
      <div className={styles.search}>
        <input type="text" placeholder="Search..." className={styles.searchInput} />
      </div>

      <div className={styles.actions}>
        <button className={styles.iconButton}>
          <FiBell />
          <span className={styles.notificationBadge}>3</span>
        </button>
        
        <div className={styles.userMenu}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.firstName || 'Admin'}</span>
            <span className={styles.userRole}>Administrator</span>
          </div>
          <button className={styles.iconButton} onClick={handleLogout}>
            <FiLogOut />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
