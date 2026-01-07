import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTransactions } from '../../../redux/slices/sellerSlice';
import { FiSearch, FiCalendar, FiDownload, FiExternalLink } from 'react-icons/fi';
import styles from './Transactions.module.css';

const Transactions = () => {
  const dispatch = useDispatch();
  const { transactions, pagination, loading } = useSelector((state) => state.seller);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const params = { page: currentPage, limit: 20 };
    if (dateRange.startDate) params.startDate = dateRange.startDate;
    if (dateRange.endDate) params.endDate = dateRange.endDate;
    dispatch(fetchTransactions(params));
  }, [dispatch, currentPage, dateRange]);

  const handleDateFilter = () => {
    setCurrentPage(1);
    dispatch(fetchTransactions({ page: 1, limit: 20, ...dateRange }));
  };

  const clearFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
    setCurrentPage(1);
  };

  const filteredTransactions = transactions.filter((t) =>
    searchTerm
      ? t.productTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (t.total || 0), 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Transactions</h1>
          <p>View all your sales transactions</p>
        </div>
        <button className={styles.exportBtn}>
          <FiDownload /> Export CSV
        </button>
      </div>

      <div className={styles.summaryCard}>
        <div className={styles.summaryItem}>
          <p className={styles.summaryLabel}>Total Transactions</p>
          <p className={styles.summaryValue}>{pagination.total || filteredTransactions.length}</p>
        </div>
        <div className={styles.summaryItem}>
          <p className={styles.summaryLabel}>Total Revenue</p>
          <p className={styles.summaryValue}>${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by product or order..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.dateFilters}>
          <div className={styles.dateInput}>
            <FiCalendar />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              placeholder="Start Date"
            />
          </div>
          <span>to</span>
          <div className={styles.dateInput}>
            <FiCalendar />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              placeholder="End Date"
            />
          </div>
          <button onClick={handleDateFilter} className={styles.filterBtn}>
            Apply
          </button>
          {(dateRange.startDate || dateRange.endDate) && (
            <button onClick={clearFilters} className={styles.clearBtn}>
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading transactions...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Order #</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction, index) => (
                <tr key={`${transaction.orderId}-${index}`}>
                  <td>{new Date(transaction.date).toLocaleDateString()}</td>
                  <td className={styles.orderNumber}>{transaction.orderNumber}</td>
                  <td className={styles.productTitle}>{transaction.productTitle}</td>
                  <td>{transaction.quantity}</td>
                  <td>${transaction.price?.toFixed(2)}</td>
                  <td className={styles.total}>${transaction.total?.toFixed(2)}</td>
                  <td>
                    <span className={`${styles.status} ${styles[transaction.status]}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td>
                    <a
                      href={`/seller/orders/${transaction.orderId}`}
                      className={styles.viewLink}
                      title="View Order"
                    >
                      <FiExternalLink />
                    </a>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="8" className={styles.empty}>
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className={styles.pageBtn}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {pagination.totalPages}
          </span>
          <button
            disabled={currentPage >= pagination.totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className={styles.pageBtn}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Transactions;
