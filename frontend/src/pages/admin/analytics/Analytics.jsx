import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRevenueAnalytics, fetchSalesAnalytics, fetchCustomerAnalytics } from '../../../redux/slices/adminSlice';
import { FiTrendingUp, FiUsers, FiShoppingCart, FiDollarSign } from 'react-icons/fi';
import ThreeRevenueChart from '../../../components/dashboard/ThreeRevenueChart';
import styles from './Analytics.module.css';

const Analytics = () => {
  const dispatch = useDispatch();
  const { revenueAnalytics, salesAnalytics, customerAnalytics, loading } = useSelector((state) => state.admin);
  const [period, setPeriod] = useState('30days');

  useEffect(() => {
    dispatch(fetchRevenueAnalytics(period));
    dispatch(fetchSalesAnalytics());
    dispatch(fetchCustomerAnalytics());
  }, [dispatch, period]);

  const chartData = revenueAnalytics?.revenueOverTime?.map((item) => ({
    label: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: item.revenue,
  })) || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div><h1>Analytics Dashboard</h1><p>Comprehensive insights into your platform performance</p></div>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className={styles.periodSelect}>
          <option value="7days">Last 7 days</option>
          <option value="30days">Last 30 days</option>
          <option value="90days">Last 90 days</option>
          <option value="1year">Last year</option>
        </select>
      </div>

      <div className={styles.chartSection}>
        <div className={styles.chartCard}>
          <h3>Revenue Trend</h3>
          {chartData.length > 0 && <ThreeRevenueChart data={chartData} />}
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3><FiShoppingCart /> Best Selling Products</h3>
          <div className={styles.list}>
            {(salesAnalytics?.bestSellingProducts || []).slice(0, 5).map((product, index) => (
              <div key={index} className={styles.listItem}>
                <span className={styles.rank}>{index + 1}</span>
                <img src={product.image || '/placeholder.png'} alt={product.name} className={styles.productImg} />
                <div className={styles.productInfo}>
                  <p className={styles.productName}>{product.name}</p>
                  <p className={styles.productStats}>{product.totalSold} sold • ${product.revenue?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <h3><FiUsers /> Top Customers</h3>
          <div className={styles.list}>
            {(customerAnalytics?.topCustomers || []).slice(0, 5).map((customer, index) => (
              <div key={index} className={styles.listItem}>
                <span className={styles.rank}>{index + 1}</span>
                <div className={styles.avatar}>{customer.name?.[0]}</div>
                <div className={styles.customerInfo}>
                  <p className={styles.customerName}>{customer.name}</p>
                  <p className={styles.customerStats}>{customer.orderCount} orders • ${customer.totalSpent?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <h3><FiDollarSign /> Revenue by Category</h3>
          <div className={styles.categoryList}>
            {(revenueAnalytics?.revenueByCategory || []).slice(0, 5).map((cat, index) => (
              <div key={index} className={styles.categoryItem}>
                <div className={styles.categoryInfo}>
                  <span className={styles.categoryName}>{cat._id || 'Uncategorized'}</span>
                  <span className={styles.categoryRevenue}>${cat.revenue?.toLocaleString()}</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progress} style={{ width: `${(cat.revenue / (revenueAnalytics?.revenueByCategory?.[0]?.revenue || 1)) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <h3><FiTrendingUp /> Customer Growth</h3>
          <div className={styles.growthList}>
            {(customerAnalytics?.customerGrowth || []).slice(-7).map((day, index) => (
              <div key={index} className={styles.growthItem}>
                <span className={styles.growthDate}>{new Date(day._id).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <div className={styles.growthBar} style={{ height: `${Math.max(20, day.count * 10)}px` }}></div>
                <span className={styles.growthCount}>{day.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
