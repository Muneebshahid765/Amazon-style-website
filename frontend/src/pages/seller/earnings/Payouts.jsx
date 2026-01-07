import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPayoutHistory,
  fetchPayoutSettings,
  updatePayoutSettings,
  requestPayout,
  fetchEarnings,
} from '../../../redux/slices/sellerSlice';
import {
  FiDollarSign,
  FiCreditCard,
  FiSettings,
  FiPlus,
  FiCheck,
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';
import styles from './Payouts.module.css';

const Payouts = () => {
  const dispatch = useDispatch();
  const { payoutHistory, payoutSettings, earnings, pagination, loading } = useSelector(
    (state) => state.seller
  );
  const [activeTab, setActiveTab] = useState('history');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [requestData, setRequestData] = useState({ amount: '', method: 'bank_transfer' });
  const [settingsData, setSettingsData] = useState({
    payoutMethod: 'bank_transfer',
    bankAccount: {
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      routingNumber: '',
      swiftCode: '',
      country: '',
    },
    paypalAccount: { email: '' },
    minimumPayout: 50,
    autoPayoutEnabled: false,
    autoPayoutDay: 1,
  });
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    dispatch(fetchEarnings());
    dispatch(fetchPayoutSettings());
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === 'history') {
      dispatch(fetchPayoutHistory({ page: currentPage, limit: 20 }));
    }
  }, [dispatch, activeTab, currentPage]);

  useEffect(() => {
    if (payoutSettings) {
      setSettingsData({
        payoutMethod: payoutSettings.payoutMethod || 'bank_transfer',
        bankAccount: {
          accountHolderName: payoutSettings.bankAccount?.accountHolderName || '',
          accountNumber: payoutSettings.bankAccount?.accountNumber || '',
          bankName: payoutSettings.bankAccount?.bankName || '',
          routingNumber: payoutSettings.bankAccount?.routingNumber || '',
          swiftCode: payoutSettings.bankAccount?.swiftCode || '',
          country: payoutSettings.bankAccount?.country || '',
        },
        paypalAccount: { email: payoutSettings.paypalAccount?.email || '' },
        minimumPayout: payoutSettings.minimumPayout || 50,
        autoPayoutEnabled: payoutSettings.autoPayoutEnabled || false,
        autoPayoutDay: payoutSettings.autoPayoutDay || 1,
      });
    }
  }, [payoutSettings]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    const result = await dispatch(updatePayoutSettings(settingsData));
    setSaving(false);
    if (updatePayoutSettings.fulfilled.match(result)) {
      setMessage({ type: 'success', text: 'Payout settings saved successfully!' });
    } else {
      setMessage({ type: 'error', text: result.payload || 'Failed to save settings' });
    }
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    if (!requestData.amount || Number(requestData.amount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }
    if (Number(requestData.amount) > (earnings?.available || 0)) {
      setMessage({ type: 'error', text: 'Amount exceeds available balance' });
      return;
    }

    setRequesting(true);
    const result = await dispatch(
      requestPayout({
        amount: Number(requestData.amount),
        method: requestData.method,
        accountDetails:
          requestData.method === 'bank_transfer'
            ? settingsData.bankAccount
            : { paypalEmail: settingsData.paypalAccount.email },
      })
    );
    setRequesting(false);

    if (requestPayout.fulfilled.match(result)) {
      setShowRequestModal(false);
      setRequestData({ amount: '', method: 'bank_transfer' });
      dispatch(fetchEarnings());
      dispatch(fetchPayoutHistory({ page: 1, limit: 20 }));
      setMessage({ type: 'success', text: 'Payout request submitted successfully!' });
    } else {
      setMessage({ type: 'error', text: result.payload || 'Failed to request payout' });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className={styles.statusIconCompleted} />;
      case 'pending':
        return <FiClock className={styles.statusIconPending} />;
      case 'processing':
        return <FiClock className={styles.statusIconProcessing} />;
      case 'rejected':
        return <FiXCircle className={styles.statusIconRejected} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Payouts</h1>
          <p>Manage your earnings and payout settings</p>
        </div>
        <button onClick={() => setShowRequestModal(true)} className={styles.requestBtn}>
          <FiPlus /> Request Payout
        </button>
      </div>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
          {message.text}
        </div>
      )}

      <div className={styles.balanceCards}>
        <div className={styles.balanceCard}>
          <div className={styles.balanceIcon} style={{ background: '#d1fae5', color: '#10b981' }}>
            <FiDollarSign />
          </div>
          <div>
            <p className={styles.balanceLabel}>Available Balance</p>
            <p className={styles.balanceValue}>${earnings?.available?.toLocaleString() || '0.00'}</p>
          </div>
        </div>
        <div className={styles.balanceCard}>
          <div className={styles.balanceIcon} style={{ background: '#fef3c7', color: '#f59e0b' }}>
            <FiClock />
          </div>
          <div>
            <p className={styles.balanceLabel}>Pending Payouts</p>
            <p className={styles.balanceValue}>${earnings?.pending?.toLocaleString() || '0.00'}</p>
          </div>
        </div>
        <div className={styles.balanceCard}>
          <div className={styles.balanceIcon} style={{ background: '#dbeafe', color: '#3b82f6' }}>
            <FiCheckCircle />
          </div>
          <div>
            <p className={styles.balanceLabel}>Total Earnings</p>
            <p className={styles.balanceValue}>${earnings?.total?.toLocaleString() || '0.00'}</p>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FiCreditCard /> Payout History
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <FiSettings /> Payout Settings
        </button>
      </div>

      {activeTab === 'history' && (
        <div className={styles.historySection}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {payoutHistory.map((payout) => (
                  <tr key={payout._id}>
                    <td>{new Date(payout.createdAt).toLocaleDateString()}</td>
                    <td className={styles.amount}>${payout.amount?.toFixed(2)}</td>
                    <td>{payout.method?.replace('_', ' ')}</td>
                    <td>
                      <span className={`${styles.status} ${styles[payout.status]}`}>
                        {getStatusIcon(payout.status)} {payout.status}
                      </span>
                    </td>
                    <td>{payout.transactionId || '-'}</td>
                  </tr>
                ))}
                {payoutHistory.length === 0 && (
                  <tr>
                    <td colSpan="5" className={styles.empty}>
                      No payout history yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className={styles.pageBtn}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {pagination.totalPages}
              </span>
              <button
                disabled={currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className={styles.pageBtn}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className={styles.settingsSection}>
          <div className={styles.settingsGrid}>
            <div className={styles.card}>
              <h3>Payout Method</h3>
              <div className={styles.methodOptions}>
                <label
                  className={`${styles.methodOption} ${
                    settingsData.payoutMethod === 'bank_transfer' ? styles.selected : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="payoutMethod"
                    value="bank_transfer"
                    checked={settingsData.payoutMethod === 'bank_transfer'}
                    onChange={(e) =>
                      setSettingsData({ ...settingsData, payoutMethod: e.target.value })
                    }
                  />
                  <FiCreditCard />
                  <span>Bank Transfer</span>
                </label>
                <label
                  className={`${styles.methodOption} ${
                    settingsData.payoutMethod === 'paypal' ? styles.selected : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="payoutMethod"
                    value="paypal"
                    checked={settingsData.payoutMethod === 'paypal'}
                    onChange={(e) =>
                      setSettingsData({ ...settingsData, payoutMethod: e.target.value })
                    }
                  />
                  <FiDollarSign />
                  <span>PayPal</span>
                </label>
              </div>
            </div>

            {settingsData.payoutMethod === 'bank_transfer' && (
              <div className={styles.card}>
                <h3>Bank Account Details</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Account Holder Name *</label>
                    <input
                      type="text"
                      value={settingsData.bankAccount.accountHolderName}
                      onChange={(e) =>
                        setSettingsData({
                          ...settingsData,
                          bankAccount: {
                            ...settingsData.bankAccount,
                            accountHolderName: e.target.value,
                          },
                        })
                      }
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Bank Name *</label>
                    <input
                      type="text"
                      value={settingsData.bankAccount.bankName}
                      onChange={(e) =>
                        setSettingsData({
                          ...settingsData,
                          bankAccount: { ...settingsData.bankAccount, bankName: e.target.value },
                        })
                      }
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Account Number *</label>
                    <input
                      type="text"
                      value={settingsData.bankAccount.accountNumber}
                      onChange={(e) =>
                        setSettingsData({
                          ...settingsData,
                          bankAccount: {
                            ...settingsData.bankAccount,
                            accountNumber: e.target.value,
                          },
                        })
                      }
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Routing Number</label>
                    <input
                      type="text"
                      value={settingsData.bankAccount.routingNumber}
                      onChange={(e) =>
                        setSettingsData({
                          ...settingsData,
                          bankAccount: {
                            ...settingsData.bankAccount,
                            routingNumber: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>SWIFT/BIC Code</label>
                    <input
                      type="text"
                      value={settingsData.bankAccount.swiftCode}
                      onChange={(e) =>
                        setSettingsData({
                          ...settingsData,
                          bankAccount: { ...settingsData.bankAccount, swiftCode: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Country</label>
                    <input
                      type="text"
                      value={settingsData.bankAccount.country}
                      onChange={(e) =>
                        setSettingsData({
                          ...settingsData,
                          bankAccount: { ...settingsData.bankAccount, country: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
                {payoutSettings?.bankAccount?.isVerified && (
                  <div className={styles.verifiedBadge}>
                    <FiCheck /> Bank account verified
                  </div>
                )}
              </div>
            )}

            {settingsData.payoutMethod === 'paypal' && (
              <div className={styles.card}>
                <h3>PayPal Account</h3>
                <div className={styles.formGroup}>
                  <label>PayPal Email *</label>
                  <input
                    type="email"
                    value={settingsData.paypalAccount.email}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        paypalAccount: { ...settingsData.paypalAccount, email: e.target.value },
                      })
                    }
                    required
                  />
                </div>
                {payoutSettings?.paypalAccount?.isVerified && (
                  <div className={styles.verifiedBadge}>
                    <FiCheck /> PayPal account verified
                  </div>
                )}
              </div>
            )}

            <div className={styles.card}>
              <h3>Payout Preferences</h3>
              <div className={styles.formGroup}>
                <label>Minimum Payout Amount ($)</label>
                <input
                  type="number"
                  min="10"
                  value={settingsData.minimumPayout}
                  onChange={(e) =>
                    setSettingsData({ ...settingsData, minimumPayout: Number(e.target.value) })
                  }
                />
              </div>
              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={settingsData.autoPayoutEnabled}
                    onChange={(e) =>
                      setSettingsData({ ...settingsData, autoPayoutEnabled: e.target.checked })
                    }
                  />
                  Enable automatic monthly payouts
                </label>
              </div>
              {settingsData.autoPayoutEnabled && (
                <div className={styles.formGroup}>
                  <label>Payout Day of Month</label>
                  <select
                    value={settingsData.autoPayoutDay}
                    onChange={(e) =>
                      setSettingsData({ ...settingsData, autoPayoutDay: Number(e.target.value) })
                    }
                  >
                    {[...Array(28)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <button type="submit" disabled={saving} className={styles.saveBtn}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}

      {showRequestModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Request Payout</h3>
            <p>
              Available balance: <strong>${earnings?.available?.toLocaleString() || '0.00'}</strong>
            </p>
            <form onSubmit={handleRequestPayout}>
              <div className={styles.formGroup}>
                <label>Amount ($)</label>
                <input
                  type="number"
                  min="1"
                  max={earnings?.available || 0}
                  value={requestData.amount}
                  onChange={(e) => setRequestData({ ...requestData, amount: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Payout Method</label>
                <select
                  value={requestData.method}
                  onChange={(e) => setRequestData({ ...requestData, method: e.target.value })}
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requesting || (earnings?.available || 0) <= 0}
                  className={styles.submitBtn}
                >
                  {requesting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payouts;
