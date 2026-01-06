import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats, fetchRevenueAnalytics } from '../../redux/slices/adminSlice';
import { FiDollarSign, FiShoppingCart, FiUsers, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import ThreeRevenueChart from '../../components/dashboard/ThreeRevenueChart';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { dashboardStats, revenueAnalytics, loading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchRevenueAnalytics('30days'));
  }, [dispatch]);

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${dashboardStats?.revenue?.total?.toLocaleString() || 0}`,
      change: dashboardStats?.revenue?.growth || 0,
      icon: FiDollarSign,
      color: '#10b981',
    },
    {
      title: 'Total Orders',
      value: dashboardStats?.orders?.total?.toLocaleString() || 0,
      change: 12.5,
      icon: FiShoppingCart,
      color: '#3b82f6',
    },
    {
      title: 'Total Customers',
      value: dashboardStats?.customers?.total?.toLocaleString() || 0,
      change: 8.2,
      icon: FiUsers,
      color: '#8b5cf6',
    },
    {
      title: 'Pending Sellers',
      value: dashboardStats?.sellers?.pending || 0,
      change: -2.4,
      // icon: FiStore,
      color: '#f59e0b',
    },
  ];

  const chartData = revenueAnalytics?.revenueOverTime?.map((item) => ({
    label: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: item.revenue,
  })) || [];

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Dashboard Overview</h1>
        <p>Welcome back! Here's what's happening with your platform today.</p>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div key={index} className={styles.statCard} style={{ borderLeftColor: stat.color }}>
            <div className={styles.statIcon} style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              <stat.icon />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statTitle}>{stat.title}</p>
              <h3 className={styles.statValue}>{stat.value}</h3>
              <div className={styles.statChange}>
                {stat.change >= 0 ? (
                  <FiTrendingUp className={styles.trendUp} />
                ) : (
                  <FiTrendingDown className={styles.trendDown} />
                )}
                <span className={stat.change >= 0 ? styles.changeUp : styles.changeDown}>
                  {Math.abs(stat.change)}%
                </span>
                <span className={styles.changeLabel}>vs last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.chartsSection}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2>Revenue Overview</h2>
            <select className={styles.periodSelector}>
              <option value="7days">Last 7 days</option>
              <option value="30days" selected>Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="1year">Last year</option>
            </select>
          </div>
          {chartData.length > 0 && <ThreeRevenueChart data={chartData} />}
        </div>
      </div>

      <div className={styles.tablesSection}>
        <div className={styles.tableCard}>
          <h3>Recent Orders</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {dashboardStats?.recentOrders?.map((order) => (
                <tr key={order._id}>
                  <td>#{order.orderNumber}</td>
                  <td>{order.user?.firstName} {order.user?.lastName}</td>
                  <td>${order.totalAmount?.toFixed(2)}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.tableCard}>
          <h3>Order Status Distribution</h3>
          <div className={styles.statusList}>
            {dashboardStats?.orders?.byStatus?.map((status) => (
              <div key={status._id} className={styles.statusItem}>
                <div className={styles.statusInfo}>
                  <span className={styles.statusName}>{status._id}</span>
                  <span className={styles.statusCount}>{status.count} orders</span>
                </div>
                <div className={styles.statusBar}>
                  <div
                    className={styles.statusProgress}
                    style={{
                      width: `${(status.count / dashboardStats.orders.total) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
