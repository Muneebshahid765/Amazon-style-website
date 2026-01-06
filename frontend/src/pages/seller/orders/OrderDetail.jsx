import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateOrderItemStatus, addTrackingInfo } from '../../../redux/slices/sellerSlice';
import { FiArrowLeft, FiTruck, FiPackage, FiUser, FiMapPin } from 'react-icons/fi';
import styles from './OrderDetail.module.css';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState({ trackingNumber: '', carrier: '' });

  useEffect(() => {
    setOrder({
      _id: id, orderNumber: 'ORD-12345', status: 'processing', createdAt: new Date().toISOString(),
      user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      shippingAddress: { street: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001', country: 'USA' },
      orderItems: [
        { _id: '1', title: 'Your Product', price: 99.99, quantity: 2, image: '/placeholder.png', itemStatus: 'processing' },
      ],
      totalPrice: 199.98
    });
    setLoading(false);
  }, [id]);

  const handleStatusChange = async (itemId, newStatus) => {
    await dispatch(updateOrderItemStatus({ orderId: id, itemId, status: newStatus }));
    setOrder({
      ...order,
      orderItems: order.orderItems.map(item => item._id === itemId ? { ...item, itemStatus: newStatus } : item)
    });
  };

  const handleAddTracking = async (itemId) => {
    if (!trackingData.trackingNumber || !trackingData.carrier) return;
    await dispatch(addTrackingInfo({ orderId: id, itemId, trackingData }));
    setTrackingData({ trackingNumber: '', carrier: '' });
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!order) return <div className={styles.error}>Order not found</div>;

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
            {order.orderItems.map((item) => (
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
            <h3><FiTruck /> Add Tracking Information</h3>
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
            <p className={styles.customerName}>{order.user.firstName} {order.user.lastName}</p>
            <p className={styles.customerEmail}>{order.user.email}</p>
          </div>

          <div className={styles.card}>
            <h3><FiMapPin /> Shipping Address</h3>
            <p>{order.shippingAddress.street}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
            <p>{order.shippingAddress.country}</p>
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
