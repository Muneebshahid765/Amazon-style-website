import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchOrders, updateOrderItemStatus } from '../../../redux/slices/sellerSlice';
import { FiSearch, FiFilter, FiEye, FiTruck, FiPackage } from 'react-icons/fi';
import styles from './OrderList.module.css';

const OrderList = () => {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.seller);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const params = { page: currentPage, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    dispatch(fetchOrders(params));
  }, [dispatch, currentPage, statusFilter]);

  const handleStatusChange = async (orderId, itemId, newStatus) => {
    await dispatch(updateOrderItemStatus({ orderId, itemId, status: newStatus }));
    dispatch(fetchOrders({ page: currentPage }));
  };

  const statusOptions = ['pending', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>My Orders</h1>
          <p>Manage orders containing your products</p>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}><FiPackage className={styles.statIcon} /><div><p className={styles.statValue}>{orders?.filter(o => o.orderItems?.some(i => i.itemStatus === 'pending')).length || 0}</p><p className={styles.statLabel}>Pending</p></div></div>
        <div className={styles.statCard}><FiTruck className={styles.statIcon} /><div><p className={styles.statValue}>{orders?.filter(o => o.orderItems?.some(i => i.itemStatus === 'processing')).length || 0}</p><p className={styles.statLabel}>Processing</p></div></div>
        <div className={styles.statCard}><FiTruck className={styles.statIcon} style={{color: '#10b981'}} /><div><p className={styles.statValue}>{orders?.filter(o => o.orderItems?.some(i => i.itemStatus === 'shipped')).length || 0}</p><p className={styles.statLabel}>Shipped</p></div></div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} />
          <input type="text" placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.searchInput} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.select}>
          <option value="">All Status</option>
          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading orders...</div>
      ) : (
        <div className={styles.ordersList}>
          {(orders || []).map((order) => (
            <div key={order._id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div>
                  <span className={styles.orderId}>Order #{order.orderNumber}</span>
                  <span className={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <Link to={`/seller/orders/${order._id}`} className={styles.viewBtn}><FiEye /> View Details</Link>
              </div>
              <div className={styles.customerInfo}>
                <p><strong>Customer:</strong> {order.user?.firstName} {order.user?.lastName}</p>
                <p><strong>Shipping:</strong> {order.shippingAddress?.city}, {order.shippingAddress?.country}</p>
              </div>
              <div className={styles.orderItems}>
                {order.orderItems?.filter(item => item.seller?.toString() === order.sellerId || true).map((item) => (
                  <div key={item._id} className={styles.orderItem}>
                    <img src={item.image || '/placeholder.png'} alt={item.title} className={styles.itemImage} />
                    <div className={styles.itemInfo}>
                      <p className={styles.itemTitle}>{item.title}</p>
                      <p className={styles.itemDetails}>Qty: {item.quantity} × ${item.price?.toFixed(2)}</p>
                    </div>
                    <select value={item.itemStatus} onChange={(e) => handleStatusChange(order._id, item._id, e.target.value)} className={`${styles.statusSelect} ${styles[item.itemStatus]}`}>
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className={styles.orderFooter}>
                <span className={styles.orderTotal}>Total: ${order.totalPrice?.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.pagination}>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className={styles.pageBtn}>Previous</button>
        <span>Page {currentPage}</span>
        <button onClick={() => setCurrentPage(currentPage + 1)} className={styles.pageBtn}>Next</button>
      </div>
    </div>
  );
};

export default OrderList;
