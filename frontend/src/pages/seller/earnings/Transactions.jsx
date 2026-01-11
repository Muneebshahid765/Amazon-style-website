import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTransactions } from '../../../redux/slices/sellerSlice';
import { FiSearch, FiCalendar, FiDownload, FiArrowDownCircle, FiArrowUpCircle, FiActivity } from 'react-icons/fi';
import styles from './Transactions.module.css';

const TRANSACTION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'subscription', label: 'Subscriptions (Debits)' },
  { value: 'payout', label: 'Payouts (Credits)' },
  { value: 'debit', label: 'Only Debits' },
  { value: 'credit', label: 'Only Credits' },
];

const Transactions = () => {
  const dispatch = useDispatch();
  const { transactions, pagination, loading, transactionSummary } = useSelector((state) => state.seller);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [transactionType, setTransactionType] = useState('');

  useEffect(() => {
    const params = { page: currentPage, limit: 20 };
    if (dateRange.startDate) params.startDate = dateRange.startDate;
    if (dateRange.endDate) params.endDate = dateRange.endDate;
    if (transactionType) params.type = transactionType;
    dispatch(fetchTransactions(params));
  }, [dispatch, currentPage, dateRange, transactionType]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    const params = { page: 1, limit: 20 };
    if (dateRange.startDate) params.startDate = dateRange.startDate;
    if (dateRange.endDate) params.endDate = dateRange.endDate;
    if (transactionType) params.type = transactionType;
    dispatch(fetchTransactions(params));
  };

  const clearFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
    setTransactionType('');
    setCurrentPage(1);
    dispatch(fetchTransactions({ page: 1, limit: 20 }));
  };

  const filteredTransactions = transactions.filter((t) =>
    searchTerm
      ? t.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  const summaryTiles = [
    {
      key: 'debits',
      label: 'Total Debits (Spent)',
      value: transactionSummary.totalDebits || 0,
      icon: FiArrowDownCircle,
      accent: styles.debitTile,
      prefix: '-',
    },
    {
      key: 'credits',
      label: 'Total Credits (Payouts)',
      value: transactionSummary.totalCredits || 0,
      icon: FiArrowUpCircle,
      accent: styles.creditTile,
      prefix: '+',
    },
    {
      key: 'net',
      label: 'Net',
      value: transactionSummary.net || 0,
      icon: FiActivity,
      accent: (transactionSummary.net || 0) >= 0 ? styles.netPositiveTile : styles.netNegativeTile,
      prefix: (transactionSummary.net || 0) >= 0 ? '+' : '-',
    },
  ];

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

      <div className={styles.summaryGrid}>
        {summaryTiles.map((tile) => {
          const Icon = tile.icon;
          const absoluteValue = Math.abs(tile.value).toFixed(2);
          return (
            <div key={tile.key} className={`${styles.summaryCard} ${tile.accent}`}>
              <div className={styles.summaryIcon}>
                <Icon />
              </div>
              <div>
                <p className={styles.summaryLabel}>{tile.label}</p>
                <p className={styles.summaryValue}>
                  {tile.key === 'net' ? '' : tile.prefix}
                  ${absoluteValue}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.filtersCard}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by reference or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filtersRow}>
          <div className={styles.typeSelect}>
            <label>Type</label>
            <select value={transactionType} onChange={(e) => setTransactionType(e.target.value)}>
              {TRANSACTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
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
          </div>
          <button onClick={handleApplyFilters} className={styles.filterBtn}>
            Apply
          </button>
          {(dateRange.startDate || dateRange.endDate || transactionType) && (
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
                <th>Reference</th>
                <th>Description</th>
                <th>Type</th>
                <th>Direction</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{new Date(transaction.date).toLocaleDateString()}</td>
                  <td className={styles.orderNumber}>{transaction.reference}</td>
                  <td className={styles.productTitle}>{transaction.description}</td>
                  <td>
                    <span className={`${styles.typeBadge} ${styles[transaction.type]}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.directionBadge} ${
                        transaction.direction === 'debit' ? styles.debit : styles.credit
                      }`}
                    >
                      {transaction.direction === 'debit' ? (
                        <>
                          <FiArrowDownCircle /> Outgoing
                        </>
                      ) : (
                        <>
                          <FiArrowUpCircle /> Incoming
                        </>
                      )}
                    </span>
                  </td>
                  <td className={styles.total}>
                    {transaction.direction === 'debit' ? '-' : '+'}${transaction.amount?.toFixed(2)}
                  </td>
                  <td>
                    <span className={`${styles.status} ${styles[transaction.status]}`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="7" className={styles.empty}>
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
