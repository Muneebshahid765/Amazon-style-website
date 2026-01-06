import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './layout/AdminSidebar';
import AdminHeader from './AdminHeader';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={styles.layout}>
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`${styles.main} ${!sidebarOpen ? styles.expanded : ''}`}>
        <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
