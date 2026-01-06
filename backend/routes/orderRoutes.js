import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
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
} from '../controllers/orderController.js';

const router = express.Router();

router.get('/', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/cancel', protect, cancelOrder);
router.post('/:id/return', protect, requestReturn);

router.get('/admin/all', protect, restrictTo('admin'), getAllOrders);
router.get('/admin/stats', protect, restrictTo('admin'), getOrderStats);
router.put('/admin/:id/status', protect, restrictTo('admin'), updateOrderStatus);
router.put('/admin/:id/tracking', protect, restrictTo('admin'), addTrackingInfo);
router.post('/admin/:id/refund', protect, restrictTo('admin'), processRefund);

export default router;
