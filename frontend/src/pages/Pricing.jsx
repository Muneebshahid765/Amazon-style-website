import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiCheck, FiX, FiZap, FiTrendingUp, FiShield } from 'react-icons/fi';
import api from '../services/api';
import styles from './Pricing.module.css';

const Pricing = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');

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
            
            return (
              <div
                key={plan._id}
                className={`${styles.planCard} ${isPopular ? styles.popular : ''}`}
                style={{ '--tier-color': getTierColor(plan.tier) }}
              >
                {isPopular && <div className={styles.popularBadge}>Most Popular</div>}
                
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
                  style={isPopular ? { backgroundColor: getTierColor(plan.tier) } : {}}
                >
                  {plan.priceMonthly === 0 ? 'Start Free' : 'Get Started'}
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
