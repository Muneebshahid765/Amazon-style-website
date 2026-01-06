import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import Sidebar from './Sidebar.jsx';
import styles from '../../styles/Layout.module.css';

const Layout = ({ children }) => {
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
