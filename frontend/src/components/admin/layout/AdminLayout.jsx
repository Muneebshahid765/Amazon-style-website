import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar.jsx';
import AdminHeader from './AdminHeader.jsx';
import AdminFooter from './AdminFooter.jsx';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className={styles.adminShell}>
      <AdminSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCollapseToggle={() => setCollapsed((prev) => !prev)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {mobileOpen && <button type="button" className={styles.overlay} onClick={() => setMobileOpen(false)} aria-label="Close sidebar overlay" />}

      <div className={styles.mainPane}>
        <AdminHeader
          collapsed={collapsed}
          onMenuToggle={() => setMobileOpen((prev) => !prev)}
          onCollapseToggle={() => setCollapsed((prev) => !prev)}
        />
        <main className={styles.contentArea}>
          <Outlet />
        </main>
        <AdminFooter />
      </div>
    </div>
  );
};

export default AdminLayout;
