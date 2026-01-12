import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FiShield, FiLock, FiKey, FiAlertTriangle, FiCheckCircle, FiLoader } from 'react-icons/fi';
import FeatureGuard from '../../../components/common/FeatureGuard';
import { fetchSecuritySettings, updateSecuritySettings, fetchSecurityLogs } from '../../../redux/slices/sellerSlice';
import styles from './AdvancedSecurity.module.css';

const AdvancedSecurity = () => {
  const dispatch = useDispatch();
  const { securitySettings, securityLogs, securityLoading } = useSelector((state) => state.seller);
  
  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    ipWhitelist: false,
    sessionTimeout: '30',
    passwordExpiry: '90',
    loginNotifications: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchSecuritySettings());
    dispatch(fetchSecurityLogs());
  }, [dispatch]);

  useEffect(() => {
    if (securitySettings) {
      setSettings({
        twoFactorAuth: securitySettings.twoFactorAuth || false,
        ipWhitelist: securitySettings.ipWhitelist || false,
        sessionTimeout: String(securitySettings.sessionTimeout || 30),
        passwordExpiry: String(securitySettings.passwordExpiry || 90),
        loginNotifications: securitySettings.loginNotifications ?? true,
      });
    }
  }, [securitySettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await dispatch(updateSecuritySettings({
        twoFactorAuth: settings.twoFactorAuth,
        ipWhitelist: settings.ipWhitelist,
        sessionTimeout: parseInt(settings.sessionTimeout),
        passwordExpiry: parseInt(settings.passwordExpiry),
        loginNotifications: settings.loginNotifications,
      })).unwrap();
      toast.success('Security settings updated successfully!');
    } catch (error) {
      toast.error(error || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (securityLoading) {
    return (
      <FeatureGuard featureKey="advancedSecurity">
        <div className={styles.advancedSecurity}>
          <div className={styles.loading}>
            <FiLoader className={styles.spinner} />
            <p>Loading security settings...</p>
          </div>
        </div>
      </FeatureGuard>
    );
  }

  return (
    <FeatureGuard featureKey="advancedSecurity">
      <div className={styles.advancedSecurity}>
        <div className={styles.header}>
          <div>
            <h1><FiShield className={styles.headerIcon} /> Advanced Security</h1>
            <p>Enhanced security features and compliance tools</p>
          </div>
          <button onClick={handleSave} className={styles.saveBtn}>
            Save Settings
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.statusCard}>
            <FiCheckCircle className={styles.statusIcon} />
            <div>
              <h3>Security Status: Excellent</h3>
              <p>All recommended security features are enabled</p>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Authentication</h2>
            <div className={styles.settingsList}>
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <FiLock className={styles.settingIcon} />
                  <div>
                    <h4>Two-Factor Authentication</h4>
                    <p>Require 2FA for all account access</p>
                  </div>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={settings.twoFactorAuth}
                    onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <FiKey className={styles.settingIcon} />
                  <div>
                    <h4>IP Whitelist</h4>
                    <p>Restrict access to specific IP addresses</p>
                  </div>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={settings.ipWhitelist}
                    onChange={(e) => setSettings({ ...settings, ipWhitelist: e.target.checked })}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <FiAlertTriangle className={styles.settingIcon} />
                  <div>
                    <h4>Login Notifications</h4>
                    <p>Email alerts for new login attempts</p>
                  </div>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={settings.loginNotifications}
                    onChange={(e) => setSettings({ ...settings, loginNotifications: e.target.checked })}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Session Management</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Session Timeout (minutes)</label>
                <select
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Password Expiry (days)</label>
                <select
                  value={settings.passwordExpiry}
                  onChange={(e) => setSettings({ ...settings, passwordExpiry: e.target.value })}
                >
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Security Logs</h2>
            <div className={styles.logsList}>
              {securityLogs.map((log) => (
                <div key={log.id} className={`${styles.logItem} ${styles[log.status]}`}>
                  <div className={styles.logIcon}>
                    {log.status === 'success' ? <FiCheckCircle /> : <FiAlertTriangle />}
                  </div>
                  <div className={styles.logInfo}>
                    <p>{log.message}</p>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FeatureGuard>
  );
};

export default AdvancedSecurity;
