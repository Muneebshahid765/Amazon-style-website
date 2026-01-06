import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  FiBarChart2,
  FiShoppingBag,
  FiUsers,
  FiPackage,
  FiRefreshCw,
  FiTrendingUp,
} from 'react-icons/fi';
import api from '../services/api';
import styles from './AdminDashboard.module.css';

const SummaryCard = ({ icon: Icon, label, value, helper, trend }) => (
  <div className={styles.summaryCard}>
    <div className={styles.summaryIcon}>
      <Icon />
    </div>
    <div>
      <p>{label}</p>
      <h3>{value}</h3>
      {helper && <span>{helper}</span>}
    </div>
    {typeof trend === 'number' && (
      <span className={`${styles.trendBadge} ${trend >= 0 ? styles.trendUp : styles.trendDown}`}>
        <FiTrendingUp />
        {trend >= 0 ? '+' : ''}
        {trend.toFixed(1)}%
      </span>
    )}
  </div>
);

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);
  const [salesAnalytics, setSalesAnalytics] = useState(null);
  const [customerAnalytics, setCustomerAnalytics] = useState(null);
  const [productPerformance, setProductPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useSelector((state) => state.auth.user);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, revenueRes, salesRes, customerRes, productRes] = await Promise.all([
        api.get('/admin/stats/overview'),
        api.get('/admin/stats/revenue?period=30days'),
        api.get('/admin/stats/sales'),
        api.get('/admin/stats/customers'),
        api.get('/admin/stats/products'),
      ]);

      setOverview(overviewRes.data);
      setRevenueAnalytics(revenueRes.data);
      setSalesAnalytics(salesRes.data);
      setCustomerAnalytics(customerRes.data);
      setProductPerformance(productRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load admin insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatCurrency = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
    []
  );

  if (user && user.role && user.role !== 'admin') {
    return (
      <div className={styles.restricted}>
        <h1>Limited Access</h1>
        <p>Sirf admin users is control center ko access kar sakte hain.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loader}>
        <div className={styles.loaderSpinner} />
        <p>Admin console tayar ho raha hai...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorPanel}>
        <p>{error}</p>
        <button type="button" onClick={fetchDashboard}>
          <FiRefreshCw />
          Dobara koshish karein
        </button>
      </div>
    );
  }

  const statusBreakdown = overview?.orders?.byStatus || [];
  const recentOrders = overview?.recentOrders || [];
  const topCustomers = customerAnalytics?.topCustomers?.slice(0, 4) || [];
  const customerGrowth = customerAnalytics?.customerGrowth?.slice(-6) || [];
  const topProducts = salesAnalytics?.bestSellingProducts?.slice(0, 4) || [];
  const lowStock = productPerformance?.lowStockProducts?.slice(0, 4) || [];
  const topRated = productPerformance?.topRatedProducts?.slice(0, 4) || [];
  const revenueBars = (revenueAnalytics?.revenueOverTime || []).slice(-12);
  const maxRevenue =
    revenueBars.reduce((max, point) => Math.max(max, point.revenue || 0), 0) || 1;
  const latestAvgOrder =
    revenueAnalytics?.avgOrderValue?.[revenueAnalytics.avgOrderValue.length - 1]?.avgValue || 0;

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <p>Assalam o Alaikum, {user?.firstName || 'Admin'} 👋</p>
          <h1>NovaMart Command Studio</h1>
          <span>Saari core commerce metrics yahin par maujood hain.</span>
        </div>
        <div className={styles.headerActions}>
          <small>Last synced: {new Date().toLocaleTimeString()}</small>
          <button type="button" onClick={fetchDashboard}>
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </header>

      <section className={styles.summaryGrid}>
        <SummaryCard
          icon={FiBarChart2}
          label="Total Revenue"
          value={formatCurrency.format(overview?.revenue?.total || 0)}
          helper={`Month: ${formatCurrency.format(overview?.revenue?.month || 0)}`}
          trend={overview?.revenue?.growth || 0}
        />
        <SummaryCard
          icon={FiShoppingBag}
          label="Orders Today"
          value={overview?.orders?.today || 0}
          helper={`This month: ${overview?.orders?.month || 0}`}
        />
        <SummaryCard
          icon={FiUsers}
          label="Active Customers"
          value={overview?.customers?.total || 0}
          helper={`New this month: ${overview?.customers?.newThisMonth || 0}`}
        />
        <SummaryCard
          icon={FiPackage}
          label="Catalog Health"
          value={`${overview?.products?.total || 0} products`}
          helper={`${overview?.products?.lowStock || 0} low on stock`}
        />
      </section>

      <section className={styles.analyticsGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Revenue Momentum</h2>
              <p>Akhri 12 dinon ka performance snapshot.</p>
            </div>
          </div>
          <div className={styles.barChart}>
            {revenueBars.map((point) => (
              <div key={point._id} className={styles.barWrapper}>
                <div
                  className={styles.bar}
                  style={{ height: `${((point.revenue || 0) / maxRevenue) * 100}%` }}
                  title={`${point._id}: ${formatCurrency.format(point.revenue || 0)}`}
                />
                <span>{point._id?.slice(5)}</span>
              </div>
            ))}
          </div>
          <footer className={styles.panelFooter}>
            <div>
              <p>Avg. Order Value</p>
              <strong>{formatCurrency.format(latestAvgOrder)}</strong>
            </div>
            <div>
              <p>Payment Mix</p>
              <div className={styles.paymentPills}>
                {revenueAnalytics?.revenueByPaymentMethod?.map((method) => (
                  <span key={method._id}>
                    {method._id || 'Other'} · {formatCurrency.format(method.revenue)}
                  </span>
                ))}
              </div>
            </div>
          </footer>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Order Radar</h2>
              <p>Status breakdown aur recent fulfillment.</p>
            </div>
          </div>
          <div className={styles.statusChips}>
            {statusBreakdown.map((status) => (
              <span key={status._id} className={styles.statusChip}>
                {status._id || 'unknown'} · {status.count}
              </span>
            ))}
            {statusBreakdown.length === 0 && <p>No order activity yet.</p>}
          </div>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td>{order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Guest'}</td>
                    <td>{formatCurrency.format(order.totalAmount || 0)}</td>
                    <td>
                      <span className={styles.badge}>{order.status}</span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan="4">Abhi tak koi recent order nahi hai.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Customer Pulse</h2>
              <p>Retention aur VIP shoppers ka overview.</p>
            </div>
          </div>
          <div className={styles.growthList}>
            {customerGrowth.map((entry) => (
              <div key={entry._id}>
                <span>{entry._id}</span>
                <strong>{entry.count}</strong>
              </div>
            ))}
            {customerGrowth.length === 0 && <p>No signup activity.</p>}
          </div>
          <div className={styles.topList}>
            {topCustomers.map((customer) => (
              <div key={customer.email} className={styles.topRow}>
                <div>
                  <strong>{customer.name}</strong>
                  <span>{customer.email}</span>
                </div>
                <div>
                  <strong>{customer.orderCount} orders</strong>
                  <span>{formatCurrency.format(customer.totalSpent || 0)}</span>
                </div>
              </div>
            ))}
            {topCustomers.length === 0 && <p>No customer data yet.</p>}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Product Watch</h2>
              <p>Top-rated aur low-stock SKUs par nazar rakhein.</p>
            </div>
          </div>
          <div className={styles.dualList}>
            <div>
              <h3>Best Sellers</h3>
              {topProducts.map((product) => (
                <div key={product._id} className={styles.productRow}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.totalSold} units</span>
                  </div>
                  <span>{formatCurrency.format(product.revenue || 0)}</span>
                </div>
              ))}
              {topProducts.length === 0 && <p>No sales yet.</p>}
            </div>
            <div>
              <h3>Low Stock Alert</h3>
              {lowStock.map((product) => (
                <div key={product._id} className={styles.productRow}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>{formatCurrency.format(product.price || 0)}</span>
                  </div>
                  <span className={styles.badge}>{product.stock} left</span>
                </div>
              ))}
              {lowStock.length === 0 && <p>Inventory stable.</p>}
            </div>
            <div className={styles.fullWidth}>
              <h3>Top Rated Picks</h3>
              <div className={styles.ratingChips}>
                {topRated.map((product) => (
                  <span key={product._id}>
                    {product.name} · {product.rating?.toFixed(1) || '0'} ★
                  </span>
                ))}
                {topRated.length === 0 && <p>No rating data.</p>}
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

export default AdminDashboard;
