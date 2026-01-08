import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchStore, updateStore, updateBusinessInfo, updateVacationMode } from '../../../redux/slices/sellerSlice';
import { createBuyerProfile } from '../../../redux/slices/authSlice';
import { FiSave, FiUpload, FiCalendar, FiCheck, FiAlertCircle } from 'react-icons/fi';
import styles from './StoreSettings.module.css';

const StoreSettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { store, loading } = useSelector((state) => state.seller);
  const { user, modeStatus } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [buyerDisplayName, setBuyerDisplayName] = useState('');

  const [formData, setFormData] = useState({
    storeName: '',
    description: '',
    logo: '',
    banner: '',
    returnPolicy: '',
    shippingPolicy: '',
    socialMedia: { facebook: '', instagram: '', twitter: '', website: '' },
  });

  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    businessType: 'individual',
    taxId: '',
    vatNumber: '',
    registrationNumber: '',
    address: { street: '', city: '', state: '', postalCode: '', country: '' },
    phone: '',
    email: '',
  });

  const [vacationMode, setVacationMode] = useState({
    isEnabled: false,
    startDate: '',
    endDate: '',
    message: '',
  });

  useEffect(() => {
    dispatch(fetchStore());
  }, [dispatch]);

  useEffect(() => {
    if (!user) return;
    const fallback = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    setBuyerDisplayName(user.buyerProfile?.displayName || fallback || '');
  }, [user]);

  useEffect(() => {
    if (store) {
      setFormData({
        storeName: store.storeName || '',
        description: store.description || '',
        logo: store.logo?.url || '',
        banner: store.banner?.url || '',
        returnPolicy: store.returnPolicy || '',
        shippingPolicy: store.shippingPolicy || '',
        socialMedia: {
          facebook: store.socialMedia?.facebook || '',
          instagram: store.socialMedia?.instagram || '',
          twitter: store.socialMedia?.twitter || '',
          website: store.socialMedia?.website || '',
        },
      });
      setBusinessInfo({
        businessName: store.businessInfo?.businessName || '',
        businessType: store.businessInfo?.businessType || 'individual',
        taxId: store.businessInfo?.taxId || '',
        vatNumber: store.businessInfo?.vatNumber || '',
        registrationNumber: store.businessInfo?.registrationNumber || '',
        address: {
          street: store.businessInfo?.address?.street || '',
          city: store.businessInfo?.address?.city || '',
          state: store.businessInfo?.address?.state || '',
          postalCode: store.businessInfo?.address?.postalCode || '',
          country: store.businessInfo?.address?.country || '',
        },
        phone: store.businessInfo?.phone || '',
        email: store.businessInfo?.email || '',
      });
      setVacationMode({
        isEnabled: store.vacationMode?.isEnabled || false,
        startDate: store.vacationMode?.startDate?.split('T')[0] || '',
        endDate: store.vacationMode?.endDate?.split('T')[0] || '',
        message: store.vacationMode?.message || '',
      });
    }
  }, [store]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSocialChange = (e) => {
    setFormData({
      ...formData,
      socialMedia: { ...formData.socialMedia, [e.target.name]: e.target.value },
    });
  };

  const handleCreateBuyerProfile = async () => {
    if (!buyerDisplayName.trim()) {
      setMessage({ type: 'error', text: 'Display name is required to create buyer account.' });
      return;
    }
    setMessage({ type: '', text: '' });
    const result = await dispatch(createBuyerProfile({ displayName: buyerDisplayName.trim() }));
    if (createBuyerProfile.fulfilled.match(result)) {
      setMessage({ type: 'success', text: 'Buyer profile created successfully! You can now switch modes.' });
    } else {
      setMessage({ type: 'error', text: result.payload || 'Failed to create buyer account' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    const result = await dispatch(updateStore(formData));
    setSaving(false);
    if (updateStore.fulfilled.match(result)) {
      setMessage({ type: 'success', text: 'Store settings saved successfully!' });
    } else {
      setMessage({ type: 'error', text: result.payload || 'Failed to save settings' });
    }
  };

  const handleBusinessSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    const result = await dispatch(updateBusinessInfo(businessInfo));
    setSaving(false);
    if (updateBusinessInfo.fulfilled.match(result)) {
      setMessage({ type: 'success', text: 'Business information saved successfully!' });
    } else {
      setMessage({ type: 'error', text: result.payload || 'Failed to save business info' });
    }
  };

  const handleVacationSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    const result = await dispatch(updateVacationMode(vacationMode));
    setSaving(false);
    if (updateVacationMode.fulfilled.match(result)) {
      setMessage({ type: 'success', text: 'Vacation mode updated successfully!' });
    } else {
      setMessage({ type: 'error', text: result.payload || 'Failed to update vacation mode' });
    }
  };

  if (loading) return <div className={styles.loading}>Loading store settings...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Store Settings</h1>
        <p>Manage your store information, business details, and preferences</p>
      </div>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
          {message.text}
        </div>
      )}

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'general' ? styles.active : ''}`} onClick={() => setActiveTab('general')}>
          General
        </button>
        <button className={`${styles.tab} ${activeTab === 'business' ? styles.active : ''}`} onClick={() => setActiveTab('business')}>
          Business Info
        </button>
        <button className={`${styles.tab} ${activeTab === 'vacation' ? styles.active : ''}`} onClick={() => setActiveTab('vacation')}>
          Vacation Mode
        </button>
      </div>

      {activeTab === 'general' && (
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
                <h3>Social Media</h3>
                <div className={styles.formGroup}>
                  <label>Facebook</label>
                  <input type="url" name="facebook" value={formData.socialMedia.facebook} onChange={handleSocialChange} placeholder="https://facebook.com/..." />
                </div>
                <div className={styles.formGroup}>
                  <label>Instagram</label>
                  <input type="url" name="instagram" value={formData.socialMedia.instagram} onChange={handleSocialChange} placeholder="https://instagram.com/..." />
                </div>
                <div className={styles.formGroup}>
                  <label>Twitter</label>
                  <input type="url" name="twitter" value={formData.socialMedia.twitter} onChange={handleSocialChange} placeholder="https://twitter.com/..." />
                </div>
                <div className={styles.formGroup}>
                  <label>Website</label>
                  <input type="url" name="website" value={formData.socialMedia.website} onChange={handleSocialChange} placeholder="https://..." />
                </div>
              </div>

              <div className={styles.card}>
                <h3>Store Status</h3>
                <div className={styles.statusInfo}>
                  <p><strong>Verification:</strong> <span className={`${styles.statusBadge} ${styles[store?.verificationStatus || 'pending']}`}>{store?.verificationStatus || 'Pending'}</span></p>
                  <p><strong>Seller Level:</strong> <span className={styles.level}>{store?.sellerLevel || 'New'}</span></p>
                  <p><strong>Rating:</strong> {store?.rating?.average?.toFixed(1) || '0.0'} / 5.0 ({store?.rating?.count || 0} reviews)</p>
                  <p><strong>Total Products:</strong> {store?.totalProducts || 0}</p>
                  <p><strong>Total Sales:</strong> {store?.totalSales || 0}</p>
                  <p><strong>Commission Rate:</strong> {store?.commission || 10}%</p>
                </div>
              </div>

              <div className={`${styles.card} ${styles.buyerCard}`}>
                <div className={styles.buyerHeader}>
                  <div className={styles.buyerIcon}>🛍️</div>
                  <div>
                    <h3>Buyer Account Preview</h3>
                    <p className={styles.cardDescription}>
                      Experience NovaMart as a customer. Use this buyer profile to test your storefront or place personal orders.
                    </p>
                  </div>
                </div>

                {user?.hasBuyerProfile ? (
                  <div className={styles.buyerStatus}>
                    <div className={styles.statGroup}>
                      <span className={styles.buyerLabel}>Display Name</span>
                      <strong className={styles.buyerValue}>{user?.buyerProfile?.displayName || user?.firstName}</strong>
                    </div>
                    <div className={styles.statGroup}>
                      <span className={styles.buyerLabel}>Created on</span>
                      <p className={styles.buyerMeta}>
                        {new Date(user?.buyerProfile?.createdAt || user?.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button type="button" className={styles.pillButton} onClick={() => navigate('/dashboard')}>
                      Go to Buyer Dashboard
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={styles.buyerForm}>
                      <label>Buyer Display Name</label>
                      <div className={styles.inputWrap}>
                        <input
                          type="text"
                          value={buyerDisplayName}
                          onChange={(e) => setBuyerDisplayName(e.target.value)}
                          placeholder="e.g. John from NovaMart"
                        />
                        <small>Create a friendly persona shoppers will see.</small>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={handleCreateBuyerProfile}
                      disabled={modeStatus === 'loading'}
                    >
                      {modeStatus === 'loading' ? 'Creating Buyer Account...' : 'Create Buyer Account'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="submit" disabled={saving} className={styles.saveBtn}><FiSave /> {saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      )}

      {activeTab === 'business' && (
        <form onSubmit={handleBusinessSubmit} className={styles.form}>
          <div className={styles.card}>
            <h3>Business Information</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Business Name</label>
                <input type="text" value={businessInfo.businessName} onChange={(e) => setBusinessInfo({ ...businessInfo, businessName: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label>Business Type</label>
                <select value={businessInfo.businessType} onChange={(e) => setBusinessInfo({ ...businessInfo, businessType: e.target.value })}>
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                  <option value="partnership">Partnership</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Tax ID / EIN</label>
                <input type="text" value={businessInfo.taxId} onChange={(e) => setBusinessInfo({ ...businessInfo, taxId: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label>VAT Number</label>
                <input type="text" value={businessInfo.vatNumber} onChange={(e) => setBusinessInfo({ ...businessInfo, vatNumber: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label>Registration Number</label>
                <input type="text" value={businessInfo.registrationNumber} onChange={(e) => setBusinessInfo({ ...businessInfo, registrationNumber: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label>Business Email</label>
                <input type="email" value={businessInfo.email} onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label>Business Phone</label>
                <input type="tel" value={businessInfo.phone} onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })} />
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Business Address</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label>Street Address</label>
                <input type="text" value={businessInfo.address.street} onChange={(e) => setBusinessInfo({ ...businessInfo, address: { ...businessInfo.address, street: e.target.value } })} />
              </div>
              <div className={styles.formGroup}>
                <label>City</label>
                <input type="text" value={businessInfo.address.city} onChange={(e) => setBusinessInfo({ ...businessInfo, address: { ...businessInfo.address, city: e.target.value } })} />
              </div>
              <div className={styles.formGroup}>
                <label>State / Province</label>
                <input type="text" value={businessInfo.address.state} onChange={(e) => setBusinessInfo({ ...businessInfo, address: { ...businessInfo.address, state: e.target.value } })} />
              </div>
              <div className={styles.formGroup}>
                <label>Postal Code</label>
                <input type="text" value={businessInfo.address.postalCode} onChange={(e) => setBusinessInfo({ ...businessInfo, address: { ...businessInfo.address, postalCode: e.target.value } })} />
              </div>
              <div className={styles.formGroup}>
                <label>Country</label>
                <input type="text" value={businessInfo.address.country} onChange={(e) => setBusinessInfo({ ...businessInfo, address: { ...businessInfo.address, country: e.target.value } })} />
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="submit" disabled={saving} className={styles.saveBtn}><FiSave /> {saving ? 'Saving...' : 'Save Business Info'}</button>
          </div>
        </form>
      )}

      {activeTab === 'vacation' && (
        <form onSubmit={handleVacationSubmit} className={styles.form}>
          <div className={styles.card}>
            <h3>Vacation Mode</h3>
            <p className={styles.cardDescription}>When vacation mode is enabled, your store will show a message to customers and you won't receive new orders.</p>
            
            <div className={styles.checkboxGroup}>
              <label>
                <input type="checkbox" checked={vacationMode.isEnabled} onChange={(e) => setVacationMode({ ...vacationMode, isEnabled: e.target.checked })} />
                Enable Vacation Mode
              </label>
            </div>

            {vacationMode.isEnabled && (
              <>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label><FiCalendar /> Start Date</label>
                    <input type="date" value={vacationMode.startDate} onChange={(e) => setVacationMode({ ...vacationMode, startDate: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <label><FiCalendar /> End Date</label>
                    <input type="date" value={vacationMode.endDate} onChange={(e) => setVacationMode({ ...vacationMode, endDate: e.target.value })} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Message to Customers</label>
                  <textarea value={vacationMode.message} onChange={(e) => setVacationMode({ ...vacationMode, message: e.target.value })} rows="3" placeholder="We're currently on vacation and will be back soon!" />
                </div>
              </>
            )}
          </div>

          <div className={styles.actions}>
            <button type="submit" disabled={saving} className={styles.saveBtn}><FiSave /> {saving ? 'Saving...' : 'Save Vacation Settings'}</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default StoreSettings;
