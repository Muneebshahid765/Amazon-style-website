import express from 'express';
import { restrictTo, protect } from '../middleware/auth.js';
import {
  getOverviewStats,
  getRevenueAnalytics,
  getSalesAnalytics,
  getCustomerAnalytics,
  getProductPerformance,
} from '../controllers/adminController.js';

const router = express.Router();

router.get('/stats/overview', protect, restrictTo('admin'), getOverviewStats);
router.get('/stats/revenue', protect, restrictTo('admin'), getRevenueAnalytics);
router.get('/stats/sales', protect, restrictTo('admin'), getSalesAnalytics);
router.get('/stats/customers', protect, restrictTo('admin'), getCustomerAnalytics);
router.get('/stats/products', protect, restrictTo('admin'), getProductPerformance);

export default router;
