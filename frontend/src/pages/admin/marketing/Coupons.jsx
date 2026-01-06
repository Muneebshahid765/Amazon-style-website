import { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import styles from './Coupons.module.css';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ code: '', discountType: 'percentage', discountValue: '', minPurchase: '', maxUses: '', expiryDate: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setCoupons([...coupons, { ...formData, _id: Date.now(), usedCount: 0, status: 'active' }]);
    setShowModal(false);
    setFormData({ code: '', discountType: 'percentage', discountValue: '', minPurchase: '', maxUses: '', expiryDate: '' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div><h1>Coupon Management</h1><p>Create and manage discount coupons</p></div>
        <button onClick={() => setShowModal(true)} className={styles.addBtn}><FiPlus /> Create Coupon</button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr><th>Code</th><th>Discount</th><th>Min Purchase</th><th>Uses</th><th>Expiry</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon._id}>
                <td><span className={styles.code}>{coupon.code}</span></td>
                <td>{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}</td>
                <td>${coupon.minPurchase || 0}</td>
                <td>{coupon.usedCount} / {coupon.maxUses || '∞'}</td>
                <td>{coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'No expiry'}</td>
                <td><span className={`${styles.status} ${styles[coupon.status]}`}>{coupon.status}</span></td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn}><FiEdit /></button>
                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`}><FiTrash2 /></button>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && <tr><td colSpan="7" className={styles.empty}>No coupons created yet</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Create New Coupon</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Coupon Code</label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} required />
              </div>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Discount Type</label>
                  <select value={formData.discountType} onChange={(e) => setFormData({...formData, discountType: e.target.value})}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Discount Value</label>
                  <input type="number" value={formData.discountValue} onChange={(e) => setFormData({...formData, discountValue: e.target.value})} required />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Min Purchase ($)</label>
                  <input type="number" value={formData.minPurchase} onChange={(e) => setFormData({...formData, minPurchase: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Max Uses</label>
                  <input type="number" value={formData.maxUses} onChange={(e) => setFormData({...formData, maxUses: e.target.value})} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Expiry Date</label>
                <input type="date" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Create Coupon</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;
