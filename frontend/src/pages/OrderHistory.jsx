import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiPackage, FiX, FiTruck, FiCheck, FiClock, FiAlertCircle } from 'react-icons/fi';
import { fetchUserOrders, fetchOrderDetails, clearOrderDetails } from '../redux/slices/userSlice';
import styles from '../styles/OrderHistory.module.css';

const OrderHistory = () => {
  const dispatch = useDispatch();
  const { orders, orderDetails, pagination, status } = useSelector((state) => state.user);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    page: 1,
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    dispatch(fetchUserOrders(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleViewDetails = async (orderId) => {
    await dispatch(fetchOrderDetails(orderId));
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    dispatch(clearOrderDetails());
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock />;
      case 'processing':
        return <FiPackage />;
      case 'shipped':
        return <FiTruck />;
      case 'delivered':
        return <FiCheck />;
      case 'cancelled':
        return <FiAlertCircle />;
      default:
        return <FiPackage />;
    }
  };

  const getStatusClass = (status) => {
    return styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`] || styles.statusPending;
  };

  if (status === 'loading' && orders.length === 0) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className={styles.orderHistoryContainer}>
      <div className={styles.header}>
        <h1>
          <FiPackage /> Order History
        </h1>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="startDate">From Date</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="endDate">To Date</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <FiPackage size={64} />
          <h2>No Orders Found</h2>
          <p>You haven&apos;t placed any orders yet</p>
        </div>
      ) : (
        <>
          <div className={styles.ordersList}>
            {orders.map((order) => (
              <div key={order._id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div className={styles.orderInfo}>
                    <h3>Order #{order.orderNumber}</h3>
                    <p className={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </span>
                </div>

                <div className={styles.orderItems}>
                  {order.items.slice(0, 3).map((item) => (
                    <div key={item._id} className={styles.orderItem}>
                      <img
                        src={item.product?.images?.[0]?.url || '/placeholder.png'}
                        alt={item.product?.name}
                        className={styles.itemImage}
                      />
                      <div className={styles.itemInfo}>
                        <p className={styles.itemName}>{item.product?.name}</p>
                        <p className={styles.itemQuantity}>Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className={styles.moreItems}>+{order.items.length - 3} more items</p>
                  )}
                </div>

                <div className={styles.orderFooter}>
                  <div className={styles.orderTotal}>
                    <span>Total:</span>
                    <strong>Rs. {order.totalAmount}</strong>
                  </div>
                  <button className={styles.viewDetailsBtn} onClick={() => handleViewDetails(order._id)}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className={styles.pageBtn}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === pagination.totalPages}
                className={styles.pageBtn}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showDetailsModal && orderDetails && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Order Details</h2>
              <button className={styles.closeBtn} onClick={handleCloseModal}>
                <FiX />
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.orderSummary}>
                <div className={styles.summaryRow}>
                  <span>Order Number:</span>
                  <strong>#{orderDetails.orderNumber}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Order Date:</span>
                  <strong>
                    {new Date(orderDetails.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Status:</span>
                  <span className={`${styles.statusBadge} ${getStatusClass(orderDetails.status)}`}>
                    {getStatusIcon(orderDetails.status)}
                    {orderDetails.status}
                  </span>
                </div>
              </div>

              <div className={styles.section}>
                <h3>Items</h3>
                <div className={styles.detailItems}>
                  {orderDetails.items.map((item) => (
                    <div key={item._id} className={styles.detailItem}>
                      <img
                        src={item.product?.images?.[0]?.url || '/placeholder.png'}
                        alt={item.product?.name}
                        className={styles.detailItemImage}
                      />
                      <div className={styles.detailItemInfo}>
                        <p className={styles.detailItemName}>{item.product?.name}</p>
                        <p className={styles.detailItemPrice}>Rs. {item.price} × {item.quantity}</p>
                      </div>
                      <strong className={styles.detailItemTotal}>Rs. {item.price * item.quantity}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.section}>
                <h3>Shipping Address</h3>
                <div className={styles.address}>
                  <p>{orderDetails.shippingAddress?.fullName}</p>
                  <p>{orderDetails.shippingAddress?.addressLine1}</p>
                  {orderDetails.shippingAddress?.addressLine2 && (
                    <p>{orderDetails.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {orderDetails.shippingAddress?.city}, {orderDetails.shippingAddress?.state}{' '}
                    {orderDetails.shippingAddress?.postalCode}
                  </p>
                  <p>{orderDetails.shippingAddress?.country}</p>
                  <p>Phone: {orderDetails.shippingAddress?.phone}</p>
                </div>
              </div>

              <div className={styles.section}>
                <h3>Payment Summary</h3>
                <div className={styles.paymentSummary}>
                  <div className={styles.summaryRow}>
                    <span>Subtotal:</span>
                    <span>Rs. {orderDetails.itemsPrice}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Shipping:</span>
                    <span>Rs. {orderDetails.shippingPrice}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Tax:</span>
                    <span>Rs. {orderDetails.taxPrice}</span>
                  </div>
                  {orderDetails.discount > 0 && (
                    <div className={styles.summaryRow}>
                      <span>Discount:</span>
                      <span className={styles.discount}>-Rs. {orderDetails.discount}</span>
                    </div>
                  )}
                  <div className={`${styles.summaryRow} ${styles.total}`}>
                    <strong>Total:</strong>
                    <strong>Rs. {orderDetails.totalAmount}</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Payment Method:</span>
                    <span>{orderDetails.paymentMethod}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Payment Status:</span>
                    <span className={orderDetails.isPaid ? styles.paid : styles.unpaid}>
                      {orderDetails.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
