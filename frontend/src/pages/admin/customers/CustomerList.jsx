import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCustomers } from '../../../redux/slices/adminSlice';
import { FiSearch, FiFilter, FiEye, FiMail } from 'react-icons/fi';
import styles from './CustomerList.module.css';

const CustomerList = () => {
  const dispatch = useDispatch();
  const { customers, loading } = useSelector((state) => state.admin);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const params = { page: currentPage, limit: 20 };
    if (searchTerm) params.search = searchTerm;
    dispatch(fetchCustomers(params));
  }, [dispatch, currentPage, searchTerm]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Customer Management</h1>
        <p>View and manage all customers</p>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} />
          <input type="text" placeholder="Search customers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.searchInput} />
        </div>
        <button className={styles.filterButton}><FiFilter /> Filters</button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading customers...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(customers || []).map((customer) => (
                <tr key={customer._id}>
                  <td>
                    <div className={styles.customerInfo}>
                      <div className={styles.avatar}>{customer.firstName?.[0]}{customer.lastName?.[0]}</div>
                      <div>
                        <p className={styles.customerName}>{customer.firstName} {customer.lastName}</p>
                        <p className={styles.customerId}>ID: {customer._id?.slice(-8)}</p>
                      </div>
                    </div>
                  </td>
                  <td>{customer.email}</td>
                  <td>{customer.ordersCount || 0}</td>
                  <td className={styles.spent}>${customer.totalSpent?.toFixed(2) || '0.00'}</td>
                  <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                  <td><span className={`${styles.status} ${styles[customer.accountStatus || 'active']}`}>{customer.accountStatus || 'active'}</span></td>
                  <td>
                    <div className={styles.actions}>
                      <Link to={`/admin/customers/${customer._id}`} className={styles.actionBtn}><FiEye /></Link>
                      <button className={styles.actionBtn}><FiMail /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.pagination}>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className={styles.pageBtn}>Previous</button>
        <span className={styles.pageInfo}>Page {currentPage}</span>
        <button onClick={() => setCurrentPage(currentPage + 1)} className={styles.pageBtn}>Next</button>
      </div>
    </div>
  );
};

export default CustomerList;
