import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEarnings, requestPayout } from '../../../redux/slices/sellerSlice';
import { FiDollarSign, FiClock, FiCheckCircle, FiArrowUp } from 'react-icons/fi';
import styles from './Earnings.module.css';

const Earnings = () => {
  const dispatch = useDispatch();
  const { earnings, loading } = useSelector((state) => state.seller);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [payoutData, setPayoutData] = useState({
    amount: '',
    method: 'bank_transfer',
    accountDetails: { accountHolderName: '', accountNumber: '', bankName: '' },
  });

  useEffect(() => {
    dispatch(fetchEarnings());
  }, [dispatch]);

  const handlePayoutRequest = async (e) => {
    e.preventDefault();
    const availableBalance = earnings?.available || 0;
    const amountValue = Number(payoutData.amount);

    if (!amountValue || amountValue <= 0) {
      setFormError('Please enter an amount greater than zero.');
      return;
    }

    if (amountValue > availableBalance) {
      setFormError('Requested amount exceeds available balance.');
      return;
    }

    if (!payoutData.accountDetails.accountHolderName || !payoutData.accountDetails.accountNumber) {
      setFormError('Account holder name and account number are required.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    const result = await dispatch(requestPayout({ ...payoutData, amount: amountValue }));
    setIsSubmitting(false);

    if (requestPayout.fulfilled.match(result)) {
      setShowPayoutModal(false);
      setPayoutData({
        amount: '',
        method: 'bank_transfer',
        accountDetails: { accountHolderName: '', accountNumber: '', bankName: '' },
      });
      dispatch(fetchEarnings());
    } else {
      setFormError(result.payload || 'Failed to request payout.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div><h1>Earnings</h1><p>Track your revenue and request payouts</p></div>
        <button onClick={() => setShowPayoutModal(true)} className={styles.payoutBtn}><FiArrowUp /> Request Payout</button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{background: '#d1fae5', color: '#10b981'}}><FiDollarSign /></div>
          <div><p className={styles.statLabel}>Total Earnings</p><p className={styles.statValue}>${earnings?.total?.toLocaleString() || 0}</p></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{background: '#dbeafe', color: '#3b82f6'}}><FiCheckCircle /></div>
          <div><p className={styles.statLabel}>Available Balance</p><p className={styles.statValue}>${earnings?.available?.toLocaleString() || 0}</p></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{background: '#fef3c7', color: '#f59e0b'}}><FiClock /></div>
          <div><p className={styles.statLabel}>Pending Payout</p><p className={styles.statValue}>${earnings?.pending?.toLocaleString() || 0}</p></div>
        </div>
      </div>

      <div className={styles.section}>
        <h2>Payout History</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr><th>Date</th><th>Amount</th><th>Method</th><th>Status</th><th>Transaction ID</th></tr>
            </thead>
            <tbody>
              {(earnings?.history || []).map((payout) => (
                <tr key={payout._id}>
                  <td>{new Date(payout.createdAt).toLocaleDateString()}</td>
                  <td className={styles.amount}>${payout.amount?.toFixed(2)}</td>
                  <td>{payout.method?.replace('_', ' ')}</td>
                  <td><span className={`${styles.status} ${styles[payout.status]}`}>{payout.status}</span></td>
                  <td>{payout.transactionId || '-'}</td>
                </tr>
              ))}
              {(!earnings?.history || earnings.history.length === 0) && (
                <tr><td colSpan="5" className={styles.empty}>No payout history yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPayoutModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Request Payout</h3>
            <p>Available balance: <strong>${earnings?.available?.toLocaleString() || 0}</strong></p>
            <form onSubmit={handlePayoutRequest}>
              <div className={styles.formGroup}>
                <label>Amount</label>
                <input type="number" value={payoutData.amount} onChange={(e) => setPayoutData({...payoutData, amount: e.target.value})} max={earnings?.available || 0} required />
              </div>
              <div className={styles.formGroup}>
                <label>Payment Method</label>
                <select value={payoutData.method} onChange={(e) => setPayoutData({...payoutData, method: e.target.value})}>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Account Holder Name</label>
                <input type="text" value={payoutData.accountDetails.accountHolderName} onChange={(e) => setPayoutData({...payoutData, accountDetails: {...payoutData.accountDetails, accountHolderName: e.target.value}})} required />
              </div>
              <div className={styles.formGroup}>
                <label>Account Number</label>
                <input type="text" value={payoutData.accountDetails.accountNumber} onChange={(e) => setPayoutData({...payoutData, accountDetails: {...payoutData.accountDetails, accountNumber: e.target.value}})} required />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowPayoutModal(false)} className={styles.cancelBtn}>Cancel</button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isSubmitting || (earnings?.available || 0) <= 0}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
              {formError && <p className={styles.errorText}>{formError}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Earnings;
