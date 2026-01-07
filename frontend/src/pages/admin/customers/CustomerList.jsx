import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCustomers, updateCustomerStatus } from '../../../redux/slices/adminSlice';
import { FiSearch, FiFilter, FiEye, FiMail, FiUserX, FiUserCheck, FiMoreVertical } from 'react-icons/fi';
import styles from './CustomerList.module.css';

const CustomerList = () => {
  const dispatch = useDispatch();
  const { customers, loading, pagination } = useSelector((state) => state.admin);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const params = { page: currentPage, limit: 20 };
    if (searchTerm) params.search = searchTerm;
    if (statusFilter) params.status = statusFilter;
    dispatch(fetchCustomers(params));
  }, [dispatch, currentPage, searchTerm, statusFilter]);

  const handleStatusChange = async (customerId, newStatus) => {
    await dispatch(updateCustomerStatus({ id: customerId, accountStatus: newStatus }));
    setActiveDropdown(null);
    dispatch(fetchCustomers({ page: currentPage, search: searchTerm, status: statusFilter }));
  };

  const toggleDropdown = (customerId) => {
    setActiveDropdown(activeDropdown === customerId ? null : customerId);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Customer Management</h1>
        <p>View and manage all customers</p>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className={styles.select}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
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
                      <div className={styles.avatar}>
                        {customer.firstName?.[0]}{customer.lastName?.[0]}
                      </div>
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
                  <td>
                    <span className={`${styles.status} ${styles[customer.accountStatus || 'active']}`}>
                      {customer.accountStatus || 'active'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link to={`/admin/customers/${customer._id}`} className={styles.actionBtn} title="View Details">
                        <FiEye />
                      </Link>
                      <div className={styles.dropdownContainer}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => toggleDropdown(customer._id)}
                          title="More Actions"
                        >
                          <FiMoreVertical />
                        </button>
                        {activeDropdown === customer._id && (
                          <div className={styles.dropdown}>
                            {customer.accountStatus !== 'active' && (
                              <button onClick={() => handleStatusChange(customer._id, 'active')}>
                                <FiUserCheck /> Activate
                              </button>
                            )}
                            {customer.accountStatus !== 'suspended' && (
                              <button onClick={() => handleStatusChange(customer._id, 'suspended')}>
                                <FiUserX /> Suspend
                              </button>
                            )}
                            {customer.accountStatus !== 'banned' && (
                              <button
                                onClick={() => handleStatusChange(customer._id, 'banned')}
                                className={styles.dangerAction}
                              >
                                <FiUserX /> Ban
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan="7" className={styles.empty}>No customers found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.pagination}>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          className={styles.pageBtn}
        >
          Previous
        </button>
        <span className={styles.pageInfo}>Page {currentPage} of {pagination.totalPages}</span>
        <button
          disabled={currentPage >= pagination.totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
          className={styles.pageBtn}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CustomerList;
