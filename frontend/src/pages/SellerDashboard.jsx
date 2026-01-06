import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from './SellerDashboard.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SellerDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerData();
  }, []);

  const fetchSellerData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        axios.get(`${API_URL}/seller/stats`, { withCredentials: true }),
        axios.get(`${API_URL}/seller/orders?limit=5`, { withCredentials: true }),
      ]);

      setStats(statsRes.data.stats || {});
      setRecentOrders(ordersRes.data.orders || []);
    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading seller dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.sellerDashboard}>
      <div className={styles.header}>
        <h1>Seller Dashboard</h1>
        <p>Welcome back, {user?.firstName}!</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📦</div>
          <div className={styles.statInfo}>
            <h3>{stats.totalProducts}</h3>
            <p>Total Products</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🛒</div>
          <div className={styles.statInfo}>
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statInfo}>
            <h3>${stats.totalRevenue?.toFixed(2)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>⏳</div>
          <div className={styles.statInfo}>
            <h3>{stats.pendingOrders}</h3>
            <p>Pending Orders</p>
          </div>
        </div>
      </div>

      <div className={styles.quickActions}>
        <h2>Quick Actions</h2>
        <div className={styles.actionButtons}>
          <Link to="/seller/products/new" className={styles.actionBtn}>
            ➕ Add New Product
          </Link>
          <Link to="/seller/products" className={styles.actionBtn}>
            📦 Manage Products
          </Link>
          <Link to="/seller/orders" className={styles.actionBtn}>
            🛒 View Orders
          </Link>
          <Link to="/seller/analytics" className={styles.actionBtn}>
            📊 Analytics
          </Link>
        </div>
      </div>

      <div className={styles.recentOrders}>
        <h2>Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className={styles.noData}>No orders yet</p>
        ) : (
          <div className={styles.ordersTable}>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td>#{order._id.slice(-8)}</td>
                    <td>{order.user?.firstName} {order.user?.lastName}</td>
                    <td>${order.totalAmount?.toFixed(2)}</td>
                    <td>
                      <span className={`${styles.status} ${styles[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/seller/orders/${order._id}`} className={styles.viewBtn}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
