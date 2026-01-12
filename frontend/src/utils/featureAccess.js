/**
 * Feature Access Control Utilities
 * Professional subscription feature management system
 */

// Feature catalog with metadata
export const FEATURE_CATALOG = {
  bulkOperations: {
    key: 'bulkOperations',
    label: 'Bulk Operations',
    description: 'Upload, edit, and manage products in bulk',
    icon: 'FiLayers',
    category: 'productivity',
  },
  advancedAnalytics: {
    key: 'advancedAnalytics',
    label: 'Advanced Analytics',
    description: 'Deep insights with custom reports and forecasting',
    icon: 'FiTrendingUp',
    category: 'analytics',
  },
  prioritySupport: {
    key: 'prioritySupport',
    label: 'Priority Support',
    description: '24/7 priority customer support',
    icon: 'FiHeadphones',
    category: 'support',
  },
  customBranding: {
    key: 'customBranding',
    label: 'Custom Branding',
    description: 'Customize your store with your brand colors and logo',
    icon: 'FiEdit3',
    category: 'branding',
  },
  apiAccess: {
    key: 'apiAccess',
    label: 'API Access',
    description: 'Full REST API access for custom integrations',
    icon: 'FiCode',
    category: 'integration',
  },
  multipleStores: {
    key: 'multipleStores',
    label: 'Multiple Stores',
    description: 'Manage multiple stores from one account',
    icon: 'FiShoppingBag',
    category: 'scaling',
  },
  advancedReporting: {
    key: 'advancedReporting',
    label: 'Advanced Reporting',
    description: 'Custom reports with export capabilities',
    icon: 'FiFileText',
    category: 'analytics',
  },
  inventoryForecasting: {
    key: 'inventoryForecasting',
    label: 'Inventory Forecasting',
    description: 'AI-powered inventory predictions',
    icon: 'FiActivity',
    category: 'analytics',
  },
  automatedMarketing: {
    key: 'automatedMarketing',
    label: 'Automated Marketing',
    description: 'Email campaigns and automated promotions',
    icon: 'FiMail',
    category: 'marketing',
  },
  dedicatedAccountManager: {
    key: 'dedicatedAccountManager',
    label: 'Dedicated Account Manager',
    description: 'Personal account manager for your business',
    icon: 'FiUser',
    category: 'support',
  },
  whitelabelOptions: {
    key: 'whitelabelOptions',
    label: 'White-label Options',
    description: 'Remove platform branding completely',
    icon: 'FiEyeOff',
    category: 'branding',
  },
  customIntegrations: {
    key: 'customIntegrations',
    label: 'Custom Integrations',
    description: 'Build custom integrations with our team',
    icon: 'FiLink',
    category: 'integration',
  },
  aiPoweredInsights: {
    key: 'aiPoweredInsights',
    label: 'AI-Powered Insights',
    description: 'Smart recommendations and predictions',
    icon: 'FiZap',
    category: 'analytics',
  },
  unlimitedTeamMembers: {
    key: 'unlimitedTeamMembers',
    label: 'Unlimited Team Members',
    description: 'Add unlimited staff to your account',
    icon: 'FiUsers',
    category: 'scaling',
  },
  advancedSecurity: {
    key: 'advancedSecurity',
    label: 'Advanced Security',
    description: 'Enhanced security features and compliance',
    icon: 'FiShield',
    category: 'security',
  },
};

/**
 * Check if user has access to a specific feature
 * @param {Object} subscriptionStatus - User's subscription status from Redux
 * @param {string} featureKey - Feature key to check
 * @returns {boolean} - Whether user has access
 */
export const hasFeatureAccess = (subscriptionStatus, featureKey) => {
  if (!subscriptionStatus || !subscriptionStatus.plan) {
    return false;
  }

  const featureAccess = subscriptionStatus.plan.featureAccess || {};
  return featureAccess[featureKey] === true;
};

/**
 * Get all features user has access to
 * @param {Object} subscriptionStatus - User's subscription status from Redux
 * @returns {Array} - Array of feature keys user has access to
 */
export const getUserFeatures = (subscriptionStatus) => {
  if (!subscriptionStatus || !subscriptionStatus.plan) {
    return [];
  }

  const featureAccess = subscriptionStatus.plan.featureAccess || {};
  return Object.keys(featureAccess).filter((key) => featureAccess[key] === true);
};

/**
 * Get feature details with access status
 * @param {Object} subscriptionStatus - User's subscription status from Redux
 * @param {string} featureKey - Feature key
 * @returns {Object} - Feature details with access status
 */
export const getFeatureDetails = (subscriptionStatus, featureKey) => {
  const feature = FEATURE_CATALOG[featureKey];
  if (!feature) return null;

  return {
    ...feature,
    hasAccess: hasFeatureAccess(subscriptionStatus, featureKey),
  };
};

/**
 * Get all features grouped by category
 * @returns {Object} - Features grouped by category
 */
export const getFeaturesByCategory = () => {
  const grouped = {};
  
  Object.values(FEATURE_CATALOG).forEach((feature) => {
    const category = feature.category || 'other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(feature);
  });

  return grouped;
};

/**
 * Check if user needs to upgrade for a feature
 * @param {Object} subscriptionStatus - User's subscription status
 * @param {string} featureKey - Feature key to check
 * @returns {Object} - Upgrade info { needsUpgrade, currentPlan, feature }
 */
export const checkUpgradeRequired = (subscriptionStatus, featureKey) => {
  const hasAccess = hasFeatureAccess(subscriptionStatus, featureKey);
  const feature = FEATURE_CATALOG[featureKey];

  return {
    needsUpgrade: !hasAccess,
    currentPlan: subscriptionStatus?.plan?.name || 'Free',
    feature: feature || null,
    hasAccess,
  };
};

export default {
  FEATURE_CATALOG,
  hasFeatureAccess,
  getUserFeatures,
  getFeatureDetails,
  getFeaturesByCategory,
  checkUpgradeRequired,
};
