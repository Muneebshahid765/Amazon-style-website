import express from 'express';
import { body } from 'express-validator';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import upload from '../config/multer.js';
import {
  addReview,
  getProductReviews,
  updateReview,
  deleteReview,
  markReviewHelpful,
  reportReview,
  addSellerResponse,
  getAllReviews,
  approveReview,
  deleteReviewAdmin,
} from '../controllers/reviewController.js';

const router = express.Router();

router.post(
  '/products/:productId/reviews',
  protect,
  upload.array('images', 5),
  validate([
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').notEmpty().trim().withMessage('Comment is required'),
    body('title').optional().trim(),
  ]),
  addReview
);

router.get('/products/:productId/reviews', getProductReviews);

router.put(
  '/reviews/:id',
  protect,
  validate([
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('comment').optional().trim(),
  ]),
  updateReview
);

router.delete('/reviews/:id', protect, deleteReview);

router.post('/reviews/:id/helpful', protect, markReviewHelpful);

router.post(
  '/reviews/:id/report',
  protect,
  validate([body('reason').optional().trim()]),
  reportReview
);

router.post(
  '/reviews/:id/reply',
  protect,
  restrictTo('admin', 'seller'),
  validate([body('comment').notEmpty().trim().withMessage('Response is required')]),
  addSellerResponse
);

router.get('/admin/reviews', protect, restrictTo('admin'), getAllReviews);

router.put('/admin/reviews/:id/approve', protect, restrictTo('admin'), approveReview);

router.delete('/admin/reviews/:id', protect, restrictTo('admin'), deleteReviewAdmin);

export default router;
