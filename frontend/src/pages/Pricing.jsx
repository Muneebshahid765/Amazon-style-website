import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiCheck, FiZap, FiTrendingUp, FiShield } from 'react-icons/fi';
import api from '../services/api';
import styles from './Pricing.module.css';

const normalizeDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const isDiscountActive = (discount = {}) => {
  if (!discount?.isActive || !discount.value) return false;
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDate = normalizeDateOnly(discount.startsAt);
  const endDate = normalizeDateOnly(discount.endsAt);
  if (startDate && startDate > todayDate) return false;
  if (endDate && endDate < todayDate) return false;
  return true;
};

const calculateDiscountedPrice = (price, discount) => {
  if (!isDiscountActive(discount)) return Number(price || 0);
  let final = discount.type === 'flat'
    ? Number(price || 0) - Number(discount.value || 0)
    : Number(price || 0) - (Number(price || 0) * Number(discount.value || 0)) / 100;
  if (discount.minPrice) {
    final = Math.max(final, Number(discount.minPrice));
  }
  return Number(final.toFixed(2));
};

const Pricing = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle] = useState('monthly');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/subscriptions/plans');
      setPlans(data.plans.filter(p => p.isActive).sort((a, b) => a.priceMonthly - b.priceMonthly));
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan) => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    
    const isSeller = user?.role === 'seller' || user?.accountType === 'seller';
    if (!isSeller) {
      navigate('/register');
      return;
    }

    navigate('/seller', { state: { selectedPlan: plan } });
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

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading plans...</p>
      </div>
    );
  }

  return (
    <div className={styles.pricingContainer}>
      <div className={styles.hero}>
        <span className={styles.badge}>Pricing Plans</span>
        <h1>Choose the perfect plan for your business</h1>
        <p>Start free and scale as you grow. All plans include our core features.</p>
      </div>

      <div className={styles.plansWrapper}>
        <div className={styles.plansGrid}>
          {plans.map((plan) => {
            const Icon = getTierIcon(plan.tier);
            const isPopular = plan.tier === 'growth' || plan.tier === 'pro';
            const discountedPrice = calculateDiscountedPrice(plan.priceMonthly, plan.discount);
            const showDiscount = isDiscountActive(plan.discount) && discountedPrice !== plan.priceMonthly;
            
            return (
              <div
                key={plan._id}
                className={`${styles.planCard} ${isPopular ? styles.popular : ''}`}
                style={{ '--tier-color': getTierColor(plan.tier) }}
              >
                {isPopular && <div className={styles.popularBadge}>Most Popular</div>}

                <div className={styles.planTop}>
                  <div className={styles.tierPill}>{plan.tier}</div>
                  <div className={styles.planIcon} style={{ backgroundColor: `${getTierColor(plan.tier)}15` }}>
                    <Icon style={{ color: getTierColor(plan.tier) }} />
                  </div>
                  <h3>{plan.name}</h3>
                  <p className={styles.planDescription}>{plan.description}</p>
                </div>

                <div className={styles.priceCluster}>
                  {showDiscount && (
                    <span className={styles.discountChip}>
                      {plan.discount?.label ||
                        (plan.discount?.type === 'flat'
                          ? `-$${Number(plan.discount.value).toFixed(0)}`
                          : `-${plan.discount?.value}%`)}
                    </span>
                  )}
                  <div className={styles.priceRow}>
                    <span className={styles.currency}>$</span>
                    <span className={styles.amount}>{discountedPrice}</span>
                    <span className={styles.period}>/month</span>
                  </div>
                  {showDiscount && (
                    <div className={styles.originalRow}>
                      <span className={styles.originalPrice}>${Number(plan.priceMonthly).toFixed(2)}</span>
                      {plan.discount?.startsAt && plan.discount?.endsAt && (
                        <span className={styles.discountDates}>
                          {plan.discount.startsAt.slice(0, 10)} – {plan.discount.endsAt.slice(0, 10)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <ul className={styles.featureList}>
                  <li>
                    <FiCheck className={styles.checkIcon} />
                    <div className={styles.featureRow}>
                      <span className={styles.featureLabel}>Active Products</span>
                      <strong className={styles.featureValue}>{plan.limits.maxActiveProducts}</strong>
                    </div>
                  </li>
                  <li>
                    <FiCheck className={styles.checkIcon} />
                    <div className={styles.featureRow}>
                      <span className={styles.featureLabel}>Uploads / Month</span>
                      <strong className={styles.featureValue}>{plan.limits.uploadsPerCycle}</strong>
                    </div>
                  </li>
                  <li>
                    <FiCheck className={styles.checkIcon} />
                    <div className={styles.featureRow}>
                      <span className={styles.featureLabel}>Edits / Month</span>
                      <strong className={styles.featureValue}>{plan.limits.editsPerCycle}</strong>
                    </div>
                  </li>
                  <li>
                    <FiCheck className={styles.checkIcon} />
                    <div className={styles.featureRow}>
                      <span className={styles.featureLabel}>Deletes / Month</span>
                      <strong className={styles.featureValue}>{plan.limits.deletesPerCycle}</strong>
                    </div>
                  </li>
                </ul>

                {plan.features?.length > 0 && (
                  <div className={styles.extrasBlock}>
                    <h4>Plan Extras</h4>
                    <div className={styles.extraBadges}>
                      {plan.features.map((feature, idx) => (
                        <span key={idx} className={styles.extraBadge}>
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  className={`${styles.selectButton} ${isPopular ? styles.selectButtonPrimary : ''}`}
                  onClick={() => handleSelectPlan(plan)}
                  style={isPopular ? { backgroundColor: getTierColor(plan.tier) } : {}}
                >
                  {plan.priceMonthly === 0 ? 'Start Free' : 'Buy Now'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.faq}>
        <h2>Frequently Asked Questions</h2>
        <div className={styles.faqGrid}>
          <div className={styles.faqItem}>
            <h3>Can I change plans later?</h3>
            <p>Yes, you can upgrade or downgrade your plan at any time from your seller dashboard.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>What happens when I reach my limit?</h3>
            <p>You'll be notified when approaching limits. Upgrade anytime to increase your quotas.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>Is there a free trial?</h3>
            <p>Yes! Start with our free plan and upgrade when you're ready to scale.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>Do you offer refunds?</h3>
            <p>We offer a 30-day money-back guarantee on all paid plans.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
