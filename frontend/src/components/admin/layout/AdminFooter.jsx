import styles from './AdminFooter.module.css';

const AdminFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div>
        © {year} NovaMart Admin. Curated experiences & crafted commerce.
      </div>
      <nav>
        <a href="/privacy" target="_blank" rel="noreferrer">Privacy</a>
        <a href="/terms" target="_blank" rel="noreferrer">Terms</a>
        <a href="/status" target="_blank" rel="noreferrer">System Status</a>
      </nav>
      <small>Version 1.0.0</small>
    </footer>
  );
};

export default AdminFooter;
