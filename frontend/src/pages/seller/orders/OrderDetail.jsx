import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchOrderDetail,
  updateOrderItemStatus,
  addTrackingInfo,
} from '../../../redux/slices/sellerSlice';
import { FiArrowLeft, FiTruck, FiPackage, FiUser, FiMapPin } from 'react-icons/fi';
import styles from './OrderDetail.module.css';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { orderDetail, orderDetailLoading } = useSelector((state) => state.seller);
  const [trackingData, setTrackingData] = useState({ trackingNumber: '', carrier: '' });

  useEffect(() => {
    dispatch(fetchOrderDetail(id));
  }, [id]);

  const handleStatusChange = async (itemId, newStatus) => {
    await dispatch(updateOrderItemStatus({ orderId: id, itemId, status: newStatus }));
    dispatch(fetchOrderDetail(id));
  };

  const handleAddTracking = async (itemId) => {
    if (!trackingData.trackingNumber || !trackingData.carrier) return;
    await dispatch(addTrackingInfo({ orderId: id, itemId, trackingInfo: trackingData }));
    setTrackingData({ trackingNumber: '', carrier: '' });
    dispatch(fetchOrderDetail(id));
  };

  if (orderDetailLoading) return <div className={styles.loading}>Loading...</div>;
  if (!orderDetail) return <div className={styles.error}>Order not found</div>;

  const order = orderDetail;
  const customerName =
    order.user
      ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim()
      : order.shippingAddress?.fullName || 'Customer';
  const customerEmail = order.user?.email || order.guestEmail || 'N/A';
  const customerPhone = order.user?.phone || order.shippingAddress?.phone || order.guestPhone || 'N/A';
  const shipping = order.shippingAddress || {};

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate('/seller/orders')}><FiArrowLeft /> Back to Orders</button>

      <div className={styles.header}>
        <div><h1>Order #{order.orderNumber}</h1><p>{new Date(order.createdAt).toLocaleDateString()}</p></div>
        <span className={`${styles.orderStatus} ${styles[order.status]}`}>{order.status}</span>
      </div>

      <div className={styles.grid}>
        <div className={styles.mainSection}>
          <div className={styles.card}>
            <h3><FiPackage /> Your Items in This Order</h3>
            {order.orderItems?.map((item) => (
              <div key={item._id} className={styles.orderItem}>
                <img src={item.image} alt={item.title} className={styles.itemImage} />
                <div className={styles.itemInfo}>
                  <p className={styles.itemTitle}>{item.title}</p>
                  <p className={styles.itemPrice}>${item.price} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <div className={styles.itemActions}>
                  <select value={item.itemStatus} onChange={(e) => handleStatusChange(item._id, e.target.value)} className={`${styles.statusSelect} ${styles[item.itemStatus]}`}>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="packed">Packed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.card}>
            <h3><FiTruck /> Shipping Information</h3>
            <div className={styles.trackingForm}>
              <input type="text" placeholder="Tracking Number" value={trackingData.trackingNumber} onChange={(e) => setTrackingData({...trackingData, trackingNumber: e.target.value})} className={styles.input} />
              <select value={trackingData.carrier} onChange={(e) => setTrackingData({...trackingData, carrier: e.target.value})} className={styles.select}>
                <option value="">Select Carrier</option>
                <option value="fedex">FedEx</option>
                <option value="ups">UPS</option>
                <option value="usps">USPS</option>
                <option value="dhl">DHL</option>
              </select>
              <button onClick={() => handleAddTracking(order.orderItems[0]._id)} className={styles.addBtn}>Add Tracking</button>
            </div>
          </div>
        </div>

        <div className={styles.sideSection}>
          <div className={styles.card}>
            <h3><FiUser /> Customer</h3>
            <p className={styles.customerName}>{customerName}</p>
            <p className={styles.customerDetail}>{customerEmail}</p>
            <p className={styles.customerDetail}>{customerPhone}</p>
          </div>

          <div className={styles.card}>
            <h3><FiMapPin /> Shipping Address</h3>
            <p>{shipping.street}</p>
            <p>
              {shipping.city}
              {shipping.state ? `, ${shipping.state}` : ''}{' '}
              {shipping.postalCode || ''}
            </p>
            <p>{shipping.country}</p>
          </div>

          <div className={styles.card}>
            <h3>Order Total</h3>
            <p className={styles.total}>${order.totalPrice?.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
