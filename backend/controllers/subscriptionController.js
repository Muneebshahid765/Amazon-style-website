import SubscriptionPlan from '../models/SubscriptionPlan.js';
import User from '../models/User.js';
import SubscriptionTransaction from '../models/SubscriptionTransaction.js';
import { assignPlanToUser, resetUsageCounters } from '../utils/subscriptionHelper.js';
import { sendEmail } from '../utils/sendEmail.js';
import { stripeClient } from '../config/stripe.js';

const BILLING_CYCLES = ['monthly', 'yearly'];

const normalizeDiscountInput = (discount = {}) => {
  if (!discount || typeof discount !== 'object') {
    return {
      isActive: false,
      type: 'percentage',
      value: 0,
      label: '',
      startsAt: null,
      endsAt: null,
      minPrice: 0,
    };
  }

  return {
    isActive: Boolean(discount.isActive),
    type: ['percentage', 'flat'].includes(discount.type) ? discount.type : 'percentage',
    value: Number(discount.value) || 0,
    label: discount.label?.trim() || '',
    startsAt: discount.startsAt || null,
    endsAt: discount.endsAt || null,
    minPrice: Number(discount.minPrice) || 0,
  };
};

const isDiscountCurrentlyActive = (discount = {}) => {
  if (!discount?.isActive || !discount.value) return false;
  const now = new Date();
  if (discount.startsAt && new Date(discount.startsAt) > now) return false;
  if (discount.endsAt && new Date(discount.endsAt) < now) return false;
  return true;
};

const applyPlanDiscount = (planPrice, discount) => {
  if (!isDiscountCurrentlyActive(discount)) {
    return planPrice;
  }

  let finalPrice = planPrice;
  if (discount.type === 'flat') {
    finalPrice = planPrice - discount.value;
  } else {
    finalPrice = planPrice - (planPrice * discount.value) / 100;
  }

  if (discount.minPrice) {
    finalPrice = Math.max(finalPrice, discount.minPrice);
  }

  return Number(finalPrice.toFixed(2));
};

const calculatePlanCharge = (plan, billingCycle) => {
  const monthlyPrice = Number(plan.priceMonthly || 0);
  const effectiveMonthly = applyPlanDiscount(monthlyPrice, plan.discount);
  if (billingCycle === 'yearly') {
    const yearly = effectiveMonthly * 12 * 0.83; // 17% savings
    return { amount: Number(yearly.toFixed(2)), durationDays: (plan.durationDays || 30) * 12 };
  }
  return { amount: Number(effectiveMonthly.toFixed(2)), durationDays: plan.durationDays || 30 };
};

const activatePlanForUser = async ({ user, plan, billingCycle }) => {
  const { amount, durationDays } = calculatePlanCharge(plan, billingCycle);
  const now = new Date();
  const renewDate = new Date(now);
  renewDate.setDate(renewDate.getDate() + durationDays);

  user.currentPlan = plan._id;
  user.planStatus = 'active';
  user.planAssignedAt = now;
  user.planCycleStartedAt = now;
  user.planRenewsAt = renewDate;
  user.planUsage = { uploadsUsed: 0, editsUsed: 0, deletesUsed: 0 };
  await user.save();

  return { renewsAt: renewDate, totalDue: amount };
};

const sendPlanReceiptEmail = async ({ user, plan, billingCycle, totalDue, renewsAt }) => {
  if (!user?.email) return;
  await sendEmail({
    to: user.email,
    subject: `Your ${plan.name} plan is active`,
    html: `
      <h2>Thanks for upgrading!</h2>
      <p>Hello ${user.firstName || user.email},</p>
      <p>Your <strong>${plan.name}</strong> plan is now active.</p>
      <ul>
        <li>Billing cycle: <strong>${billingCycle}</strong></li>
        <li>Total paid today: <strong>$${totalDue.toFixed(2)}</strong></li>
        <li>Renews on: <strong>${renewsAt?.toLocaleDateString()}</strong></li>
      </ul>
      <p>You can cancel or change your plan anytime from your dashboard.</p>
    `,
  });
};

// ==================== SUBSCRIPTION PLANS CRUD ====================

