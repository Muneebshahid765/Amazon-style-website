import { 
  FiZap, FiTrendingUp, FiShield, FiCode, FiShoppingBag, 
  FiFileText, FiActivity, FiMail, FiUser, FiEyeOff, 
  FiLink, FiHeadphones, FiEdit3, FiLayers, FiUsers 
} from 'react-icons/fi';
import styles from './FeatureBadge.module.css';

const ICON_MAP = {
  FiLayers,
  FiTrendingUp,
  FiHeadphones,
  FiEdit3,
  FiCode,
  FiShoppingBag,
  FiFileText,
  FiActivity,
  FiMail,
  FiUser,
  FiEyeOff,
  FiLink,
  FiZap,
  FiUsers,
  FiShield,
};

const FeatureBadge = ({ feature, hasAccess = true, compact = false }) => {
  if (!feature) return null;

  const Icon = ICON_MAP[feature.icon] || FiZap;

  if (compact) {
    return (
      <div className={`${styles.compactBadge} ${!hasAccess ? styles.locked : ''}`}>
        <Icon />
        <span>{feature.label}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.featureBadge} ${!hasAccess ? styles.locked : ''}`}>
      <div className={styles.iconWrapper}>
        <Icon />
      </div>
      <div className={styles.content}>
        <div className={styles.label}>{feature.label}</div>
        {feature.description && (
          <div className={styles.description}>{feature.description}</div>
        )}
      </div>
      {!hasAccess && (
        <div className={styles.lockBadge}>
          <FiShield />
        </div>
      )}
    </div>
  );
};

export default FeatureBadge;
