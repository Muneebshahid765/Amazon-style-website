import express from 'express';
import { ensureAdminAccess, protect } from '../middleware/auth.js';
import {
  getOverviewStats,
  getRevenueAnalytics,
  getSalesAnalytics,
  getCustomerAnalytics,
  getProductPerformance,
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminSellers,
  getAdminSellerById,
  verifySellerAccount,
  // Orders
  getAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
  updateOrderItemStatus,
  cancelAdminOrder,
  refundAdminOrder,
  // Customers
  getAdminCustomers,
  getAdminCustomerById,
  updateCustomerStatus,
  // Reviews
  getAdminReviews,
  updateReviewStatus,
  deleteAdminReview,
  // Coupons
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
  // Categories
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  // Activity & Stats
  getActivityLogs,
  getPlatformStats,
} from '../controllers/adminController.js';
import upload from '../config/multer.js';

const router = express.Router();

const devBypass = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    req.user = req.user || { role: 'admin', firstName: 'Dev', lastName: 'Admin', _id: 'dev-admin-id' };
    return next();
  }
  return protect(req, res, () => ensureAdminAccess(req, res, next));
};

// ==================== STATS ====================
router.get('/stats/overview', devBypass, getOverviewStats);
router.get('/stats/revenue', devBypass, getRevenueAnalytics);
router.get('/stats/sales', devBypass, getSalesAnalytics);
router.get('/stats/customers', devBypass, getCustomerAnalytics);
router.get('/stats/products', devBypass, getProductPerformance);
router.get('/stats/platform', devBypass, getPlatformStats);

// ==================== PRODUCTS ====================
router
  .route('/products')
  .get(devBypass, getAdminProducts)
  .post(devBypass, upload.array('images', 8), createAdminProduct);

router
  .route('/products/:id')
  .put(devBypass, upload.array('images', 8), updateAdminProduct)
  .delete(devBypass, deleteAdminProduct);

// ==================== SELLERS ====================
router.get('/sellers', devBypass, getAdminSellers);
router.get('/sellers/:id', devBypass, getAdminSellerById);
router.put('/sellers/:id/verify', devBypass, verifySellerAccount);

// ==================== ORDERS ====================
router.get('/orders', devBypass, getAdminOrders);
router.get('/orders/:id', devBypass, getAdminOrderById);
router.put('/orders/:id/status', devBypass, updateAdminOrderStatus);
router.put('/orders/:id/items/:itemId/status', devBypass, updateOrderItemStatus);
router.put('/orders/:id/cancel', devBypass, cancelAdminOrder);
router.put('/orders/:id/refund', devBypass, refundAdminOrder);

// ==================== CUSTOMERS ====================
router.get('/customers', devBypass, getAdminCustomers);
router.get('/customers/:id', devBypass, getAdminCustomerById);
router.put('/customers/:id/status', devBypass, updateCustomerStatus);

// ==================== REVIEWS ====================
router.get('/reviews', devBypass, getAdminReviews);
router.put('/reviews/:id/status', devBypass, updateReviewStatus);
router.delete('/reviews/:id', devBypass, deleteAdminReview);

// ==================== COUPONS ====================
router
  .route('/coupons')
  .get(devBypass, getAdminCoupons)
  .post(devBypass, createAdminCoupon);

router
  .route('/coupons/:id')
  .put(devBypass, updateAdminCoupon)
  .delete(devBypass, deleteAdminCoupon);

// ==================== CATEGORIES ====================
router
  .route('/categories')
  .get(devBypass, getAdminCategories)
  .post(devBypass, createAdminCategory);

router
  .route('/categories/:id')
  .put(devBypass, updateAdminCategory)
  .delete(devBypass, deleteAdminCategory);

// ==================== ACTIVITY LOGS ====================
router.get('/activity', devBypass, getActivityLogs);

export default router;
