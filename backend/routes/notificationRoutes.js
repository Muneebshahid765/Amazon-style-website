import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../controllers/notificationController.js';
import {
  sendMessage,
  getOrderMessages,
  markMessageAsRead,
} from '../controllers/messageController.js';

const router = express.Router();

router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, markAsRead);
router.put('/notifications/read-all', protect, markAllAsRead);
router.delete('/notifications/:id', protect, deleteNotification);
router.delete('/notifications', protect, clearAllNotifications);

router.post('/messages', protect, sendMessage);
router.get('/messages/:orderId', protect, getOrderMessages);
router.put('/messages/:id/read', protect, markMessageAsRead);

export default router;
