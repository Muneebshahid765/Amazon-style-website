import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats, fetchSalesOverview } from '../../redux/slices/sellerSlice';
import { FiDollarSign, FiShoppingCart, FiPackage, FiStar, FiTrendingUp, FiTrendingDown, FiAlertCircle } from 'react-icons/fi';
import ThreeRevenueChart from '../../components/dashboard/ThreeRevenueChart';
import SubscriptionBanner from '../../components/seller/SubscriptionBanner';
import styles from './SellerDashboard.module.css';

const SellerDashboard = () => {
  const dispatch = useDispatch();
  const [period, setPeriod] = useState('30days');
  const { dashboardStats, salesOverview, loading } = useSelector((state) => state.seller);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchSalesOverview(period));
  }, [dispatch, period]);

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${dashboardStats?.revenue?.total?.toLocaleString() || 0}`,
      subtitle: `$${dashboardStats?.revenue?.thisMonth?.toLocaleString() || 0} this month`,
      icon: FiDollarSign,
      color: '#10b981',
      change: 15.3,
    },
    {
      title: 'Total Orders',
      value: dashboardStats?.orders?.total?.toLocaleString() || 0,
      subtitle: `${dashboardStats?.orders?.pending || 0} pending`,
      icon: FiShoppingCart,
      color: '#3b82f6',
      change: 8.2,
    },
    {
      title: 'Total Products',
      value: dashboardStats?.products?.total?.toLocaleString() || 0,
      subtitle: `${dashboardStats?.products?.lowStock || 0} low stock`,
      icon: FiPackage,
      color: '#8b5cf6',
      change: 3.1,
    },
    {
      title: 'Store Rating',
      value: dashboardStats?.rating?.toFixed(1) || '0.0',
      subtitle: 'Average rating',
      icon: FiStar,
      color: '#f59e0b',
      change: 0.5,
    },
  ];

  const chartData = salesOverview?.data?.map((item) => ({
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
        <div>
          <h1>Seller Dashboard</h1>
          <p>Track your store performance and manage your business</p>
        </div>
        <button className={styles.addButton}>
          <FiPackage /> Add New Product
        </button>
      </div>

      <SubscriptionBanner />

      {dashboardStats?.products?.lowStock > 0 && (
        <div className={styles.alert}>
          <FiAlertCircle />
          <div>
            <strong>Low Stock Alert!</strong>
            <p>You have {dashboardStats.products.lowStock} products running low on stock.</p>
          </div>
          <button className={styles.alertButton}>View Products</button>
        </div>
      )}

      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div key={index} className={styles.statCard} style={{ borderLeftColor: stat.color }}>
            <div className={styles.statIcon} style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              <stat.icon />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statTitle}>{stat.title}</p>
              <h3 className={styles.statValue}>{stat.value}</h3>
              <p className={styles.statSubtitle}>{stat.subtitle}</p>
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
            <h2>Sales Overview</h2>
            <select
              className={styles.periodSelector}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
            </select>
          </div>
          {chartData.length > 0 && <ThreeRevenueChart data={chartData} />}
        </div>
      </div>

      <div className={styles.quickActions}>
        <h3>Quick Actions</h3>
        <div className={styles.actionGrid}>
          <button className={styles.actionCard}>
            <FiPackage className={styles.actionIcon} />
            <span>Add Product</span>
          </button>
          <button className={styles.actionCard}>
            <FiShoppingCart className={styles.actionIcon} />
            <span>View Orders</span>
          </button>
          <button className={styles.actionCard}>
            <FiDollarSign className={styles.actionIcon} />
            <span>Request Payout</span>
          </button>
          <button className={styles.actionCard}>
            <FiStar className={styles.actionIcon} />
            <span>View Reviews</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
