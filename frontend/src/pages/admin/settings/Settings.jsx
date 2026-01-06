import { useState } from 'react';
import { FiSave, FiGlobe, FiMail, FiDollarSign, FiShield } from 'react-icons/fi';
import styles from './Settings.module.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    siteName: 'NovaMart', siteDescription: 'Your one-stop e-commerce platform', currency: 'USD', timezone: 'UTC',
    smtpHost: '', smtpPort: '587', smtpUser: '', smtpPass: '',
    commissionRate: '10', minPayout: '50', payoutSchedule: 'weekly',
    maintenanceMode: false, registrationEnabled: true, sellerRegistration: true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({ ...settings, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSave = () => { alert('Settings saved successfully!'); };

  const tabs = [
    { id: 'general', label: 'General', icon: FiGlobe },
    { id: 'email', label: 'Email', icon: FiMail },
    { id: 'payments', label: 'Payments', icon: FiDollarSign },
    { id: 'security', label: 'Security', icon: FiShield },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}><h1>Platform Settings</h1><p>Configure your platform settings</p></div>

      <div className={styles.content}>
        <div className={styles.sidebar}>
          {tabs.map((tab) => (
            <button key={tab.id} className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTab : ''}`} onClick={() => setActiveTab(tab.id)}>
              <tab.icon /> {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.main}>
          {activeTab === 'general' && (
            <div className={styles.card}>
              <h3>General Settings</h3>
              <div className={styles.formGroup}><label>Site Name</label><input type="text" name="siteName" value={settings.siteName} onChange={handleChange} /></div>
              <div className={styles.formGroup}><label>Site Description</label><textarea name="siteDescription" value={settings.siteDescription} onChange={handleChange} rows="3" /></div>
              <div className={styles.row}>
                <div className={styles.formGroup}><label>Currency</label><select name="currency" value={settings.currency} onChange={handleChange}><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option></select></div>
                <div className={styles.formGroup}><label>Timezone</label><select name="timezone" value={settings.timezone} onChange={handleChange}><option value="UTC">UTC</option><option value="EST">EST</option><option value="PST">PST</option></select></div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className={styles.card}>
              <h3>Email Settings</h3>
              <div className={styles.row}>
                <div className={styles.formGroup}><label>SMTP Host</label><input type="text" name="smtpHost" value={settings.smtpHost} onChange={handleChange} placeholder="smtp.example.com" /></div>
                <div className={styles.formGroup}><label>SMTP Port</label><input type="text" name="smtpPort" value={settings.smtpPort} onChange={handleChange} /></div>
              </div>
              <div className={styles.row}>
                <div className={styles.formGroup}><label>SMTP Username</label><input type="text" name="smtpUser" value={settings.smtpUser} onChange={handleChange} /></div>
                <div className={styles.formGroup}><label>SMTP Password</label><input type="password" name="smtpPass" value={settings.smtpPass} onChange={handleChange} /></div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className={styles.card}>
              <h3>Payment Settings</h3>
              <div className={styles.formGroup}><label>Commission Rate (%)</label><input type="number" name="commissionRate" value={settings.commissionRate} onChange={handleChange} /></div>
              <div className={styles.row}>
                <div className={styles.formGroup}><label>Minimum Payout ($)</label><input type="number" name="minPayout" value={settings.minPayout} onChange={handleChange} /></div>
                <div className={styles.formGroup}><label>Payout Schedule</label><select name="payoutSchedule" value={settings.payoutSchedule} onChange={handleChange}><option value="weekly">Weekly</option><option value="biweekly">Bi-weekly</option><option value="monthly">Monthly</option></select></div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className={styles.card}>
              <h3>Security Settings</h3>
              <div className={styles.toggle}><label><input type="checkbox" name="maintenanceMode" checked={settings.maintenanceMode} onChange={handleChange} /> Enable Maintenance Mode</label></div>
              <div className={styles.toggle}><label><input type="checkbox" name="registrationEnabled" checked={settings.registrationEnabled} onChange={handleChange} /> Allow User Registration</label></div>
              <div className={styles.toggle}><label><input type="checkbox" name="sellerRegistration" checked={settings.sellerRegistration} onChange={handleChange} /> Allow Seller Registration</label></div>
            </div>
          )}

          <button onClick={handleSave} className={styles.saveBtn}><FiSave /> Save Settings</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
