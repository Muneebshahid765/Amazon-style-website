import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiTruck, FiPackage, FiUser, FiMapPin, FiCreditCard } from 'react-icons/fi';
import styles from './OrderDetail.module.css';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated order data - replace with actual API call
    setOrder({
      _id: id, orderNumber: 'ORD-12345', status: 'processing',
      createdAt: new Date().toISOString(),
      user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '+1234567890' },
      shippingAddress: { street: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001', country: 'USA' },
      paymentMethod: 'Credit Card', paymentStatus: 'paid',
      orderItems: [
        { _id: '1', title: 'Product 1', price: 99.99, quantity: 2, image: '/placeholder.png', itemStatus: 'processing' },
        { _id: '2', title: 'Product 2', price: 49.99, quantity: 1, image: '/placeholder.png', itemStatus: 'pending' },
      ],
      subtotal: 249.97, shippingCost: 10, tax: 25, totalPrice: 284.97
    });
    setLoading(false);
  }, [id]);

  const handleStatusChange = (newStatus) => {
    setOrder({ ...order, status: newStatus });
  };

  if (loading) return <div className={styles.loading}>Loading order details...</div>;
  if (!order) return <div className={styles.error}>Order not found</div>;

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate('/admin/orders')}><FiArrowLeft /> Back to Orders</button>

      <div className={styles.header}>
        <div>
          <h1>Order #{order.orderNumber}</h1>
          <p>Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <select value={order.status} onChange={(e) => handleStatusChange(e.target.value)} className={`${styles.statusSelect} ${styles[order.status]}`}>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="packed">Packed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className={styles.grid}>
        <div className={styles.mainSection}>
          <div className={styles.card}>
            <h3><FiPackage /> Order Items</h3>
            <div className={styles.itemsList}>
              {order.orderItems.map((item) => (
                <div key={item._id} className={styles.orderItem}>
                  <img src={item.image} alt={item.title} className={styles.itemImage} />
                  <div className={styles.itemInfo}>
                    <p className={styles.itemTitle}>{item.title}</p>
                    <p className={styles.itemPrice}>${item.price} × {item.quantity}</p>
                  </div>
                  <span className={`${styles.itemStatus} ${styles[item.itemStatus]}`}>{item.itemStatus}</span>
                  <p className={styles.itemTotal}>${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className={styles.orderSummary}>
              <div className={styles.summaryRow}><span>Subtotal</span><span>${order.subtotal?.toFixed(2)}</span></div>
              <div className={styles.summaryRow}><span>Shipping</span><span>${order.shippingCost?.toFixed(2)}</span></div>
              <div className={styles.summaryRow}><span>Tax</span><span>${order.tax?.toFixed(2)}</span></div>
              <div className={`${styles.summaryRow} ${styles.total}`}><span>Total</span><span>${order.totalPrice?.toFixed(2)}</span></div>
            </div>
          </div>

          <div className={styles.card}>
            <h3><FiTruck /> Shipping Information</h3>
            <div className={styles.trackingForm}>
              <input type="text" placeholder="Tracking Number" className={styles.input} />
              <select className={styles.select}>
                <option value="">Select Carrier</option>
                <option value="fedex">FedEx</option>
                <option value="ups">UPS</option>
                <option value="usps">USPS</option>
                <option value="dhl">DHL</option>
              </select>
              <button className={styles.addTrackingBtn}>Add Tracking</button>
            </div>
          </div>
        </div>

        <div className={styles.sideSection}>
          <div className={styles.card}>
            <h3><FiUser /> Customer</h3>
            <p className={styles.customerName}>{order.user.firstName} {order.user.lastName}</p>
            <p className={styles.customerDetail}>{order.user.email}</p>
            <p className={styles.customerDetail}>{order.user.phone}</p>
          </div>

          <div className={styles.card}>
            <h3><FiMapPin /> Shipping Address</h3>
            <p>{order.shippingAddress.street}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
            <p>{order.shippingAddress.country}</p>
          </div>

          <div className={styles.card}>
            <h3><FiCreditCard /> Payment</h3>
            <p><strong>Method:</strong> {order.paymentMethod}</p>
            <p><strong>Status:</strong> <span className={`${styles.paymentStatus} ${styles[order.paymentStatus]}`}>{order.paymentStatus}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
