import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { ensureGuestIdentity } from '../middleware/guestIdentity.js';
import { validate } from '../middleware/validation.js';
import {
  validateCart,
  applyCoupon,
  calculateCheckout,
  createOrder,
} from '../controllers/checkoutController.js';
import { createPaymentIntent, processCOD } from '../controllers/paymentController.js';
import { validateCoupon, getAvailableCoupons } from '../controllers/couponController.js';

const router = express.Router();

// Allow both authenticated users and guests for checkout flow
router.post('/validate', ensureGuestIdentity, validateCart);

router.post(
  '/apply-coupon',
  ensureGuestIdentity,
  validate([body('code').notEmpty().trim().withMessage('Coupon code is required')]),
  applyCoupon
);

router.post('/calculate', ensureGuestIdentity, calculateCheckout);

router.post(
  '/orders',
  ensureGuestIdentity,
  validate([
    body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
    body('shippingMethod').isIn(['standard', 'express']).withMessage('Invalid shipping method'),
    body('paymentMethod').isIn(['stripe', 'cod']).withMessage('Invalid payment method'),
    body('guestEmail').optional().isEmail().withMessage('Valid email required for guest checkout'),
    body('guestPhone').optional().trim(),
    body('stripePaymentIntentId')
      .if(body('paymentMethod').equals('stripe'))
      .notEmpty()
      .withMessage('Stripe payment intent is required for card payments'),
  ]),
  createOrder
);

router.post('/payment/stripe/create-intent', ensureGuestIdentity, createPaymentIntent);

router.post('/payment/cod', ensureGuestIdentity, processCOD);

router.get('/coupons/validate/:code', ensureGuestIdentity, validateCoupon);

router.get('/coupons/available', ensureGuestIdentity, getAvailableCoupons);

export default router;
