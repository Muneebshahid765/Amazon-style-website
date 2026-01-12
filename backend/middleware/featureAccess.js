import User from '../models/User.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';

/**
 * Middleware to check if user has access to a specific feature
 * @param {string} featureKey - The feature key to check (e.g., 'bulkOperations')
 */
export const requireFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      const userId = req.user._id;
      
      // Fetch user with populated plan
      const user = await User.findById(userId).populate('currentPlan');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if user has a plan
      if (!user.currentPlan) {
        return res.status(403).json({ 
          message: 'No active subscription plan',
          featureRequired: featureKey,
          upgradeRequired: true
        });
      }

      // Check if plan has the required feature
      const featureAccess = user.currentPlan.featureAccess || {};
      
      if (!featureAccess[featureKey]) {
        return res.status(403).json({ 
          message: `This feature requires a higher subscription plan`,
          featureRequired: featureKey,
          currentPlan: user.currentPlan.name,
          upgradeRequired: true
        });
      }

      // Feature access granted
      next();
    } catch (error) {
      console.error('Feature access check error:', error);
      return res.status(500).json({ message: 'Failed to verify feature access' });
    }
  };
};

/**
 * Middleware to check multiple features (user needs at least one)
 */
export const requireAnyFeature = (featureKeys = []) => {
  return async (req, res, next) => {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId).populate('currentPlan');
      
      if (!user || !user.currentPlan) {
        return res.status(403).json({ 
          message: 'No active subscription plan',
          upgradeRequired: true
        });
      }

      const featureAccess = user.currentPlan.featureAccess || {};
      const hasAnyFeature = featureKeys.some(key => featureAccess[key] === true);
      
      if (!hasAnyFeature) {
        return res.status(403).json({ 
          message: 'This feature requires a higher subscription plan',
          featuresRequired: featureKeys,
          upgradeRequired: true
        });
      }

      next();
    } catch (error) {
      console.error('Feature access check error:', error);
      return res.status(500).json({ message: 'Failed to verify feature access' });
    }
  };
};

/**
 * Helper function to check feature access programmatically
 */
export const hasFeatureAccess = async (userId, featureKey) => {
  try {
    const user = await User.findById(userId).populate('currentPlan');
    if (!user || !user.currentPlan) return false;
    
    const featureAccess = user.currentPlan.featureAccess || {};
    return featureAccess[featureKey] === true;
  } catch (error) {
    console.error('Feature access check error:', error);
    return false;
  }
};

export default {
  requireFeature,
  requireAnyFeature,
  hasFeatureAccess,
};
