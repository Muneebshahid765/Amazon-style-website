import SubscriptionPlan from '../models/SubscriptionPlan.js';
import User from '../models/User.js';

const defaultFeatureAccess = {
  bulkOperations: false,
  advancedAnalytics: false,
  prioritySupport: false,
  customBranding: false,
  apiAccess: false,
  multipleStores: false,
  advancedReporting: false,
  inventoryForecasting: false,
  automatedMarketing: false,
  dedicatedAccountManager: false,
  whitelabelOptions: false,
  customIntegrations: false,
  aiPoweredInsights: false,
  unlimitedTeamMembers: false,
  advancedSecurity: false,
};

/**
 * Get user's current subscription plan with limits
 */
export const getUserPlanWithLimits = async (userId) => {
  const user = await User.findById(userId).populate('currentPlan');
  
  if (!user) {
    throw new Error('User not found');
  }

  // If no plan assigned, return default free tier limits
  if (!user.currentPlan) {
    return {
      planName: 'No Plan',
      tier: 'free',
      limits: {
        maxActiveProducts: 5,
        uploadsPerCycle: 5,
        editsPerCycle: 10,
        deletesPerCycle: 5,
      },
      usage: {
        uploadsUsed: user.planUsage?.uploadsUsed || 0,
        editsUsed: user.planUsage?.editsUsed || 0,
        deletesUsed: user.planUsage?.deletesUsed || 0,
      },
      planStatus: user.planStatus || 'inactive',
      featureAccess: { ...defaultFeatureAccess },
    };
  }

  return {
    planId: user.currentPlan._id,
    planName: user.currentPlan.name,
    tier: user.currentPlan.tier,
    limits: user.currentPlan.limits,
    featureAccess: user.currentPlan.featureAccess || { ...defaultFeatureAccess },
    usage: {
      uploadsUsed: user.planUsage?.uploadsUsed || 0,
      editsUsed: user.planUsage?.editsUsed || 0,
      deletesUsed: user.planUsage?.deletesUsed || 0,
    },
    planStatus: user.planStatus,
    planAssignedAt: user.planAssignedAt,
    planCycleStartedAt: user.planCycleStartedAt,
    planRenewsAt: user.planRenewsAt,
  };
};

/**
 * Check if user can perform an action based on their plan limits
 */
export const checkPlanLimit = async (userId, actionType) => {
  const user = await User.findById(userId).populate('currentPlan');
  
  if (!user) {
    throw new Error('User not found');
  }

  // Admin users have unlimited access
  if (user.role === 'admin') {
    return { allowed: true, reason: 'Admin has unlimited access' };
  }

  // Check if plan is active
  if (user.planStatus !== 'active' && user.planStatus !== 'trial') {
    return {
      allowed: false,
      reason: 'Your subscription plan is not active. Please contact admin or upgrade your plan.',
    };
  }

  const plan = user.currentPlan;
  const usage = user.planUsage || { uploadsUsed: 0, editsUsed: 0, deletesUsed: 0 };

  // If no plan, use default free tier limits
  const limits = plan?.limits || {
    maxActiveProducts: 5,
    uploadsPerCycle: 5,
    editsPerCycle: 10,
    deletesPerCycle: 5,
  };

  switch (actionType) {
    case 'upload':
      if (usage.uploadsUsed >= limits.uploadsPerCycle) {
        return {
          allowed: false,
          reason: `Upload limit reached (${limits.uploadsPerCycle}/${limits.uploadsPerCycle}). Upgrade your plan for more uploads.`,
          limit: limits.uploadsPerCycle,
          used: usage.uploadsUsed,
        };
      }
      break;

    case 'edit':
      if (usage.editsUsed >= limits.editsPerCycle) {
        return {
          allowed: false,
          reason: `Edit limit reached (${limits.editsPerCycle}/${limits.editsPerCycle}). Upgrade your plan for more edits.`,
          limit: limits.editsPerCycle,
          used: usage.editsUsed,
        };
      }
      break;

    case 'delete':
      if (usage.deletesUsed >= limits.deletesPerCycle) {
        return {
          allowed: false,
          reason: `Delete limit reached (${limits.deletesPerCycle}/${limits.deletesPerCycle}). Upgrade your plan for more deletes.`,
          limit: limits.deletesPerCycle,
          used: usage.deletesUsed,
        };
      }
      break;

    default:
      return { allowed: true };
  }

  return { allowed: true };
};

