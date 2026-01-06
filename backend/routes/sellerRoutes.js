import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import * as sellerController from '../controllers/sellerController.js';
import upload from '../config/multer.js';

console.log('[sellerRoutes] controller exports:', Object.keys(sellerController));

const router = express.Router();

router.use(protect);
router.use(restrictTo('seller', 'admin'));

// Dashboard
router.get('/dashboard/stats', sellerController.getDashboardStats);
router.get('/dashboard/sales-overview', sellerController.getSalesOverview);

// Products
router.get('/products', sellerController.getProducts);
router.get('/products/:id', sellerController.getProductById);
router.post('/products', upload.array('images', 8), sellerController.createProduct);
router.put('/products/:id', upload.array('images', 8), sellerController.updateProduct);
router.delete('/products/:id', sellerController.deleteProduct);
router.put('/products/:id/stock', sellerController.updateStock);
router.get('/products/analytics', sellerController.getProductAnalytics);

// Orders
router.get('/orders', sellerController.getOrders);
router.put('/orders/:orderId/items/:itemId/status', sellerController.updateOrderItemStatus);
router.post('/orders/:orderId/items/:itemId/tracking', sellerController.addTrackingInfo);

// Earnings
router.get('/earnings', sellerController.getEarnings);
router.post('/earnings/payout', sellerController.requestPayout);

// Store
router.get('/store', sellerController.getStore);
router.put('/store', sellerController.updateStore);

// Reviews
router.get('/reviews', sellerController.getReviews);
router.post('/reviews/:id/reply', sellerController.replyToReview);

export default router;
