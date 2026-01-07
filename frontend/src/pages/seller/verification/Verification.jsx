import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  fetchSellerVerification,
  createVerificationPaymentIntent,
  submitSellerVerification,
} from '../../../redux/slices/sellerSlice';
import {
  FiUpload,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiAlertTriangle,
  FiShield,
  FiCreditCard,
} from 'react-icons/fi';
import styles from './Verification.module.css';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const verificationFeeEnv = import.meta.env.VITE_SELLER_VERIFICATION_FEE;
const verificationFee = verificationFeeEnv ? Number(verificationFeeEnv) : 49;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const VerificationForm = () => {
  const dispatch = useDispatch();
  const stripe = useStripe();
  const elements = useElements();
  const {
    verification,
    verificationLoading,
    verificationPaymentIntent,
    verificationError,
  } = useSelector((state) => state.seller);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'individual',
    registrationNumber: '',
    taxId: '',
    businessCategory: '',
    website: '',
    description: '',
    submissionNotes: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
  });
  const [documents, setDocuments] = useState([]);
  const [cardCompletion, setCardCompletion] = useState({ number: false, expiry: false, cvc: false });
  const [cardError, setCardError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const statusBadge = useMemo(() => {
    if (!verification) return null;
    const status = verification.status;
    if (status === 'approved') return <span className={`${styles.status} ${styles.approved}`}><FiCheckCircle /> Approved</span>;
    if (status === 'pending') return <span className={`${styles.status} ${styles.pending}`}><FiClock /> Pending Review</span>;
    if (status === 'rejected') return <span className={`${styles.status} ${styles.rejected}`}><FiXCircle /> Rejected</span>;
    return null;
  }, [verification]);

  const canSubmit = !verification || verification.status === 'rejected';
  const stripeEnabled = Boolean(stripePromise);
  const cardReady = cardCompletion.number && cardCompletion.expiry && cardCompletion.cvc;

  useEffect(() => {
    dispatch(fetchSellerVerification());
  }, [dispatch]);

  useEffect(() => {
    if (verification) {
      setFormData((prev) => ({
        ...prev,
        businessName: verification.businessName || prev.businessName,
        businessType: verification.businessType || prev.businessType,
        registrationNumber: verification.registrationNumber || prev.registrationNumber,
        taxId: verification.taxId || prev.taxId,
        businessCategory: verification.businessCategory || prev.businessCategory,
        website: verification.website || prev.website,
        description: verification.description || prev.description,
        submissionNotes: verification.submissionNotes || '',
        address: {
          street: verification.address?.street || '',
          city: verification.address?.city || '',
          state: verification.address?.state || '',
          postalCode: verification.address?.postalCode || '',
          country: verification.address?.country || '',
        },
      }));
    }
  }, [verification]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value,
      },
    }));
  };

  const handleFileChange = (e) => {
    setDocuments(Array.from(e.target.files || []));
  };

  const resetCardState = () => {
    setCardCompletion({ number: false, expiry: false, cvc: false });
    const numberElement = elements?.getElement(CardNumberElement);
    numberElement?.clear();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setCardError('');

    if (!canSubmit) {
      setMessage('Verification request already submitted.');
      return;
    }

    if (!stripeEnabled) {
      setMessage('Card payments are not configured. Please contact support.');
      return;
    }

    if (!stripe || !elements) {
      setCardError('Payment form is not ready yet. Please wait a moment.');
      return;
    }

    if (!cardReady) {
      setCardError('Please complete your card details before submitting.');
      return;
    }

    setSubmitting(true);

    const paymentIntentResult = await dispatch(createVerificationPaymentIntent());
    if (!createVerificationPaymentIntent.fulfilled.match(paymentIntentResult)) {
      setSubmitting(false);
      setCardError(paymentIntentResult.payload || 'Unable to start payment.');
      return;
    }

    const { clientSecret, paymentIntentId, amount, currency } = paymentIntentResult.payload;

    try {
      const cardElement = elements.getElement(CardNumberElement);
      if (!cardElement) {
        setCardError('Unable to access card input. Please refresh and try again.');
        setSubmitting(false);
        return;
      }

      const paymentConfirmation = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: formData.businessName || 'Seller',
          },
        },
      });

      if (paymentConfirmation.error) {
        setCardError(paymentConfirmation.error.message || 'Payment failed.');
        setSubmitting(false);
        return;
      }

      if (paymentConfirmation.paymentIntent?.status !== 'succeeded') {
        setCardError('Payment was not completed. Please try again.');
        setSubmitting(false);
        return;
      }

      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'address') {
          payload.append('address', JSON.stringify(value));
        } else {
          payload.append(key, value || '');
        }
      });
      documents.forEach((file) => payload.append('documents', file));
      payload.append('paymentMethod', 'stripe');
      payload.append('paymentIntentId', paymentIntentId);
      payload.append('fee', amount);
      payload.append('currency', currency);

      const submitResult = await dispatch(submitSellerVerification(payload));
      if (submitSellerVerification.fulfilled.match(submitResult)) {
        setMessage('Verification submitted successfully. We will notify you once reviewed.');
        setDocuments([]);
        resetCardState();
        dispatch(fetchSellerVerification());
      } else {
        setCardError(submitResult.payload || 'Failed to submit verification.');
      }
    } catch (error) {
      setCardError(error.message || 'Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.formWrapper}>
      <div className={styles.topSection}>
        <div>
          <h1>Seller Verification</h1>
          <p>Submit your business details and documents to unlock full marketplace features.</p>
        </div>
        <div className={styles.badges}>
          <span className={styles.badge}><FiShield /> Secure Verification</span>
          <span className={styles.badge}><FiCreditCard /> ${verificationFee.toFixed(2)} Fee</span>
        </div>
      </div>

      {verification && (
        <div className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <div>
              <p>Status</p>
              {statusBadge}
            </div>
            {verification.payment && (
              <div className={styles.paymentInfo}>
                <p>Paid: <strong>{verification.payment.amount?.toFixed(2)} {verification.payment.currency?.toUpperCase()}</strong></p>
                <p>Method: {verification.payment.provider}</p>
              </div>
            )}
          </div>
          {verification.status === 'rejected' && (
            <div className={styles.rejectionBox}>
              <FiAlertTriangle />
              <div>
                <p>Your previous submission was rejected.</p>
                <p><strong>Reason:</strong> {verification.rejectionReason || 'Not specified'}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={styles.layout}>
        <div className={styles.leftPane}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <section className={styles.section}>
              <h3>Business Details</h3>
              <div className={styles.gridTwo}>
                <div className={styles.formGroup}>
                  <label>Business Name *</label>
                  <input name="businessName" value={formData.businessName} onChange={handleInputChange} required disabled={!canSubmit} />
                </div>
                <div className={styles.formGroup}>
                  <label>Business Type</label>
                  <select name="businessType" value={formData.businessType} onChange={handleInputChange} disabled={!canSubmit}>
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>
              </div>
              <div className={styles.gridTwo}>
                <div className={styles.formGroup}>
                  <label>Registration Number</label>
                  <input name="registrationNumber" value={formData.registrationNumber} onChange={handleInputChange} disabled={!canSubmit} />
                </div>
                <div className={styles.formGroup}>
                  <label>Tax ID</label>
                  <input name="taxId" value={formData.taxId} onChange={handleInputChange} disabled={!canSubmit} />
                </div>
              </div>
              <div className={styles.gridTwo}>
                <div className={styles.formGroup}>
                  <label>Business Category</label>
                  <input name="businessCategory" value={formData.businessCategory} onChange={handleInputChange} disabled={!canSubmit} />
                </div>
                <div className={styles.formGroup}>
                  <label>Website</label>
                  <input name="website" value={formData.website} onChange={handleInputChange} disabled={!canSubmit} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} disabled={!canSubmit} />
              </div>
            </section>

            <section className={styles.section}>
              <h3>Business Address</h3>
              <div className={styles.gridTwo}>
                <div className={styles.formGroup}>
                  <label>Street</label>
                  <input name="street" value={formData.address.street} onChange={handleAddressChange} disabled={!canSubmit} />
                </div>
                <div className={styles.formGroup}>
                  <label>City</label>
                  <input name="city" value={formData.address.city} onChange={handleAddressChange} disabled={!canSubmit} />
                </div>
              </div>
              <div className={styles.gridTwo}>
                <div className={styles.formGroup}>
                  <label>State/Province</label>
                  <input name="state" value={formData.address.state} onChange={handleAddressChange} disabled={!canSubmit} />
                </div>
                <div className={styles.formGroup}>
                  <label>Postal Code</label>
                  <input name="postalCode" value={formData.address.postalCode} onChange={handleAddressChange} disabled={!canSubmit} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Country</label>
                <input name="country" value={formData.address.country} onChange={handleAddressChange} disabled={!canSubmit} />
              </div>
            </section>

            <section className={styles.section}>
              <h3>Documents</h3>
              <label className={styles.fileInput}>
                <FiUpload />
                <span>{documents.length ? `${documents.length} file(s) selected` : 'Upload government/registration documents'}</span>
                <input type="file" multiple onChange={handleFileChange} accept="image/*,.pdf" disabled={!canSubmit} />
              </label>
              <p className={styles.helperText}>Supported formats: PDF, PNG, JPG. Maximum 5 files.</p>
            </section>

            <section className={styles.section}>
              <h3>Payment Details</h3>
              <p className={styles.helperText}>Verification fee: ${verificationFee.toFixed(2)} USD (non-refundable)</p>
              <div className={styles.cardGrid}>
                <div className={styles.cardField}>
                  <label>Card Number</label>
                  <CardNumberElement
                    options={{ showIcon: true, style: { base: { fontSize: '15px' } } }}
                    onChange={(event) => setCardCompletion((prev) => ({ ...prev, number: event.complete }))}
                    onReady={() => setCardError('')}
                  />
                </div>
                <div className={styles.cardField}>
                  <label>Expiry</label>
                  <CardExpiryElement
                    options={{ style: { base: { fontSize: '15px' } } }}
                    onChange={(event) => setCardCompletion((prev) => ({ ...prev, expiry: event.complete }))}
                  />
                </div>
                <div className={styles.cardField}>
                  <label>CVC</label>
                  <CardCvcElement
                    options={{ style: { base: { fontSize: '15px' } } }}
                    onChange={(event) => setCardCompletion((prev) => ({ ...prev, cvc: event.complete }))}
                  />
                </div>
              </div>
              {cardError && <div className={styles.errorBox}>{cardError}</div>}
            </section>

            <section className={styles.section}>
              <h3>Additional Notes</h3>
              <textarea
                name="submissionNotes"
                rows="3"
                value={formData.submissionNotes}
                onChange={handleInputChange}
                placeholder="Add any additional information for the compliance team"
                disabled={!canSubmit}
              />
            </section>

            {message && <div className={styles.successBox}>{message}</div>}
            {verificationError && <div className={styles.errorBox}>{verificationError}</div>}

            <div className={styles.actions}>
              <button type="submit" disabled={!canSubmit || submitting || verificationLoading} className={styles.submitBtn}>
                {submitting ? 'Submitting...' : 'Pay & Submit for Review'}
              </button>
            </div>
          </form>
        </div>

        <div className={styles.rightPane}>
          <div className={styles.infoCard}>
            <h3>Why verify?</h3>
            <ul>
              <li>Unlock payouts and advanced seller analytics.</li>
              <li>Improve buyer trust with a verified badge.</li>
              <li>Access premium marketing and promotional tools.</li>
            </ul>
            <p className={styles.smallText}>Typical review time: 2-3 business days.</p>
          </div>

          {verification?.documents?.length > 0 && (
            <div className={styles.infoCard}>
              <h3>Submitted Documents</h3>
              <ul className={styles.docList}>
                {verification.documents.map((doc, index) => (
                  <li key={doc.public_id || index}>
                    <span>{doc.name || `Document ${index + 1}`}</span>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">View</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const VerificationUnavailable = () => (
  <div className={styles.unavailable}>
    <h1>Seller Verification</h1>
    <p>Online payments are not configured yet. Please contact support to enable verification payments.</p>
  </div>
);

const SellerVerification = () => {
  return stripePromise ? (
    <Elements stripe={stripePromise} options={{ appearance: { theme: 'stripe' } }}>
      <VerificationForm />
    </Elements>
  ) : (
    <VerificationUnavailable />
  );
};

export default SellerVerification;
