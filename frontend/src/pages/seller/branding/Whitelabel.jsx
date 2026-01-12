import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FiEyeOff, FiSave, FiInfo } from 'react-icons/fi';
import FeatureGuard from '../../../components/common/FeatureGuard';
import styles from './Whitelabel.module.css';

const Whitelabel = () => {
  const dispatch = useDispatch();
  const [settings, setSettings] = useState({
    removePlatformBranding: true,
    customDomain: '',
    customEmailDomain: '',
    hideMarketplaceLogo: true,
    customFooter: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // API call will be added
      toast.success('White-label settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FeatureGuard featureKey="whitelabelOptions">
      <div className={styles.whitelabel}>
        <div className={styles.header}>
          <div>
            <h1>White-label Options</h1>
            <p>Remove platform branding and customize your storefront</p>
          </div>
          <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
            <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h2>Branding Control</h2>
            <div className={styles.option}>
              <div className={styles.optionHeader}>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.removePlatformBranding}
                    onChange={(e) => setSettings({ ...settings, removePlatformBranding: e.target.checked })}
                  />
                  Remove Platform Branding
                </label>
              </div>
              <p className={styles.optionDesc}>Hide all references to our platform from your store</p>
            </div>

            <div className={styles.option}>
              <div className={styles.optionHeader}>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.hideMarketplaceLogo}
                    onChange={(e) => setSettings({ ...settings, hideMarketplaceLogo: e.target.checked })}
                  />
                  Hide Marketplace Logo
                </label>
              </div>
              <p className={styles.optionDesc}>Remove marketplace logo from headers and footers</p>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Custom Domain</h2>
            <div className={styles.formGroup}>
              <label>Store Domain</label>
              <input
                type="text"
                value={settings.customDomain}
                onChange={(e) => setSettings({ ...settings, customDomain: e.target.value })}
                placeholder="shop.yourdomain.com"
              />
              <small>Point your domain to our servers (DNS settings required)</small>
            </div>

            <div className={styles.formGroup}>
              <label>Email Domain</label>
              <input
                type="text"
                value={settings.customEmailDomain}
                onChange={(e) => setSettings({ ...settings, customEmailDomain: e.target.value })}
                placeholder="orders@yourdomain.com"
              />
              <small>Use your own domain for order confirmation emails</small>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Custom Footer</h2>
            <div className={styles.formGroup}>
              <label>Footer Content</label>
              <textarea
                value={settings.customFooter}
                onChange={(e) => setSettings({ ...settings, customFooter: e.target.value })}
                placeholder="Enter custom footer text..."
                rows={4}
              />
            </div>
          </div>

          <div className={styles.infoBox}>
            <FiInfo />
            <div>
              <h4>DNS Configuration Required</h4>
              <p>After saving your custom domain, you'll need to configure your DNS settings. We'll provide detailed instructions.</p>
            </div>
          </div>
        </div>
      </div>
    </FeatureGuard>
  );
};

export default Whitelabel;