/**
 * Increment usage counter for a specific action
 */
export const incrementUsage = async (userId, actionType) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  if (!user.planUsage) {
    user.planUsage = { uploadsUsed: 0, editsUsed: 0, deletesUsed: 0 };
  }

  switch (actionType) {
    case 'upload':
      user.planUsage.uploadsUsed += 1;
      break;
    case 'edit':
      user.planUsage.editsUsed += 1;
      break;
    case 'delete':
      user.planUsage.deletesUsed += 1;
      break;
  }

  await user.save();
  return user.planUsage;
};

/**
 * Reset usage counters (called when cycle renews)
 */
export const resetUsageCounters = async (userId) => {
  const user = await User.findById(userId).populate('currentPlan');
  
  if (!user) {
    throw new Error('User not found');
  }

  user.planUsage = { uploadsUsed: 0, editsUsed: 0, deletesUsed: 0 };
  
  // Update cycle dates
  const now = new Date();
  user.planCycleStartedAt = now;
  
  if (user.currentPlan) {
    const renewDate = new Date(now);
    renewDate.setDate(renewDate.getDate() + (user.currentPlan.durationDays || 30));
    user.planRenewsAt = renewDate;
  }

  await user.save();
  return user;
};

/**
 * Check if cycle needs to be renewed and reset counters
 */
export const checkAndResetCycle = async (userId) => {
  const user = await User.findById(userId).populate('currentPlan');
  
  if (!user || !user.planRenewsAt) {
    return false;
  }

  const now = new Date();
  
  // If renewal date has passed, reset the cycle
  if (now >= user.planRenewsAt) {
    await resetUsageCounters(userId);
    return true;
  }

  return false;
};

/**
 * Assign a subscription plan to a user
 */
export const assignPlanToUser = async (userId, planId, assignedBy) => {
  const user = await User.findById(userId);
  const plan = await SubscriptionPlan.findById(planId);

  if (!user) {
    throw new Error('User not found');
  }

  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  const now = new Date();
  const renewDate = new Date(now);
  renewDate.setDate(renewDate.getDate() + plan.durationDays);

  user.currentPlan = plan._id;
  user.planStatus = 'active';
  user.planAssignedAt = now;
  user.planCycleStartedAt = now;
  user.planRenewsAt = renewDate;
  user.planUsage = { uploadsUsed: 0, editsUsed: 0, deletesUsed: 0 };

  await user.save();

  return user;
};

/**
 * Get remaining quota for user
 */
export const getRemainingQuota = async (userId) => {
  const planInfo = await getUserPlanWithLimits(userId);
  
  return {
    uploads: {
      limit: planInfo.limits.uploadsPerCycle,
      used: planInfo.usage.uploadsUsed,
      remaining: Math.max(0, planInfo.limits.uploadsPerCycle - planInfo.usage.uploadsUsed),
    },
    edits: {
      limit: planInfo.limits.editsPerCycle,
      used: planInfo.usage.editsUsed,
      remaining: Math.max(0, planInfo.limits.editsPerCycle - planInfo.usage.editsUsed),
    },
    deletes: {
      limit: planInfo.limits.deletesPerCycle,
      used: planInfo.usage.deletesUsed,
      remaining: Math.max(0, planInfo.limits.deletesPerCycle - planInfo.usage.deletesUsed),
    },
    maxActiveProducts: planInfo.limits.maxActiveProducts,
  };
};