/**
 * Get all subscription plans
 */
export const getAllPlans = async (req, res, next) => {
  try {
    const { isActive, tier } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (tier) {
      query.tier = tier;
    }

    const plans = await SubscriptionPlan.find(query)
      .sort({ priceMonthly: 1 })
      .lean();

    res.json({ plans });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single subscription plan by ID
 */
export const getPlanById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findById(id);

    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    res.json({ plan });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new subscription plan (Admin only)
 */
export const createPlan = async (req, res, next) => {
  try {
    const planData = {
      ...req.body,
      createdBy: req.user._id,
      updatedBy: req.user._id,
      discount: normalizeDiscountInput(req.body.discount),
    };

    // Validate required fields
    if (!planData.name || !planData.tier) {
      return res.status(400).json({ message: 'Plan name and tier are required' });
    }

    // Check if plan with same name exists
    const existingPlan = await SubscriptionPlan.findOne({ name: planData.name });
    if (existingPlan) {
      return res.status(409).json({ message: 'A plan with this name already exists' });
    }

    const plan = await SubscriptionPlan.create(planData);

    res.status(201).json({ 
      message: 'Subscription plan created successfully',
      plan 
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Update subscription plan (Admin only)
 */
export const updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user._id,
    };

    // Don't allow changing slug directly
    delete updateData.slug;
    if (Object.prototype.hasOwnProperty.call(req.body, 'discount')) {
      updateData.discount = normalizeDiscountInput(req.body.discount);
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    res.json({ 
      message: 'Subscription plan updated successfully',
      plan 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete subscription plan (Admin only)
 */
export const deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if any users are currently using this plan
    const usersWithPlan = await User.countDocuments({ currentPlan: id });
    
    if (usersWithPlan > 0) {
      return res.status(400).json({ 
        message: `Cannot delete plan. ${usersWithPlan} user(s) are currently subscribed to this plan.`,
        usersCount: usersWithPlan
      });
    }

    const plan = await SubscriptionPlan.findByIdAndDelete(id);

    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    res.json({ message: 'Subscription plan deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle plan active status (Admin only)
 */
export const togglePlanStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findById(id);

    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    plan.isActive = !plan.isActive;
    plan.updatedBy = req.user._id;
    await plan.save();

    res.json({ 
      message: `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`,
      plan 
    });
  } catch (error) {
    next(error);
  }
};

// ==================== USER SUBSCRIPTION MANAGEMENT ====================

/**
 * Assign plan to user (Admin only)
 */
export const createSubscriptionPaymentIntent = async (req, res, next) => {
  try {
    if (!stripeClient) {
      return res.status(500).json({ message: 'Stripe is not configured on the server.' });
    }

    const { planId, billingCycle = 'monthly' } = req.body;

    if (!planId) {
      return res.status(400).json({ message: 'Plan ID is required' });
    }

    if (!BILLING_CYCLES.includes(billingCycle)) {
      return res.status(400).json({ message: 'Invalid billing cycle selected' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ message: 'Subscription plan not available' });
    }

    const { amount } = calculatePlanCharge(plan, billingCycle);

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'pkr',
      metadata: {
        userId: user._id.toString(),
        planId: plan._id.toString(),
        billingCycle,
        intentType: 'subscription',
      },
      receipt_email: user.email,
      description: `${plan.name} subscription (${billingCycle})`,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
    });
  } catch (error) {
    next(error);
  }
};


export const assignPlanToUserAdmin = async (req, res, next) => {
  try {
    const { userId, planId } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({ message: 'User ID and Plan ID are required' });
    }

    const user = await assignPlanToUser(userId, planId, req.user._id);

    res.json({ 
      message: 'Subscription plan assigned successfully',
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        currentPlan: user.currentPlan,
        planStatus: user.planStatus,
        planAssignedAt: user.planAssignedAt,
        planRenewsAt: user.planRenewsAt,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user's plan status (Admin only)
 */
export const updateUserPlanStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { planStatus } = req.body;

    const validStatuses = ['inactive', 'trial', 'active', 'grace', 'expired', 'cancelled'];
    if (!validStatuses.includes(planStatus)) {
      return res.status(400).json({ 
        message: 'Invalid plan status',
        validStatuses 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.planStatus = planStatus;
    await user.save();

    res.json({ 
      message: 'User plan status updated successfully',
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        planStatus: user.planStatus,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset user's usage counters (Admin only)
 */
export const resetUserUsage = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await resetUsageCounters(userId);

    res.json({ 
      message: 'User usage counters reset successfully',
      usage: user.planUsage,
      cycleStartedAt: user.planCycleStartedAt,
      renewsAt: user.planRenewsAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's subscription details (Admin only)
 */
export const getUserSubscription = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate('currentPlan')
      .select('firstName lastName email currentPlan planStatus planAssignedAt planCycleStartedAt planRenewsAt planUsage');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        plan: user.currentPlan,
        planStatus: user.planStatus,
        planAssignedAt: user.planAssignedAt,
        planCycleStartedAt: user.planCycleStartedAt,
        planRenewsAt: user.planRenewsAt,
        usage: user.planUsage,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users with their subscription info (Admin only)
 */
export const getUsersWithSubscriptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, planStatus, tier, search } = req.query;
    const query = { role: { $in: ['seller', 'user'] } };

    if (planStatus) {
      query.planStatus = planStatus;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .populate('currentPlan')
      .select('firstName lastName email role accountType currentPlan planStatus planAssignedAt planRenewsAt planUsage')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ planAssignedAt: -1 });

    // Filter by tier if specified
    let filteredUsers = users;
    if (tier) {
      filteredUsers = users.filter(user => user.currentPlan?.tier === tier);
    }

    const total = await User.countDocuments(query);

    res.json({
      users: filteredUsers,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get subscription statistics (Admin only)
 */
export const getSubscriptionTransactions = async (req, res, next) => {
  try {
    const { status, userId, limit = 50, page = 1 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (userId) query.user = userId;

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      SubscriptionTransaction.find(query)
        .populate('user', 'firstName lastName email')
        .populate('plan', 'name tier priceMonthly')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      SubscriptionTransaction.countDocuments(query),
    ]);

    res.json({
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionStats = async (req, res, next) => {
  try {
    const [
      totalPlans,
      activePlans,
      totalSubscribedUsers,
      usersByStatus,
      usersByTier,
    ] = await Promise.all([
      SubscriptionPlan.countDocuments(),
      SubscriptionPlan.countDocuments({ isActive: true }),
      User.countDocuments({ currentPlan: { $exists: true, $ne: null } }),
      User.aggregate([
        { $match: { currentPlan: { $exists: true, $ne: null } } },
        { $group: { _id: '$planStatus', count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { currentPlan: { $exists: true, $ne: null } } },
        {
          $lookup: {
            from: 'subscriptionplans',
            localField: 'currentPlan',
            foreignField: '_id',
            as: 'planDetails',
          },
        },
        { $unwind: '$planDetails' },
        { $group: { _id: '$planDetails.tier', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      plans: {
        total: totalPlans,
        active: activePlans,
      },
      users: {
        total: totalSubscribedUsers,
        byStatus: usersByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byTier: usersByTier.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const applyBulkDiscount = async (req, res, next) => {
  try {
    const { planIds = [], applyToAll = false, discount } = req.body || {};

    if (!applyToAll && (!Array.isArray(planIds) || planIds.length === 0)) {
      return res.status(400).json({ message: 'Select at least one subscription plan' });
    }

    const normalizedDiscount = normalizeDiscountInput(discount);
    const query = applyToAll ? {} : { _id: { $in: planIds } };

    const result = await SubscriptionPlan.updateMany(query, {
      discount: normalizedDiscount,
      updatedBy: req.user._id,
    });

    const modified =
      result.modifiedCount ??
      result.nModified ??
      result.matchedCount ??
      0;

    const updatedPlans = await SubscriptionPlan.find(query).sort({ priceMonthly: 1 });

    res.json({
      message: `Discount applied to ${modified} plan${modified === 1 ? '' : 's'}`,
      plans: updatedPlans,
    });
  } catch (error) {
    next(error);
  }
};
