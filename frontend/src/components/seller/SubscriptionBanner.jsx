import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionStatus } from '../../redux/slices/sellerSlice';
import { FiPackage, FiUpload, FiEdit2, FiTrash2, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import styles from './SubscriptionBanner.module.css';

const SubscriptionBanner = () => {
  const dispatch = useDispatch();
  const { subscriptionStatus, subscriptionLoading } = useSelector((state) => state.seller);

  useEffect(() => {
    dispatch(fetchSubscriptionStatus());
  }, [dispatch]);

  if (subscriptionLoading || !subscriptionStatus) {
    return null;
  }

  const { plan, limits, usage, remaining, activeProducts } = subscriptionStatus;

  const getStatusColor = (status) => {
    const colors = {
      active: '#10b981',
      trial: '#3b82f6',
      inactive: '#6b7280',
      grace: '#f59e0b',
      expired: '#ef4444',
      cancelled: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const getUsagePercentage = (used, limit) => {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return '#ef4444';
    if (percentage >= 70) return '#f59e0b';
    return '#10b981';
  };

  const isLimitReached = (used, limit) => used >= limit;

  return (
    <div className={styles.banner}>
      <div className={styles.planInfo}>
        <div className={styles.planHeader}>
          <h3>{plan.name}</h3>
          <span
            className={styles.statusBadge}
            style={{ backgroundColor: getStatusColor(plan.status) }}
          >
            {plan.status}
          </span>
        </div>
        <p className={styles.planTier}>Tier: {plan.tier}</p>
      </div>

      <div className={styles.limitsGrid}>
        <div className={styles.limitCard}>
          <div className={styles.limitHeader}>
            <FiPackage className={styles.icon} />
            <span>Active Products</span>
          </div>
          <div className={styles.limitValue}>
            <span className={styles.current}>{activeProducts}</span>
            <span className={styles.separator}>/</span>
            <span className={styles.max}>{limits.maxActiveProducts}</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${getUsagePercentage(activeProducts, limits.maxActiveProducts)}%`,
                backgroundColor: getUsageColor(
                  getUsagePercentage(activeProducts, limits.maxActiveProducts)
                ),
              }}
            />
          </div>
          {isLimitReached(activeProducts, limits.maxActiveProducts) && (
            <div className={styles.limitWarning}>
              <FiAlertCircle /> Limit reached
            </div>
          )}
        </div>

        <div className={styles.limitCard}>
          <div className={styles.limitHeader}>
            <FiUpload className={styles.icon} />
            <span>Uploads This Cycle</span>
          </div>
          <div className={styles.limitValue}>
            <span className={styles.current}>{usage.uploadsUsed}</span>
            <span className={styles.separator}>/</span>
            <span className={styles.max}>{limits.uploadsPerCycle}</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${getUsagePercentage(usage.uploadsUsed, limits.uploadsPerCycle)}%`,
                backgroundColor: getUsageColor(
                  getUsagePercentage(usage.uploadsUsed, limits.uploadsPerCycle)
                ),
              }}
            />
          </div>
          <div className={styles.remaining}>
            {remaining.uploads} remaining
          </div>
        </div>

        <div className={styles.limitCard}>
          <div className={styles.limitHeader}>
            <FiEdit2 className={styles.icon} />
            <span>Edits This Cycle</span>
          </div>
          <div className={styles.limitValue}>
            <span className={styles.current}>{usage.editsUsed}</span>
            <span className={styles.separator}>/</span>
            <span className={styles.max}>{limits.editsPerCycle}</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${getUsagePercentage(usage.editsUsed, limits.editsPerCycle)}%`,
                backgroundColor: getUsageColor(
                  getUsagePercentage(usage.editsUsed, limits.editsPerCycle)
                ),
              }}
            />
          </div>
          <div className={styles.remaining}>
            {remaining.edits} remaining
          </div>
        </div>

        <div className={styles.limitCard}>
          <div className={styles.limitHeader}>
            <FiTrash2 className={styles.icon} />
            <span>Deletes This Cycle</span>
          </div>
          <div className={styles.limitValue}>
            <span className={styles.current}>{usage.deletesUsed}</span>
            <span className={styles.separator}>/</span>
            <span className={styles.max}>{limits.deletesPerCycle}</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${getUsagePercentage(usage.deletesUsed, limits.deletesPerCycle)}%`,
                backgroundColor: getUsageColor(
                  getUsagePercentage(usage.deletesUsed, limits.deletesPerCycle)
                ),
              }}
            />
          </div>
          <div className={styles.remaining}>
            {remaining.deletes} remaining
          </div>
        </div>
      </div>

      {plan.renewsAt && (
        <div className={styles.renewalInfo}>
          <FiCheckCircle />
          <span>
            Renews on: {new Date(plan.renewsAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      )}
    </div>
  );
};

export default SubscriptionBanner;
