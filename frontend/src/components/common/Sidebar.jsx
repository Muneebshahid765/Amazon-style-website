import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { closeOverlays } from '../../redux/slices/uiSlice.js';
import styles from '../../styles/Sidebar.module.css';

const Sidebar = () => {
  const dispatch = useDispatch();
  const isSidebarOpen = useSelector((state) => state.ui.isSidebarOpen);

  return (
    <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
      <button className={styles.closeBtn} onClick={() => dispatch(closeOverlays())}>
        Close
      </button>
      <nav>
        <NavLink to="/" onClick={() => dispatch(closeOverlays())}>
          Home
        </NavLink>
        <NavLink to="/products" onClick={() => dispatch(closeOverlays())}>
          Products
        </NavLink>
        <NavLink to="/cart" onClick={() => dispatch(closeOverlays())}>
          Cart
        </NavLink>
        <NavLink to="/profile" onClick={() => dispatch(closeOverlays())}>
          Profile
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
