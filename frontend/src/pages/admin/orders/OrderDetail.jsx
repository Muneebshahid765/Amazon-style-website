import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderById, updateOrderStatus, cancelOrder, refundOrder, clearSelectedOrder } from '../../../redux/slices/adminSlice';
import { FiArrowLeft, FiTruck, FiPackage, FiUser, FiMapPin, FiCreditCard, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import styles from './OrderDetail.module.css';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedOrder: order, loading, error } = useSelector((state) => state.admin);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');

  useEffect(() => {
    dispatch(fetchOrderById(id));
    return () => dispatch(clearSelectedOrder());
  }, [dispatch, id]);

  const handleStatusChange = async (newStatus) => {
    await dispatch(updateOrderStatus({ id, status: newStatus }));
    dispatch(fetchOrderById(id));
  };

  const handleCancel = async () => {
    await dispatch(cancelOrder({ id, reason: cancelReason }));
    setShowCancelModal(false);
    setCancelReason('');
    dispatch(fetchOrderById(id));
  };

  const handleRefund = async () => {
    await dispatch(refundOrder({ id, reason: refundReason, refundAmount: refundAmount ? Number(refundAmount) : undefined }));
    setShowRefundModal(false);
    setRefundReason('');
    setRefundAmount('');
    dispatch(fetchOrderById(id));
  };

  if (loading) return <div className={styles.loading}>Loading order details...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!order) return <div className={styles.error}>Order not found</div>;

  const customerName = order.user 
    ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() 
    : order.shippingAddress?.fullName || 'Guest';
  const customerEmail = order.user?.email || order.guestEmail || '-';
  const customerPhone = order.user?.phone || order.guestPhone || order.shippingAddress?.phone || '-';

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate('/admin/orders')}>
        <FiArrowLeft /> Back to Orders
      </button>

      <div className={styles.header}>
        <div>
          <h1>Order #{order.orderNumber}</h1>
          <p>Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}</p>
        </div>
        <div className={styles.headerActions}>
          <select 
            value={order.status} 
            onChange={(e) => handleStatusChange(e.target.value)} 
            className={`${styles.statusSelect} ${styles[order.status]}`}
            disabled={['cancelled', 'refunded'].includes(order.status)}
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          {!['cancelled', 'refunded', 'delivered'].includes(order.status) && (
            <button className={styles.cancelBtn} onClick={() => setShowCancelModal(true)}>
              <FiXCircle /> Cancel
            </button>
          )}
          {order.isPaid && !['refunded'].includes(order.status) && (
            <button className={styles.refundBtn} onClick={() => setShowRefundModal(true)}>
              <FiRefreshCw /> Refund
            </button>
          )}
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.mainSection}>
          <div className={styles.card}>
            <h3><FiPackage /> Order Items ({order.orderItems?.length || 0})</h3>
            <div className={styles.itemsList}>
              {order.orderItems?.map((item) => (
                <div key={item._id} className={styles.orderItem}>
                  <img 
                    src={item.image || item.product?.images?.[0]?.url || '/placeholder.png'} 
                    alt={item.title || item.product?.title} 
                    className={styles.itemImage} 
                  />
                  <div className={styles.itemInfo}>
                    <p className={styles.itemTitle}>{item.title || item.product?.title}</p>
                    <p className={styles.itemPrice}>${item.price?.toFixed(2)} × {item.quantity}</p>
                    {item.sku && <p className={styles.itemSku}>SKU: {item.sku}</p>}
                    {item.seller && (
                      <p className={styles.itemSeller}>
                        Seller: {item.seller.firstName} {item.seller.lastName}
                      </p>
                    )}
                  </div>
                  <span className={`${styles.itemStatus} ${styles[item.itemStatus]}`}>
                    {item.itemStatus}
                  </span>
                  <p className={styles.itemTotal}>${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className={styles.orderSummary}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>${order.itemsPrice?.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <span>${order.shippingPrice?.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className={styles.summaryRow}>
                  <span>Discount</span>
                  <span className={styles.discount}>-${order.discount?.toFixed(2)}</span>
                </div>
              )}
              <div className={styles.summaryRow}>
                <span>Tax</span>
                <span>${order.taxPrice?.toFixed(2)}</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>Total</span>
                <span>${order.totalPrice?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3><FiTruck /> Shipping & Tracking</h3>
            <div className={styles.trackingForm}>
              <input 
                type="text" 
                placeholder="Tracking Number" 
                className={styles.input}
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
              <select 
                className={styles.select}
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
              >
                <option value="">Select Carrier</option>
                <option value="fedex">FedEx</option>
                <option value="ups">UPS</option>
                <option value="usps">USPS</option>
                <option value="dhl">DHL</option>
              </select>
              <button className={styles.addTrackingBtn}>Add Tracking</button>
            </div>
          </div>

          {order.statusHistory?.length > 0 && (
            <div className={styles.card}>
              <h3>Order History</h3>
              <div className={styles.timeline}>
                {order.statusHistory.map((history, index) => (
                  <div key={index} className={styles.timelineItem}>
                    <div className={styles.timelineDot}></div>
                    <div className={styles.timelineContent}>
                      <p className={styles.timelineStatus}>{history.status}</p>
                      <p className={styles.timelineDate}>
                        {new Date(history.updatedAt).toLocaleString()}
                      </p>
                      {history.note && <p className={styles.timelineNote}>{history.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.sideSection}>
          <div className={styles.card}>
            <h3><FiUser /> Customer</h3>
            <p className={styles.customerName}>{customerName}</p>
            <p className={styles.customerDetail}>{customerEmail}</p>
            <p className={styles.customerDetail}>{customerPhone}</p>
            {!order.user && <span className={styles.guestBadge}>Guest Order</span>}
          </div>

          <div className={styles.card}>
            <h3><FiMapPin /> Shipping Address</h3>
            <p>{order.shippingAddress?.fullName}</p>
            <p>{order.shippingAddress?.street}</p>
            <p>
              {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
            </p>
            <p>{order.shippingAddress?.country}</p>
            {order.shippingAddress?.phone && <p>Phone: {order.shippingAddress.phone}</p>}
          </div>

          <div className={styles.card}>
            <h3><FiCreditCard /> Payment</h3>
            <p><strong>Method:</strong> {order.paymentMethod?.toUpperCase()}</p>
            <p>
              <strong>Status:</strong>{' '}
              <span className={`${styles.paymentStatus} ${order.isPaid ? styles.paid : styles.unpaid}`}>
                {order.isPaid ? 'Paid' : 'Unpaid'}
              </span>
            </p>
            {order.paidAt && <p><strong>Paid At:</strong> {new Date(order.paidAt).toLocaleString()}</p>}
            {order.paymentCardBrand && (
              <p><strong>Card:</strong> {order.paymentCardBrand} •••• {order.paymentCardLast4}</p>
            )}
          </div>

          {order.notes && (
            <div className={styles.card}>
              <h3>Order Notes</h3>
              <p>{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {showCancelModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Cancel Order</h3>
            <p>Are you sure you want to cancel this order? This will restore the stock.</p>
            <textarea
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className={styles.textarea}
            />
            <div className={styles.modalActions}>
              <button onClick={() => setShowCancelModal(false)} className={styles.modalCancelBtn}>
                Go Back
              </button>
              <button onClick={handleCancel} className={styles.modalConfirmBtn}>
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRefundModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Refund Order</h3>
            <p>Process a refund for this order.</p>
            <input
              type="number"
              placeholder={`Refund amount (default: $${order.totalPrice?.toFixed(2)})`}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className={styles.input}
            />
            <textarea
              placeholder="Reason for refund (optional)"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className={styles.textarea}
            />
            <div className={styles.modalActions}>
              <button onClick={() => setShowRefundModal(false)} className={styles.modalCancelBtn}>
                Go Back
              </button>
              <button onClick={handleRefund} className={styles.modalConfirmBtn}>
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
