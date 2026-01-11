import express from 'express';
import { body } from 'express-validator';
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  deleteAvatar,
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  getUserOrders,
  getUserOrderById,
  getUserTransactions,
  listUsers,
} from '../controllers/userController.js';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../controllers/cartController.js';
import { protect, restrictTo, optionalAuth } from '../middleware/auth.js';
import { ensureGuestIdentity } from '../middleware/guestIdentity.js';
import { validate } from '../middleware/validation.js';
import upload from '../config/multer.js';

const router = express.Router();

router.get('/profile', protect, getProfile);

router.put(
  '/profile',
  protect,
  validate([
    body('firstName').optional().trim().isLength({ min: 2 }),
    body('lastName').optional().trim().isLength({ min: 2 }),
    body('email').optional().isEmail(),
    body('phone').optional().trim(),
  ]),
  updateProfile
);

router.post(
  '/change-password',
  protect,
  validate([
    body('oldPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/)
      .withMessage('Password must contain uppercase, number, and special character'),
  ]),
  changePassword
);

router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.delete('/avatar', protect, deleteAvatar);

router.post(
  '/addresses',
  protect,
  validate([
    body('label').optional().trim(),
    body('fullName').notEmpty().trim().withMessage('Full name is required'),
    body('phone').notEmpty().trim().withMessage('Phone is required'),
    body('addressLine1').notEmpty().trim().withMessage('Address line 1 is required'),
    body('addressLine2').optional().trim(),
    body('city').notEmpty().trim().withMessage('City is required'),
    body('state').notEmpty().trim().withMessage('State is required'),
    body('postalCode').notEmpty().trim().withMessage('Postal code is required'),
    body('country').notEmpty().trim().withMessage('Country is required'),
  ]),
  addAddress
);

router.get('/addresses', protect, getAddresses);
router.put('/addresses/:id', protect, updateAddress);
router.delete('/addresses/:id', protect, deleteAddress);
router.put('/addresses/:id/default', protect, setDefaultAddress);

router.post('/wishlist/:productId', protect, addToWishlist);
router.delete('/wishlist/:productId', protect, removeFromWishlist);
router.get('/wishlist', protect, getWishlist);

router.get('/orders', ensureGuestIdentity, optionalAuth, getUserOrders);
router.get('/orders/:id', ensureGuestIdentity, optionalAuth, getUserOrderById);
router.get('/transactions', protect, getUserTransactions);

router.get('/', protect, restrictTo('admin'), listUsers);

// Cart routes - allow both authenticated users and guests
router.get('/cart', ensureGuestIdentity, getCart);
router.post('/cart', ensureGuestIdentity, addToCart);
router.put('/cart', ensureGuestIdentity, updateCartItem);
router.delete('/cart/:productId', ensureGuestIdentity, removeFromCart);
router.delete('/cart', ensureGuestIdentity, clearCart);

export default router;
