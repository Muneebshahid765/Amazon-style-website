import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductAnalytics, fetchSalesOverview } from '../../../redux/slices/sellerSlice';
import { FiTrendingUp, FiEye, FiShoppingCart, FiStar } from 'react-icons/fi';
import ThreeRevenueChart from '../../../components/dashboard/ThreeRevenueChart';
import styles from './Analytics.module.css';

const Analytics = () => {
  const dispatch = useDispatch();
  const { analytics, salesOverview, loading } = useSelector((state) => state.seller);
  const [period, setPeriod] = useState('30days');

  useEffect(() => {
    dispatch(fetchProductAnalytics());
    dispatch(fetchSalesOverview(period));
  }, [dispatch, period]);

  const chartData = salesOverview?.data?.map((item) => ({
    label: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: item.revenue,
  })) || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div><h1>Store Analytics</h1><p>Track your store performance and insights</p></div>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className={styles.periodSelect}>
          <option value="7days">Last 7 days</option>
          <option value="30days">Last 30 days</option>
          <option value="90days">Last 90 days</option>
        </select>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{background: '#dbeafe', color: '#3b82f6'}}><FiEye /></div>
          <div><p className={styles.statLabel}>Total Views</p><p className={styles.statValue}>{analytics?.analytics?.totalViews?.toLocaleString() || 0}</p></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{background: '#d1fae5', color: '#10b981'}}><FiShoppingCart /></div>
          <div><p className={styles.statLabel}>Total Sold</p><p className={styles.statValue}>{analytics?.analytics?.totalSold?.toLocaleString() || 0}</p></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{background: '#fef3c7', color: '#f59e0b'}}><FiStar /></div>
          <div><p className={styles.statLabel}>Avg Rating</p><p className={styles.statValue}>{analytics?.analytics?.avgRating?.toFixed(1) || '0.0'}</p></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{background: '#e0e7ff', color: '#6366f1'}}><FiTrendingUp /></div>
          <div><p className={styles.statLabel}>Conversion</p><p className={styles.statValue}>{analytics?.analytics?.totalSold && analytics?.analytics?.totalViews ? ((analytics.analytics.totalSold / analytics.analytics.totalViews) * 100).toFixed(1) : 0}%</p></div>
        </div>
      </div>

      <div className={styles.chartSection}>
        <div className={styles.chartCard}>
          <h3>Sales Trend</h3>
          {chartData.length > 0 && <ThreeRevenueChart data={chartData} />}
        </div>
      </div>

      <div className={styles.section}>
        <h3>Top Performing Products</h3>
        <div className={styles.productsList}>
          {(analytics?.topProducts || []).map((product, index) => (
            <div key={index} className={styles.productItem}>
              <span className={styles.rank}>{index + 1}</span>
              <div className={styles.productInfo}>
                <p className={styles.productName}>{product.title}</p>
                <div className={styles.productStats}>
                  <span><FiShoppingCart /> {product.soldCount} sold</span>
                  <span><FiEye /> {product.viewsCount} views</span>
                  <span><FiStar /> {product.ratingsAverage?.toFixed(1) || '0.0'}</span>
                </div>
              </div>
            </div>
          ))}
          {(!analytics?.topProducts || analytics.topProducts.length === 0) && (
            <div className={styles.empty}>No product data available yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
