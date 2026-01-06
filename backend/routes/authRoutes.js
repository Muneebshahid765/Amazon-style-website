import express from 'express';
import { body } from 'express-validator';
import {
  register,
  verifyEmail,
  login,
  loginLimiter,
  refreshSession,
  logout,
  forgotPassword,
  resetPassword,
  googleAuth,
  googleCallback,
  getProfile,
  registerStep1,
  registerStep2,
  registerStep3,
  registerStep4,
  uploadBusinessLogo,
  uploadBusinessDocuments,
  sendVerificationCode,
  verifyRegistrationCode,
  resendVerificationCode,
  completeRegistration,
  checkEmailAvailability,
  checkBusinessNameAvailability,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate, validateStep2, validateStep3, validateStep4, validateVerificationCode } from '../middleware/validation.js';
import { uploadLogo, uploadDocuments, handleUploadError } from '../middleware/uploadRegistration.js';

const router = express.Router();

router.post(
  '/register',
  validate([
    body('firstName').notEmpty().trim().withMessage('First name is required'),
    body('lastName').notEmpty().trim().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/)
      .withMessage('Password must contain uppercase, number, and special character'),
    body('phone').optional().trim(),
  ]),
  register
);

router.post(
  '/verify-email',
  validate([
    body('token').notEmpty().withMessage('Verification token is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  ]),
  verifyEmail
);

router.post(
  '/login',
  loginLimiter,
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  login
);

router.get('/session/refresh', protect, refreshSession);

router.post('/logout', protect, logout);

router.post(
  '/forgot-password',
  validate([body('email').isEmail().normalizeEmail().withMessage('Valid email required')]),
  forgotPassword
);

router.post(
  '/reset-password',
  validate([
    body('token').notEmpty().withMessage('Reset token is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/)
      .withMessage('Password must contain uppercase, number, and special character'),
  ]),
  resetPassword
);

router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

router.get('/me', protect, getProfile);

router.post('/register/step1', registerStep1);
router.post('/register/step2', validateStep2, registerStep2);
router.post('/register/step3', validateStep3, registerStep3);
router.post('/register/step4', validateStep4, registerStep4);
router.post('/register/upload-logo', uploadLogo, handleUploadError, uploadBusinessLogo);
router.post('/register/upload-documents', uploadDocuments, handleUploadError, uploadBusinessDocuments);
router.post('/register/send-verification', sendVerificationCode);
router.post('/register/verify-code', validateVerificationCode, verifyRegistrationCode);
router.post('/register/resend-code', resendVerificationCode);
router.post('/register/complete', completeRegistration);
router.get('/check-email', checkEmailAvailability);
router.get('/check-business-name', checkBusinessNameAvailability);

export default router;
