import { useSelector } from 'react-redux';
import { hasFeatureAccess, getUserFeatures, getFeatureDetails, checkUpgradeRequired } from '../utils/featureAccess';

/**
 * Custom hook for feature access control
 * Provides easy access to subscription-based feature checks
 */
export const useFeatureAccess = () => {
  const { subscriptionStatus } = useSelector((state) => state.seller);

  return {
    hasFeature: (featureKey) => hasFeatureAccess(subscriptionStatus, featureKey),
    userFeatures: getUserFeatures(subscriptionStatus),
    getFeature: (featureKey) => getFeatureDetails(subscriptionStatus, featureKey),
    checkUpgrade: (featureKey) => checkUpgradeRequired(subscriptionStatus, featureKey),
    subscriptionStatus,
  };
};

export default useFeatureAccess;
