import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchOrders, updateOrderStatus } from '../../../redux/slices/adminSlice';
import { FiSearch, FiFilter, FiEye, FiTruck } from 'react-icons/fi';
import styles from './OrderList.module.css';

const OrderList = () => {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.admin);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const params = { page: currentPage, limit: 20 };
    if (searchTerm) params.search = searchTerm;
    if (statusFilter) params.status = statusFilter;
    dispatch(fetchOrders(params));
  }, [dispatch, currentPage, searchTerm, statusFilter]);

  const handleStatusChange = async (orderId, newStatus) => {
    await dispatch(updateOrderStatus({ id: orderId, status: newStatus }));
    dispatch(fetchOrders({ page: currentPage, status: statusFilter }));
  };

  const statusOptions = ['pending', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Order Management</h1>
          <p>View and manage all customer orders</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} />
          <input type="text" placeholder="Search by order ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.searchInput} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.select}>
          <option value="">All Status</option>
          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className={styles.filterButton}><FiFilter /> More Filters</button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading orders...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(orders || []).map((order) => (
                <tr key={order._id}>
                  <td><span className={styles.orderId}>#{order.orderNumber}</span></td>
                  <td>
                    <div className={styles.customerInfo}>
                      <p className={styles.customerName}>{order.user?.firstName} {order.user?.lastName}</p>
                      <p className={styles.customerEmail}>{order.user?.email}</p>
                    </div>
                  </td>
                  <td>{order.orderItems?.length || 0} items</td>
                  <td className={styles.total}>${order.totalPrice?.toFixed(2)}</td>
                  <td>
                    <select value={order.status} onChange={(e) => handleStatusChange(order._id, e.target.value)} className={`${styles.statusSelect} ${styles[order.status]}`}>
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actions}>
                      <Link to={`/admin/orders/${order._id}`} className={styles.actionBtn}><FiEye /></Link>
                      <button className={styles.actionBtn}><FiTruck /></button>
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

export default OrderList;
