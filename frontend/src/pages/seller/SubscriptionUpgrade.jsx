import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FiCheck, FiZap, FiTrendingUp, FiShield, FiArrowRight } from 'react-icons/fi';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../../services/api';
import { fetchSubscriptionStatus } from '../../redux/slices/sellerSlice';
import PlanCheckoutModal from '../../components/subscriptions/PlanCheckoutModal.jsx';
import styles from './SubscriptionUpgrade.module.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const SubscriptionUpgrade = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { subscriptionStatus } = useSelector((state) => state.seller);
  const { user } = useSelector((state) => state.auth);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    fetchPlans();
    dispatch(fetchSubscriptionStatus());
  }, [dispatch]);

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/subscriptions/plans');
      setPlans(data.plans.filter(p => p.isActive).sort((a, b) => a.priceMonthly - b.priceMonthly));
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (subscriptionStatus?.plan?._id === plan._id) return;
    setCheckoutPlan(plan);
    setShowCheckout(true);
  };

  const handleConfirmPurchase = async ({ billingCycle, payment, notes, stripe, elements }) => {
    if (!checkoutPlan || !stripe || !elements) return;
    setUpgrading(true);
    try {
      const { data: intentData } = await api.post('/subscriptions/payment-intent', {
        planId: checkoutPlan._id,
        billingCycle,
      });

      const cardElement = elements.getElement(CardElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        intentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: payment.fullName,
              email: payment.email,
              address: {
                country: payment.country,
                line1: payment.address,
              },
            },
          },
        }
      );

      if (error) {
        toast.error(error.message || 'Payment failed');
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        toast.success('Subscription activated successfully!');
        setCheckoutPlan(null);
        setShowCheckout(false);
        dispatch(fetchSubscriptionStatus());
        fetchPlans();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process payment');
    } finally {
      setUpgrading(false);
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'free':
        return FiShield;
      case 'starter':
        return FiZap;
      case 'growth':
      case 'pro':
        return FiTrendingUp;
      case 'enterprise':
        return FiShield;
      default:
        return FiShield;
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      free: '#6b7280',
      starter: '#3b82f6',
      growth: '#8b5cf6',
      pro: '#f59e0b',
      enterprise: '#ef4444',
    };
    return colors[tier] || '#6b7280';
  };

  const isCurrentPlan = (planId) => {
    return subscriptionStatus?.plan?._id === planId;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading plans...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Upgrade Your Plan</h1>
        <p>Choose a plan that fits your business needs and scale as you grow</p>
      </div>

      {subscriptionStatus && (
        <div className={styles.currentPlan}>
          <div className={styles.currentPlanContent}>
            <h3>Current Plan: {subscriptionStatus.plan.name}</h3>
            <div className={styles.usageStats}>
              <div className={styles.usageStat}>
                <span>Products: {subscriptionStatus.activeProducts}/{subscriptionStatus.limits.maxActiveProducts}</span>
              </div>
              <div className={styles.usageStat}>
                <span>Uploads: {subscriptionStatus.usage.uploadsUsed}/{subscriptionStatus.limits.uploadsPerCycle}</span>
              </div>
              <div className={styles.usageStat}>
                <span>Edits: {subscriptionStatus.usage.editsUsed}/{subscriptionStatus.limits.editsPerCycle}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.plansGrid}>
        {plans.map((plan) => {
          const Icon = getTierIcon(plan.tier);
          const isPopular = plan.tier === 'growth' || plan.tier === 'pro';
          const isCurrent = isCurrentPlan(plan._id);
          
          return (
            <div
              key={plan._id}
              className={`${styles.planCard} ${isPopular ? styles.popular : ''} ${isCurrent ? styles.current : ''}`}
              style={{ '--tier-color': getTierColor(plan.tier) }}
            >
              {isPopular && <div className={styles.popularBadge}>Most Popular</div>}
              {isCurrent && <div className={styles.currentBadge}>Current Plan</div>}
              
              <div className={styles.planHeader}>
                <div className={styles.planIcon} style={{ backgroundColor: `${getTierColor(plan.tier)}15` }}>
                  <Icon style={{ color: getTierColor(plan.tier) }} />
                </div>
                <h3>{plan.name}</h3>
                <p className={styles.planDescription}>{plan.description}</p>
              </div>

              <div className={styles.planPrice}>
                <span className={styles.currency}>$</span>
                <span className={styles.amount}>{plan.priceMonthly}</span>
                <span className={styles.period}>/month</span>
              </div>

              <button
                className={`${styles.selectButton} ${isPopular ? styles.selectButtonPrimary : ''}`}
                onClick={() => handleSelectPlan(plan)}
                disabled={isCurrent || upgrading}
                style={isPopular && !isCurrent ? { backgroundColor: getTierColor(plan.tier) } : {}}
              >
                {isCurrent ? 'Current Plan' : 'Upgrade Now'}
                {!isCurrent && <FiArrowRight />}
              </button>

              <div className={styles.planLimits}>
                <h4>What's included:</h4>
                <ul>
                  <li>
                    <FiCheck className={styles.checkIcon} />
                    <span><strong>{plan.limits.maxActiveProducts}</strong> Active Products</span>
                  </li>
                  <li>
                    <FiCheck className={styles.checkIcon} />
                    <span><strong>{plan.limits.uploadsPerCycle}</strong> Uploads per month</span>
                  </li>
                  <li>
                    <FiCheck className={styles.checkIcon} />
                    <span><strong>{plan.limits.editsPerCycle}</strong> Edits per month</span>
                  </li>
                  <li>
                    <FiCheck className={styles.checkIcon} />
                    <span><strong>{plan.limits.deletesPerCycle}</strong> Deletes per month</span>
                  </li>
                </ul>
              </div>

              {plan.features && plan.features.length > 0 && (
                <div className={styles.planFeatures}>
                  <h4>Features:</h4>
                  <ul>
                    {plan.features.map((feature, idx) => (
                      <li key={idx}>
                        <FiCheck className={styles.checkIcon} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showCheckout && (
        <Elements stripe={stripePromise}>
          <PlanCheckoutModal
            isOpen={showCheckout}
            plan={checkoutPlan}
            onClose={() => setShowCheckout(false)}
            onConfirm={handleConfirmPurchase}
            loading={upgrading}
            user={user}
          />
        </Elements>
      )}
    </div>
  );
};

export default SubscriptionUpgrade;
