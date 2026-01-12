import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import { requireFeature } from '../middleware/featureAccess.js';
import upload from '../config/multer.js';
import * as sellerController from '../controllers/sellerController.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('seller', 'admin'));

// Dashboard
router.get('/dashboard/stats', sellerController.getDashboardStats);
router.get('/dashboard/sales-overview', sellerController.getSalesOverview);
router.get('/dashboard/performance', sellerController.getPerformanceMetrics);

// Products
router.get('/products', sellerController.getProducts);
router.get('/products/analytics', requireFeature('advancedAnalytics'), sellerController.getProductAnalytics);
router.get('/products/:id', sellerController.getProductById);
router.post('/products', upload.array('images', 8), sellerController.createProduct);
router.put('/products/:id', upload.array('images', 8), sellerController.updateProduct);
router.delete('/products/:id', sellerController.deleteProduct);
router.put('/products/:id/stock', sellerController.updateStock);
router.post('/products/bulk/stock', requireFeature('bulkOperations'), sellerController.bulkUpdateStock);
router.post('/products/bulk/prices', requireFeature('bulkOperations'), sellerController.bulkUpdatePrices);

// Categories
router.get('/categories', sellerController.getCategories);

// Orders
router.get('/orders', sellerController.getOrders);
router.get('/orders/:orderId', sellerController.getOrderDetail);
router.put('/orders/:orderId/items/:itemId/status', sellerController.updateOrderItemStatus);
router.post('/orders/:orderId/items/:itemId/tracking', sellerController.addTrackingInfo);

// Earnings & Payouts
router.get('/earnings', sellerController.getEarnings);
router.get('/earnings/transactions', sellerController.getTransactions);
router.get('/earnings/payouts', sellerController.getPayoutHistory);
router.post('/earnings/payout', sellerController.requestPayout);

// Payout Settings
router.get('/payout-settings', sellerController.getPayoutSettings);
router.put('/payout-settings', sellerController.updatePayoutSettings);

// Store
router.get('/store', sellerController.getStore);
router.put('/store', sellerController.updateStore);
router.put('/store/business-info', sellerController.updateBusinessInfo);
router.put('/store/vacation-mode', sellerController.updateVacationMode);
router.post('/buyer-profile', sellerController.createBuyerProfile);

// Reviews
router.get('/reviews', sellerController.getReviews);
router.post('/reviews/:id/reply', sellerController.replyToReview);

// Reports
router.get('/reports/sales', sellerController.getSalesReport);
router.get('/reports/inventory', sellerController.getInventoryReport);

// Verification
router.post(
  '/verification/payment-intent',
  sellerController.createVerificationPaymentIntent
);
router
  .route('/verification')
  .get(sellerController.getSellerVerification)
  .post(upload.array('documents', 5), sellerController.submitSellerVerification);

// Coupons
router
  .route('/coupons')
  .get(sellerController.getSellerCoupons)
  .post(sellerController.createSellerCoupon);
router
  .route('/coupons/:id')
  .put(sellerController.updateSellerCoupon)
  .delete(sellerController.deleteSellerCoupon);

// Subscription
router.get('/subscription/status', sellerController.getSubscriptionStatus);

export default router;