import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import * as subscriptionController from '../controllers/subscriptionController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public routes (authenticated users can view plans)
router.get('/plans', subscriptionController.getAllPlans);
router.get('/plans/:id', subscriptionController.getPlanById);

// Admin-only routes
router.use(restrictTo('admin'));

// Plan management
router.post('/plans', subscriptionController.createPlan);
router.put('/plans/:id', subscriptionController.updatePlan);
router.delete('/plans/:id', subscriptionController.deletePlan);
router.patch('/plans/:id/toggle-status', subscriptionController.togglePlanStatus);

// User subscription management
router.post('/assign', subscriptionController.assignPlanToUserAdmin);
router.put('/users/:userId/status', subscriptionController.updateUserPlanStatus);
router.post('/users/:userId/reset-usage', subscriptionController.resetUserUsage);
router.get('/users/:userId', subscriptionController.getUserSubscription);
router.get('/users', subscriptionController.getUsersWithSubscriptions);

// Statistics
router.get('/stats', subscriptionController.getSubscriptionStats);

export default router;
