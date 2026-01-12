import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiCalendar, FiShoppingCart, FiArrowRight, FiTrendingUp } from 'react-icons/fi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { fetchUserTransactions } from '../redux/slices/userSlice';
import styles from '../styles/BuyerTransactions.module.css';

const ORDER_STATUS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

const BuyerTransactions = () => {
  const dispatch = useDispatch();
  const { transactions, transactionsStatus, transactionSummary, transactionsPagination } = useSelector(
    (state) => state.user
  );

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
    page: 1,
  });

  useEffect(() => {
    const params = {
      page: filters.page,
      limit: 10,
    };
    if (filters.status) params.status = filters.status;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    dispatch(fetchUserTransactions(params));
  }, [dispatch, filters.page, filters.status, filters.startDate, filters.endDate]);

  const generateSpendingChartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      const data = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        data.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          spending: 0,
          orders: 0,
        });
      }
      return data;
    }

    const monthlyData = {};
    transactions.forEach(txn => {
      const date = new Date(txn.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { spending: 0, orders: 0 };
      }
      monthlyData[monthKey].spending += txn.total || 0;
      monthlyData[monthKey].orders += 1;
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      spending: data.spending,
      orders: data.orders,
    })).slice(-6);
  }, [transactions]);

  const statusDistribution = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    const statusCount = {};
    transactions.forEach(txn => {
      statusCount[txn.status] = (statusCount[txn.status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!filters.search) return transactions;
    return transactions.filter((txn) =>
      txn.orderNumber?.toLowerCase().includes(filters.search.toLowerCase())
    );
  }, [transactions, filters.search]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handlePageChange = (direction) => {
    setFilters((prev) => ({
      ...prev,
      page: Math.min(
        Math.max(1, prev.page + direction),
        transactionsPagination.totalPages || 1
      ),
    }));
  };

  const resetFilters = () => {
    setFilters({ search: '', status: '', startDate: '', endDate: '', page: 1 });
  };

  const isLoading = transactionsStatus === 'loading' && transactions.length === 0;

  return (
    <div className={styles.transactionsWrapper}>
      <header className={styles.header}>
        <div>
          <h1>Spending & Orders</h1>
          <p>Your order payments and checkout history</p>
        </div>
      </header>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <p>Total Orders</p>
          <strong>{transactionSummary.totalOrders || 0}</strong>
        </div>
        <div className={styles.summaryCard}>
          <p>Total Spent</p>
          <strong>Rs. {(transactionSummary.totalSpent || 0).toLocaleString()}</strong>
        </div>
        <div className={styles.summaryCard}>
          <p>Average Order Value</p>
          <strong>Rs. {Math.round(transactionSummary.averageOrderValue || 0).toLocaleString()}</strong>
        </div>
      </div>

      <div className={styles.chartsSection}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3><FiTrendingUp /> Spending Trend</h3>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={generateSpendingChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `Rs.${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value, name) => [
                    name === 'spending' ? `Rs. ${Number(value).toLocaleString()}` : value,
                    name === 'spending' ? 'Spending' : 'Orders'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="spending" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSpending)" 
                  name="Spending"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Orders by Status</h3>
          </div>
          <div className={styles.chartContainer}>
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyChart}>
                <FiShoppingCart />
                <p>No order data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.filtersRow}>
        <div className={styles.searchBox}>
          <FiSearch />
          <input
            name="search"
            type="text"
            placeholder="Search by order number..."
            value={filters.search}
            onChange={handleInputChange}
          />
        </div>

        <div className={styles.selectBox}>
          <label>Status</label>
          <select name="status" value={filters.status} onChange={handleInputChange}>
            {ORDER_STATUS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.dateFilters}>
          <div className={styles.dateField}>
            <FiCalendar />
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleInputChange}
            />
          </div>
          <span>to</span>
          <div className={styles.dateField}>
            <FiCalendar />
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {(filters.status || filters.startDate || filters.endDate || filters.search) && (
          <button type="button" className={styles.clearBtn} onClick={resetFilters}>
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div className={styles.loadingState}>Loading transactions...</div>
      ) : filteredTransactions.length === 0 ? (
        <div className={styles.emptyState}>
          <FiShoppingCart />
          <h3>No transactions found</h3>
          <p>Try adjusting filters or place your first order!</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Order</th>
                <th>Items</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((txn) => (
                <tr key={txn.id}>
                  <td>{new Date(txn.date).toLocaleDateString()}</td>
                  <td className={styles.orderNumber}>{txn.orderNumber}</td>
                  <td>{txn.itemsCount}</td>
                  <td className={styles.method}>{txn.paymentDisplayMethod || txn.paymentMethod}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[txn.status] || ''}`}>
                      {txn.status}
                    </span>
                  </td>
                  <td className={styles.total}>Rs. {txn.total?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {transactionsPagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            onClick={() => handlePageChange(-1)}
            disabled={filters.page === 1}
          >
            Previous
          </button>
          <span>
            Page {filters.page} of {transactionsPagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => handlePageChange(1)}
            disabled={filters.page >= transactionsPagination.totalPages}
          >
            Next
          </button>
        </div>
      )}

      <div className={styles.tipCard}>
        <FiArrowRight />
        <p>Need invoices? Download them from individual order details in the Orders tab.</p>
      </div>
    </div>
  );
};

export default BuyerTransactions;
