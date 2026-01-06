import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SellerSidebar from './SellerSidebar';
import SellerHeader from './SellerHeader';
import styles from './SellerLayout.module.css';

const SellerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
