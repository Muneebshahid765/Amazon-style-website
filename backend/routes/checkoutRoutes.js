import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  validateCart,
  applyCoupon,
  calculateCheckout,
  createOrder,
} from '../controllers/checkoutController.js';
import {
  createPaymentIntent,
  handleStripeWebhook,
  processCOD,
} from '../controllers/paymentController.js';
import { validateCoupon, getAvailableCoupons } from '../controllers/couponController.js';

const router = express.Router();

router.post('/validate', protect, validateCart);

router.post(
  '/apply-coupon',
  protect,
  validate([body('code').notEmpty().trim().withMessage('Coupon code is required')]),
  applyCoupon
);

router.post('/calculate', protect, calculateCheckout);

router.post(
  '/orders',
  protect,
  validate([
    body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
    body('shippingMethod').isIn(['standard', 'express']).withMessage('Invalid shipping method'),
    body('paymentMethod').isIn(['stripe', 'cod']).withMessage('Invalid payment method'),
  ]),
  createOrder
);

router.post('/payment/stripe/create-intent', protect, createPaymentIntent);

router.post('/payment/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

router.post('/payment/cod', protect, processCOD);

router.get('/coupons/validate/:code', protect, validateCoupon);

router.get('/coupons/available', protect, getAvailableCoupons);

export default router;
