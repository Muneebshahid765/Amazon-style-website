import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiCalendar, FiShoppingCart, FiArrowRight } from 'react-icons/fi';
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
