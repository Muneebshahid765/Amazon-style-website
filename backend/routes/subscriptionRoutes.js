import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import * as subscriptionController from '../controllers/subscriptionController.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/plans', subscriptionController.getAllPlans);
router.get('/plans/:id', subscriptionController.getPlanById);

// All routes below require authentication
router.use(protect);

// User subscription routes
router.post('/payment-intent', subscriptionController.createSubscriptionPaymentIntent);

// Admin-only routes
router.use(restrictTo('admin'));

router.post('/plans', subscriptionController.createPlan);
router.put('/plans/:id', subscriptionController.updatePlan);
router.delete('/plans/:id', subscriptionController.deletePlan);
router.patch('/plans/:id/toggle-status', subscriptionController.togglePlanStatus);

router.post('/assign', subscriptionController.assignPlanToUserAdmin);
router.put('/users/:userId/status', subscriptionController.updateUserPlanStatus);
router.post('/users/:userId/reset-usage', subscriptionController.resetUserUsage);
router.get('/users/:userId', subscriptionController.getUserSubscription);
router.get('/users', subscriptionController.getUsersWithSubscriptions);

// Statistics
router.get('/stats', subscriptionController.getSubscriptionStats);
router.get('/transactions', subscriptionController.getSubscriptionTransactions);

export default router;
