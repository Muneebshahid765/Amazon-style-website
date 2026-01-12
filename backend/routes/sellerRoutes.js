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

// AI Insights
router.get('/ai-insights', requireFeature('aiPoweredInsights'), sellerController.getAIInsights);

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

// Custom Branding
router.get('/branding', requireFeature('customBranding'), sellerController.getStoreBranding);
router.put('/branding', requireFeature('customBranding'), upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), sellerController.updateStoreBranding);

// API Access
router.get('/api/keys', requireFeature('apiAccess'), sellerController.getAPIKeys);
router.post('/api/keys/generate', requireFeature('apiAccess'), sellerController.generateAPIKey);
router.delete('/api/keys/:keyId', requireFeature('apiAccess'), sellerController.revokeAPIKey);

// Multiple Stores
router.get('/stores', requireFeature('multipleStores'), sellerController.getStores);
router.post('/stores', requireFeature('multipleStores'), sellerController.createStore);
router.put('/stores/:storeId', requireFeature('multipleStores'), sellerController.updateStoreById);
router.delete('/stores/:storeId', requireFeature('multipleStores'), sellerController.deleteStore);
router.put('/stores/:storeId/set-primary', requireFeature('multipleStores'), sellerController.setPrimaryStore);

// Advanced Reporting
router.get('/reports/advanced', requireFeature('advancedReporting'), sellerController.getAdvancedReport);
router.post('/reports/export', requireFeature('advancedReporting'), sellerController.exportReport);

// Inventory Forecasting
router.get('/inventory/forecasting', requireFeature('inventoryForecasting'), sellerController.getInventoryForecast);

// Dedicated Account Manager
router.get('/account-manager', requireFeature('dedicatedAccountManager'), sellerController.getAccountManagerFromDB);
router.post('/account-manager/message', requireFeature('dedicatedAccountManager'), sellerController.sendMessageToManager);

// Team Members
router.get('/team', requireFeature('unlimitedTeamMembers'), sellerController.getTeamMembers);
router.post('/team/invite', requireFeature('unlimitedTeamMembers'), sellerController.inviteTeamMember);
router.put('/team/:memberId', requireFeature('unlimitedTeamMembers'), sellerController.updateTeamMember);
router.delete('/team/:memberId', requireFeature('unlimitedTeamMembers'), sellerController.removeTeamMember);

// Security
router.get('/security/settings', requireFeature('advancedSecurity'), sellerController.getSecuritySettings);
router.put('/security/settings', requireFeature('advancedSecurity'), sellerController.updateSecuritySettings);
router.get('/security/logs', requireFeature('advancedSecurity'), sellerController.getSecurityLogs);

// Integrations
router.get('/integrations', requireFeature('customIntegrations'), sellerController.getIntegrations);
router.post('/integrations', requireFeature('customIntegrations'), sellerController.createIntegration);
router.put('/integrations/:integrationId', requireFeature('customIntegrations'), sellerController.updateIntegration);
router.delete('/integrations/:integrationId', requireFeature('customIntegrations'), sellerController.deleteIntegration);
router.post('/integrations/request', requireFeature('customIntegrations'), sellerController.requestCustomIntegration);

// Marketing Campaigns
router.get('/marketing/campaigns', requireFeature('automatedMarketing'), sellerController.getMarketingCampaignsFromDB);
router.post('/marketing/campaigns', requireFeature('automatedMarketing'), sellerController.createMarketingCampaign);
router.put('/marketing/campaigns/:campaignId', requireFeature('automatedMarketing'), sellerController.updateMarketingCampaign);
router.delete('/marketing/campaigns/:campaignId', requireFeature('automatedMarketing'), sellerController.deleteMarketingCampaign);

export default router;