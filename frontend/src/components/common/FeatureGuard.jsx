import { useSelector } from 'react-redux';
import { hasFeatureAccess, FEATURE_CATALOG } from '../../utils/featureAccess';
import { FiLock, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import styles from './FeatureGuard.module.css';

/**
 * FeatureGuard Component
 * Wraps features that require subscription access
 * Shows upgrade prompt if user doesn't have access
 */
const FeatureGuard = ({ 
  featureKey, 
  children, 
  fallback = null,
  showUpgradePrompt = true,
  inline = false 
}) => {
  const navigate = useNavigate();
  const { subscriptionStatus } = useSelector((state) => state.seller);
  
  const hasAccess = hasFeatureAccess(subscriptionStatus, featureKey);
  const feature = FEATURE_CATALOG[featureKey];

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return fallback;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  if (inline) {
    return (
      <div className={styles.inlinePrompt}>
        <FiLock />
        <span>Upgrade to unlock {feature?.label || 'this feature'}</span>
      </div>
    );
  }

  return (
    <div className={styles.upgradePrompt}>
      <div className={styles.lockIcon}>
        <FiLock />
      </div>
      <h3>Upgrade Required</h3>
      <p>
        <strong>{feature?.label || 'This feature'}</strong> is available on higher plans.
      </p>
      {feature?.description && (
        <p className={styles.description}>{feature.description}</p>
      )}
      <button 
        className={styles.upgradeButton}
        onClick={() => navigate('/seller/subscription/upgrade')}
      >
        View Plans <FiArrowRight />
      </button>
    </div>
  );
};

export default FeatureGuard;
