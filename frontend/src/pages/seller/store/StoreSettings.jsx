import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStore, updateStore } from '../../../redux/slices/sellerSlice';
import { FiSave, FiUpload } from 'react-icons/fi';
import styles from './StoreSettings.module.css';

const StoreSettings = () => {
  const dispatch = useDispatch();
  const { store, loading } = useSelector((state) => state.seller);
  const [formData, setFormData] = useState({ storeName: '', description: '', logo: '', banner: '', contactEmail: '', contactPhone: '', address: '', returnPolicy: '', shippingPolicy: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchStore());
  }, [dispatch]);

  useEffect(() => {
    if (store) {
      setFormData({
        storeName: store.storeName || '', description: store.description || '', logo: store.logo || '', banner: store.banner || '',
        contactEmail: store.contactEmail || '', contactPhone: store.contactPhone || '', address: store.address || '',
        returnPolicy: store.policies?.returnPolicy || '', shippingPolicy: store.policies?.shippingPolicy || ''
      });
    }
  }, [store]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await dispatch(updateStore({ ...formData, policies: { returnPolicy: formData.returnPolicy, shippingPolicy: formData.shippingPolicy } }));
    setSaving(false);
  };

  if (loading) return <div className={styles.loading}>Loading store settings...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}><h1>Store Settings</h1><p>Manage your store information and policies</p></div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.grid}>
          <div className={styles.mainSection}>
            <div className={styles.card}>
              <h3>Basic Information</h3>
              <div className={styles.formGroup}>
                <label>Store Name *</label>
                <input type="text" name="storeName" value={formData.storeName} onChange={handleChange} required />
              </div>
              <div className={styles.formGroup}>
                <label>Store Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Tell customers about your store..." />
              </div>
            </div>

            <div className={styles.card}>
              <h3>Store Media</h3>
              <div className={styles.mediaGrid}>
                <div className={styles.mediaItem}>
                  <label>Store Logo</label>
                  <div className={styles.mediaPreview}>{formData.logo ? <img src={formData.logo} alt="Logo" /> : <FiUpload />}</div>
                  <input type="file" accept="image/*" className={styles.fileInput} />
                </div>
                <div className={styles.mediaItem}>
                  <label>Store Banner</label>
                  <div className={styles.bannerPreview}>{formData.banner ? <img src={formData.banner} alt="Banner" /> : <FiUpload />}</div>
                  <input type="file" accept="image/*" className={styles.fileInput} />
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3>Store Policies</h3>
              <div className={styles.formGroup}>
                <label>Return Policy</label>
                <textarea name="returnPolicy" value={formData.returnPolicy} onChange={handleChange} rows="4" placeholder="Describe your return policy..." />
              </div>
              <div className={styles.formGroup}>
                <label>Shipping Policy</label>
                <textarea name="shippingPolicy" value={formData.shippingPolicy} onChange={handleChange} rows="4" placeholder="Describe your shipping policy..." />
              </div>
            </div>
          </div>

          <div className={styles.sideSection}>
            <div className={styles.card}>
              <h3>Contact Information</h3>
              <div className={styles.formGroup}>
                <label>Contact Email</label>
                <input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Contact Phone</label>
                <input type="tel" name="contactPhone" value={formData.contactPhone} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Business Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows="3" />
              </div>
            </div>

            <div className={styles.card}>
              <h3>Store Status</h3>
              <div className={styles.statusInfo}>
                <p><strong>Verification:</strong> <span className={styles.verified}>{store?.verificationStatus || 'Pending'}</span></p>
                <p><strong>Rating:</strong> {store?.rating?.average?.toFixed(1) || '0.0'} / 5.0</p>
                <p><strong>Total Products:</strong> {store?.totalProducts || 0}</p>
                <p><strong>Total Sales:</strong> {store?.totalSales || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="submit" disabled={saving} className={styles.saveBtn}><FiSave /> {saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
};

export default StoreSettings;
