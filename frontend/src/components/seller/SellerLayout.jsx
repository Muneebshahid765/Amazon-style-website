import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import SellerSidebar from './SellerSidebar';
import SellerHeader from './SellerHeader';
import styles from './SellerLayout.module.css';

const SellerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { user, activeMode } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user) return;
    const isSeller = user.role === 'seller' || user.accountType === 'seller';

    if (!isSeller) {
      navigate('/dashboard', { replace: true });
      return;
    }

    if (activeMode !== 'seller') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, activeMode, navigate]);

  return (
    <div className={styles.layout}>
      <SellerSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`${styles.main} ${!sidebarOpen ? styles.expanded : ''}`}>
        <SellerHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SellerLayout;
