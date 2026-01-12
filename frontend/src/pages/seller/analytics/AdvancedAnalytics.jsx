import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FiTrendingUp, FiDollarSign, FiShoppingCart, FiUsers, 
  FiPackage, FiCalendar, FiDownload, FiFilter 
} from 'react-icons/fi';
import FeatureGuard from '../../../components/common/FeatureGuard';
import { fetchProductAnalytics, fetchSalesReport } from '../../../redux/slices/sellerSlice';
import styles from './AdvancedAnalytics.module.css';

const AdvancedAnalytics = () => {
  const dispatch = useDispatch();
  const { analytics, salesReport, loading } = useSelector((state) => state.seller);
  const [dateRange, setDateRange] = useState('30days');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  useEffect(() => {
    dispatch(fetchProductAnalytics({ period: dateRange }));
    dispatch(fetchSalesReport({ period: dateRange }));
  }, [dispatch, dateRange]);

  const metrics = [
    {
      key: 'revenue',
      label: 'Total Revenue',
      value: analytics?.totalRevenue || 0,
      change: analytics?.revenueChange || 0,
      icon: FiDollarSign,
      color: '#10b981',
      format: 'currency',
    },
    {
      key: 'orders',
      label: 'Total Orders',
      value: analytics?.totalOrders || 0,
      change: analytics?.ordersChange || 0,
      icon: FiShoppingCart,
      color: '#3b82f6',
      format: 'number',
    },
    {
      key: 'customers',
      label: 'Unique Customers',
      value: analytics?.uniqueCustomers || 0,
      change: analytics?.customersChange || 0,
      icon: FiUsers,
      color: '#8b5cf6',
      format: 'number',
    },
    {
      key: 'products',
      label: 'Products Sold',
      value: analytics?.productsSold || 0,
      change: analytics?.productsChange || 0,
      icon: FiPackage,
      color: '#f59e0b',
      format: 'number',
    },
  ];

  const formatValue = (value, format) => {
    if (format === 'currency') {
      return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return Number(value).toLocaleString();
  };

  const exportReport = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'Metric,Value,Change\n' +
      metrics.map(m => `${m.label},${m.value},${m.change}%`).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analytics-${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <FeatureGuard featureKey="advancedAnalytics">
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Advanced Analytics</h1>
            <p>Deep insights into your business performance</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.dateSelector}>
              <FiCalendar />
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="1year">Last Year</option>
              </select>
            </div>
            <button className={styles.exportBtn} onClick={exportReport}>
              <FiDownload /> Export Report
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading analytics...</div>
        ) : (
          <>
            <div className={styles.metricsGrid}>
              {metrics.map((metric) => {
                const Icon = metric.icon;
                const isPositive = metric.change >= 0;
                
                return (
                  <div 
                    key={metric.key} 
                    className={`${styles.metricCard} ${selectedMetric === metric.key ? styles.selected : ''}`}
                    onClick={() => setSelectedMetric(metric.key)}
                  >
                    <div className={styles.metricIcon} style={{ backgroundColor: `${metric.color}20` }}>
                      <Icon style={{ color: metric.color }} />
                    </div>
                    <div className={styles.metricContent}>
                      <div className={styles.metricLabel}>{metric.label}</div>
                      <div className={styles.metricValue}>{formatValue(metric.value, metric.format)}</div>
                      <div className={`${styles.metricChange} ${isPositive ? styles.positive : styles.negative}`}>
                        <FiTrendingUp />
                        <span>{isPositive ? '+' : ''}{metric.change}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.chartsSection}>
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h3>Revenue Trend</h3>
                  <div className={styles.chartFilters}>
                    <button className={styles.filterBtn}>
                      <FiFilter /> Filter
                    </button>
                  </div>
                </div>
                <div className={styles.chartPlaceholder}>
                  <FiTrendingUp />
                  <p>Revenue trend chart will be displayed here</p>
                  <span>Integrate with Chart.js or Recharts for visualization</span>
                </div>
              </div>

              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h3>Top Products</h3>
                </div>
                <div className={styles.topProductsList}>
                  {analytics?.topProducts && analytics.topProducts.length > 0 ? (
                    analytics.topProducts.slice(0, 5).map((product, idx) => (
                      <div key={product._id} className={styles.productItem}>
                        <div className={styles.productRank}>#{idx + 1}</div>
                        <div className={styles.productInfo}>
                          <div className={styles.productName}>{product.name}</div>
                          <div className={styles.productStats}>
                            {product.sales} sales · ${product.revenue?.toFixed(2)}
                          </div>
                        </div>
                        <div className={styles.productBar}>
                          <div 
                            className={styles.productBarFill} 
                            style={{ width: `${(product.sales / analytics.topProducts[0]?.sales) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyState}>
                      <FiPackage />
                      <p>No product data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.insightsSection}>
              <h3>AI-Powered Insights</h3>
              <div className={styles.insightsGrid}>
                <div className={styles.insightCard}>
                  <div className={styles.insightIcon}>💡</div>
                  <div className={styles.insightContent}>
                    <h4>Peak Sales Time</h4>
                    <p>Your sales peak between 2 PM - 5 PM. Consider running promotions during this time.</p>
                  </div>
                </div>
                <div className={styles.insightCard}>
                  <div className={styles.insightIcon}>📈</div>
                  <div className={styles.insightContent}>
                    <h4>Growth Opportunity</h4>
                    <p>Electronics category shows 45% growth. Consider expanding your inventory.</p>
                  </div>
                </div>
                <div className={styles.insightCard}>
                  <div className={styles.insightIcon}>⚠️</div>
                  <div className={styles.insightContent}>
                    <h4>Low Stock Alert</h4>
                    <p>3 products are running low on stock. Restock to avoid lost sales.</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </FeatureGuard>
  );
};

export default AdvancedAnalytics;
