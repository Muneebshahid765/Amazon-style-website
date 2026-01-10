import { useEffect, useMemo, useState } from 'react';
import { FiX, FiShield, FiClock } from 'react-icons/fi';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import styles from './PlanCheckoutModal.module.css';

const defaultPaymentState = (user) => ({
  fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
  email: user?.email || '',
  country: (user?.profile?.country?.slice(0, 2).toUpperCase() || 'PK'),
  address: user?.profile?.address || '',
});

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '16px',
      '::placeholder': {
        color: '#94a3b8',
      },
    },
    invalid: {
      color: '#ef4444',
    },
  },
};

const PlanCheckoutModal = ({
  isOpen,
  plan,
  onClose,
  onConfirm,
  loading,
  user,
}) => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [payment, setPayment] = useState(defaultPaymentState(user));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user) {
      setPayment(defaultPaymentState(user));
    }
  }, [user, plan?._id]);

  useEffect(() => {
    if (!isOpen) {
      setBillingCycle('monthly');
      setPayment(defaultPaymentState(user));
      setNotes('');
    }
  }, [isOpen, user]);

  const totalDue = useMemo(() => {
    if (!plan) return 0;
    if (billingCycle === 'monthly') return plan.priceMonthly;
    const yearlyBase = plan.priceMonthly * 12;
    return Math.round(yearlyBase * 0.83 * 100) / 100; // ~17% savings
  }, [plan, billingCycle]);

  const savings = useMemo(() => {
    if (!plan || billingCycle !== 'yearly') return null;
    const yearlyBase = plan.priceMonthly * 12;
    const saveAmount = yearlyBase - totalDue;
    return saveAmount.toFixed(2);
  }, [plan, billingCycle, totalDue]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayment((prev) => {
      if (name === 'country') {
        return { ...prev, country: value.slice(0, 2).toUpperCase() };
      }
      return { ...prev, [name]: value };
    });
  };

  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || !stripe || !elements) return;
    await onConfirm?.({ billingCycle, payment, notes, stripe, elements });
  };

  if (!isOpen || !plan) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <p>Plan checkout</p>
            <h2>{plan.name}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close checkout">
            <FiX />
          </button>
        </div>

        <div className={styles.billingToggle}>
          <button
            type="button"
            className={billingCycle === 'monthly' ? styles.activeToggle : ''}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
            <span>${plan.priceMonthly.toFixed(2)}/mo</span>
          </button>
          <button
            type="button"
            className={billingCycle === 'yearly' ? styles.activeToggle : ''}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly
            <span>
              ${(plan.priceMonthly * 12 * 0.83).toFixed(2)}/yr {savings && <strong>Save ${savings}</strong>}
            </span>
          </button>
        </div>

        <div className={styles.content}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <section>
              <h3>Payment method</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Full name</label>
                  <input
                    name="fullName"
                    value={payment.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={payment.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Country/Region</label>
                  <input
                    name="country"
                    value={payment.country}
                    onChange={handleChange}
                    placeholder="Pakistan"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Address</label>
                  <input
                    name="address"
                    value={payment.address}
                    onChange={handleChange}
                    placeholder="Street, city"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Card details</label>
                <div className={styles.stripeCard}>
                  <CardElement options={CARD_ELEMENT_OPTIONS} />
                </div>
              </div>
            </section>

            <section>
              <h3>Notes (optional)</h3>
              <textarea
                className={styles.notesBox}
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share any account notes or billing reference"
              />
            </section>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Confirm & activate'}
            </button>
          </form>

          <aside className={styles.summary}>
            <div className={styles.summaryCard}>
              <h3>Order details</h3>
              <div className={styles.summaryRow}>
                <span>Selected plan</span>
                <strong>{plan.name}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Billing cycle</span>
                <strong>{billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <strong>${totalDue.toFixed(2)}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Taxes & fees</span>
                <strong>$0.00</strong>
              </div>
              <div className={styles.summaryTotal}>
                <span>Total due today</span>
                <strong>${totalDue.toFixed(2)}</strong>
              </div>
              <p className={styles.renewalNote}>
                Your subscription will auto-renew. You can cancel or change plans anytime from your dashboard.
              </p>
            </div>

            <div className={styles.infoCard}>
              <FiShield />
              <div>
                <h4>Secure checkout</h4>
                <p>Your card information is encrypted and never stored on our servers.</p>
              </div>
            </div>
            <div className={styles.infoCard}>
              <FiClock />
              <div>
                <h4>Instant activation</h4>
                <p>Plan limits update immediately after successful payment.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PlanCheckoutModal;
