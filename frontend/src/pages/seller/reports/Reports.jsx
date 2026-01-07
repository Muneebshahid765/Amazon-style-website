import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSalesReport, fetchInventoryReport } from '../../../redux/slices/sellerSlice';
import {
  FiTrendingUp,
  FiPackage,
  FiDollarSign,
  FiShoppingCart,
  FiAlertTriangle,
  FiDownload,
} from 'react-icons/fi';
import styles from './Reports.module.css';

const Reports = () => {
  const dispatch = useDispatch();
  const { salesReport, inventoryReport, loading } = useSelector((state) => state.seller);
  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [groupBy, setGroupBy] = useState('day');

  useEffect(() => {
    if (activeTab === 'sales') {
      dispatch(fetchSalesReport({ ...dateRange, groupBy }));
    } else {
      dispatch(fetchInventoryReport());
    }
  }, [dispatch, activeTab, dateRange, groupBy]);

  const handleApplyFilter = () => {
    dispatch(fetchSalesReport({ ...dateRange, groupBy }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Reports</h1>
          <p>Analyze your store performance and inventory</p>
        </div>
        <button className={styles.exportBtn}>
          <FiDownload /> Export Report
        </button>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'sales' ? styles.active : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          <FiTrendingUp /> Sales Report
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'inventory' ? styles.active : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <FiPackage /> Inventory Report
        </button>
      </div>

      {activeTab === 'sales' && (
        <div className={styles.salesSection}>
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <label>Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div className={styles.filterGroup}>
              <label>End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
            <div className={styles.filterGroup}>
              <label>Group By</label>
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>
            <button onClick={handleApplyFilter} className={styles.applyBtn}>
              Apply
            </button>
          </div>

          {salesReport?.totals && (
            <div className={styles.summaryCards}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon} style={{ background: '#d1fae5', color: '#10b981' }}>
                  <FiDollarSign />
                </div>
                <div>
                  <p className={styles.summaryLabel}>Total Revenue</p>
                  <p className={styles.summaryValue}>
                    ${salesReport.totals.totalRevenue?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon} style={{ background: '#dbeafe', color: '#3b82f6' }}>
                  <FiShoppingCart />
                </div>
                <div>
                  <p className={styles.summaryLabel}>Total Orders</p>
                  <p className={styles.summaryValue}>{salesReport.totals.totalOrders || 0}</p>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon} style={{ background: '#fef3c7', color: '#f59e0b' }}>
                  <FiPackage />
                </div>
                <div>
                  <p className={styles.summaryLabel}>Units Sold</p>
                  <p className={styles.summaryValue}>{salesReport.totals.totalUnits || 0}</p>
                </div>
              </div>
            </div>
          )}

          <div className={styles.card}>
            <h3>Sales Data</h3>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Revenue</th>
                    <th>Orders</th>
                    <th>Units Sold</th>
                    <th>Avg Order Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(salesReport?.data || []).map((row) => (
                    <tr key={row._id}>
                      <td>{row._id}</td>
                      <td className={styles.revenue}>${row.revenue?.toFixed(2)}</td>
                      <td>{row.orders}</td>
                      <td>{row.unitsSold}</td>
                      <td>${row.orders > 0 ? (row.revenue / row.orders).toFixed(2) : '0.00'}</td>
                    </tr>
                  ))}
                  {(!salesReport?.data || salesReport.data.length === 0) && (
                    <tr>
                      <td colSpan="5" className={styles.empty}>
                        No sales data for the selected period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className={styles.inventorySection}>
          {inventoryReport?.summary && (
            <div className={styles.summaryCards}>
              <div className={styles.summaryCard}>
                <div
                  className={styles.summaryIcon}
                  style={{ background: '#fee2e2', color: '#ef4444' }}
                >
                  <FiAlertTriangle />
                </div>
                <div>
                  <p className={styles.summaryLabel}>Out of Stock</p>
                  <p className={styles.summaryValue}>{inventoryReport.summary.outOfStockCount}</p>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div
                  className={styles.summaryIcon}
                  style={{ background: '#fef3c7', color: '#f59e0b' }}
                >
                  <FiAlertTriangle />
                </div>
                <div>
                  <p className={styles.summaryLabel}>Low Stock</p>
                  <p className={styles.summaryValue}>{inventoryReport.summary.lowStockCount}</p>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div
                  className={styles.summaryIcon}
                  style={{ background: '#d1fae5', color: '#10b981' }}
                >
                  <FiDollarSign />
                </div>
                <div>
                  <p className={styles.summaryLabel}>Inventory Value</p>
                  <p className={styles.summaryValue}>
                    ${inventoryReport.summary.totalInventoryValue?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className={styles.card}>
            <h3>Inventory Status</h3>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Stock</th>
                    <th>Low Stock Threshold</th>
                    <th>Price</th>
                    <th>Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(inventoryReport?.inventory || []).map((item) => {
                    const isOutOfStock = item.stock === 0;
                    const isLowStock = item.stock > 0 && item.stock <= (item.lowStockThreshold || 5);
                    return (
                      <tr key={item._id}>
                        <td>
                          <div className={styles.productCell}>
                            {item.images?.[0]?.url && (
                              <img
                                src={item.images[0].url}
                                alt={item.title}
                                className={styles.productImage}
                              />
                            )}
                            <span>{item.title}</span>
                          </div>
                        </td>
                        <td className={styles.sku}>{item.sku || '-'}</td>
                        <td>{item.stock}</td>
                        <td>{item.lowStockThreshold || 5}</td>
                        <td>${item.price?.toFixed(2)}</td>
                        <td>${(item.price * item.stock).toFixed(2)}</td>
                        <td>
                          {isOutOfStock ? (
                            <span className={`${styles.stockStatus} ${styles.outOfStock}`}>
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className={`${styles.stockStatus} ${styles.lowStock}`}>
                              Low Stock
                            </span>
                          ) : (
                            <span className={`${styles.stockStatus} ${styles.inStock}`}>
                              In Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {(!inventoryReport?.inventory || inventoryReport.inventory.length === 0) && (
                    <tr>
                      <td colSpan="7" className={styles.empty}>
                        No inventory data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
