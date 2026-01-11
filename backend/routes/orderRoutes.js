import express from 'express';
import { protect, restrictTo, optionalAuth } from '../middleware/auth.js';
import {
  getMyOrders,
  getOrderById,
  cancelOrder,
  requestReturn,
  getAllOrders,
  getOrderStats,
  updateOrderStatus,
  addTrackingInfo,
  processRefund,
  getOrderInvoice,
} from '../controllers/orderController.js';
import { ensureGuestIdentity } from '../middleware/guestIdentity.js';

const router = express.Router();

router.get('/', ensureGuestIdentity, optionalAuth, getMyOrders);
router.get('/:id', ensureGuestIdentity, optionalAuth, getOrderById);
router.get('/:id/invoice', ensureGuestIdentity, getOrderInvoice);
router.put('/:id/cancel', protect, cancelOrder);
router.post('/:id/return', protect, requestReturn);

router.get('/admin/all', protect, restrictTo('admin'), getAllOrders);
router.get('/admin/stats', protect, restrictTo('admin'), getOrderStats);
router.put('/admin/:id/status', protect, restrictTo('admin'), updateOrderStatus);
router.put('/admin/:id/tracking', protect, restrictTo('admin'), addTrackingInfo);
router.post('/admin/:id/refund', protect, restrictTo('admin'), processRefund);

export default router;
