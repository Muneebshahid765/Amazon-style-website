import passport from 'passport';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import User from '../models/User.js';
import Store from '../models/Store.js';
import { sendEmail } from '../utils/sendEmail.js';
import { getCache, setCache, deleteCache } from '../config/redis.js';
import { v2 as cloudinary } from 'cloudinary';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sanitizeUser = (user) => {
  const raw = user.toObject();
  delete raw.password;
  delete raw.refreshToken;
  delete raw.resetPasswordToken;
  delete raw.resetPasswordExpire;
  delete raw.verificationToken;
  delete raw.verificationTokenExpires;
  return raw;
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Try again later.',
});

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const register = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
    } = req.body;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters with one uppercase letter, one number, and one special character.',
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const user = await User.create({ firstName, lastName, email, password, phone });
    const verificationToken = user.generateVerificationToken();
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(
      email
    )}`;

    await sendEmail({
      to: email,
      subject: 'Verify your email - NovaMart',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to NovaMart!</h2>
        <p>Hi ${user.fullName},</p>
        <p>Thanks for registering. Please verify your email by clicking the button below:</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create this account, please ignore this email.</p>
      </div>`,
    });

    res
      .status(201)
      .json({ message: 'Registration successful. Please check your email to verify your account.' });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token, email } = req.body;
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      email,
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    req.login(user, (err) => {
      if (err) return next(err);
      res.json({ message: 'Email verified successfully. You are now logged in.', user: sanitizeUser(user) });
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Email verification required' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    req.login(user, (err) => {
      if (err) return next(err);
      res.json({ message: 'Login successful', user: sanitizeUser(user) });
    });
  } catch (error) {
    next(error);
  }
};

const refreshSession = async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'No active session' });
  }

  req.session.touch();
  res.json({ message: 'Session refreshed', user: sanitizeUser(req.user) });
};

const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((destroyErr) => {
      if (destroyErr) return next(destroyErr);
      res.clearCookie('sessionId');
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ message: 'Password reset instructions sent if account exists' });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      email
    )}`;

    await sendEmail({
      to: email,
      subject: 'Reset your password - NovaMart',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi,</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>`,
    });

    res.json({ message: 'Password reset instructions sent if account exists' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, email, password } = req.body;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters with one uppercase letter, one number, and one special character.',
      });
    }

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password updated successfully. Please log in.' });
  } catch (error) {
    next(error);
  }
};

const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

const googleCallback = (req, res, next) => {
  passport.authenticate('google', (err, user) => {
    if (err || !user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
    }

    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      return res.redirect(`${process.env.CLIENT_URL}?login=success`);
    });
  })(req, res, next);
};

const getProfile = async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
};

const registerStep1 = async (req, res, next) => {
  try {
    const { accountType } = req.body;

    if (!accountType || !['customer', 'seller'].includes(accountType)) {
      return res.status(400).json({ message: 'Invalid account type. Must be customer or seller.' });
    }

    const registrationId = crypto.randomBytes(16).toString('hex');
    const registrationData = { accountType, step: 1 };

    await setCache(`registration:${registrationId}`, registrationData, 3600);

    res.status(200).json({
      success: true,
      message: 'Account type selected successfully',
      registrationId,
      accountType,
    });
  } catch (error) {
    next(error);
  }
};

const registerStep2 = async (req, res, next) => {
  try {
    const { registrationId, firstName, lastName, email, phone, password, confirmPassword } = req.body;

    if (!registrationId) {
      return res.status(400).json({ message: 'Registration ID is required' });
    }

    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters with one uppercase letter, one number, and one special character.',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const registrationData = await getCache(`registration:${registrationId}`);
    if (!registrationData) {
      return res.status(400).json({ message: 'Invalid or expired registration session' });
    }

    registrationData.personalInfo = { firstName, lastName, email, phone, password };
    registrationData.step = 2;

    await setCache(`registration:${registrationId}`, registrationData, 3600);

    res.status(200).json({
      success: true,
      message: 'Personal information saved successfully',
      registrationId,
    });
  } catch (error) {
    next(error);
  }
};

const registerStep3 = async (req, res, next) => {
  try {
    const { registrationId, street, city, state, country, zipCode, addressType, isDefault, phoneNumber } = req.body;

    if (!registrationId) {
      return res.status(400).json({ message: 'Registration ID is required' });
    }

    if (!street || !city || !state || !country || !zipCode) {
      return res.status(400).json({ message: 'All address fields are required' });
    }

    const registrationData = await getCache(`registration:${registrationId}`);
    if (!registrationData) {
      return res.status(400).json({ message: 'Invalid or expired registration session' });
    }

    registrationData.address = {
      street,
      city,
      state,
      country,
      zipCode,
      addressType: addressType || 'home',
      isDefault: isDefault !== undefined ? isDefault : true,
      phoneNumber,
    };
    registrationData.step = 3;

    await setCache(`registration:${registrationId}`, registrationData, 3600);

    res.status(200).json({
      success: true,
      message: 'Address information saved successfully',
      registrationId,
    });
  } catch (error) {
    next(error);
  }
};

const registerStep4 = async (req, res, next) => {
  try {
    const {
      registrationId,
      businessName,
      businessType,
      registrationNumber,
      taxId,
      businessCategory,
      description,
      sameAsPersonalAddress,
      businessStreet,
      businessCity,
      businessState,
      businessCountry,
      businessZipCode,
    } = req.body;

    if (!registrationId) {
      return res.status(400).json({ message: 'Registration ID is required' });
    }

    const registrationData = await getCache(`registration:${registrationId}`);
    if (!registrationData) {
      return res.status(400).json({ message: 'Invalid or expired registration session' });
    }

    if (registrationData.accountType !== 'seller') {
      return res.status(400).json({ message: 'Business information only required for seller accounts' });
    }

    if (!businessName || !businessType || !registrationNumber || !taxId || !businessCategory || !description) {
      return res.status(400).json({ message: 'All business fields are required' });
    }

    if (description.length < 50 || description.length > 500) {
      return res.status(400).json({ message: 'Description must be between 50 and 500 characters' });
    }

    const existingStore = await Store.findOne({ storeName: businessName });
    if (existingStore) {
      return res.status(409).json({ message: 'Business name already taken' });
    }

    let businessAddress;
    if (sameAsPersonalAddress) {
      businessAddress = {
        street: registrationData.address.street,
        city: registrationData.address.city,
        state: registrationData.address.state,
        country: registrationData.address.country,
        zipCode: registrationData.address.zipCode,
      };
    } else {
      if (!businessStreet || !businessCity || !businessState || !businessCountry || !businessZipCode) {
        return res.status(400).json({ message: 'All business address fields are required' });
      }
      businessAddress = {
        street: businessStreet,
        city: businessCity,
        state: businessState,
        country: businessCountry,
        zipCode: businessZipCode,
      };
    }

    registrationData.businessInfo = {
      businessName,
      businessType,
      registrationNumber,
      taxId,
      businessAddress,
      businessCategory,
      description,
    };
    registrationData.step = 4;

    await setCache(`registration:${registrationId}`, registrationData, 3600);

    res.status(200).json({
      success: true,
      message: 'Business information saved successfully',
      registrationId,
    });
  } catch (error) {
    next(error);
  }
};

const uploadBusinessLogo = async (req, res, next) => {
  try {
    const { registrationId } = req.body;

    if (!registrationId) {
      return res.status(400).json({ message: 'Registration ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Logo file is required' });
    }

    const registrationData = await getCache(`registration:${registrationId}`);
    if (!registrationData) {
      return res.status(400).json({ message: 'Invalid or expired registration session' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'business_logos',
      width: 300,
      height: 300,
      crop: 'fill',
    });

    if (!registrationData.businessInfo) {
      registrationData.businessInfo = {};
    }

    registrationData.businessInfo.logo = {
      public_id: result.public_id,
      url: result.secure_url,
    };

    await setCache(`registration:${registrationId}`, registrationData, 3600);

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      logo: {
        public_id: result.public_id,
        url: result.secure_url,
      },
    });
  } catch (error) {
    next(error);
  }
};

const uploadBusinessDocuments = async (req, res, next) => {
  try {
    const { registrationId } = req.body;

    if (!registrationId) {
      return res.status(400).json({ message: 'Registration ID is required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one document is required' });
    }

    if (req.files.length > 5) {
      return res.status(400).json({ message: 'Maximum 5 documents allowed' });
    }

    const registrationData = await getCache(`registration:${registrationId}`);
    if (!registrationData) {
      return res.status(400).json({ message: 'Invalid or expired registration session' });
    }

    const uploadedDocuments = [];

    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'business_documents',
        resource_type: 'raw',
      });

      uploadedDocuments.push({
        name: file.originalname,
        url: result.secure_url,
        public_id: result.public_id,
        uploadDate: new Date(),
      });
    }

    if (!registrationData.businessInfo) {
      registrationData.businessInfo = {};
    }

    registrationData.businessInfo.documents = uploadedDocuments;

    await setCache(`registration:${registrationId}`, registrationData, 3600);

    res.status(200).json({
      success: true,
      message: 'Documents uploaded successfully',
      documents: uploadedDocuments,
    });
  } catch (error) {
    next(error);
  }
};

const sendVerificationCode = async (req, res, next) => {
  try {
    const { registrationId } = req.body;

    if (!registrationId) {
      return res.status(400).json({ message: 'Registration ID is required' });
    }

    const registrationData = await getCache(`registration:${registrationId}`);
    if (!registrationData || !registrationData.personalInfo) {
      return res.status(400).json({ message: 'Invalid or expired registration session' });
    }

    const verificationCode = generateVerificationCode();
    const { email, firstName } = registrationData.personalInfo;

    registrationData.verificationCode = verificationCode;
    registrationData.verificationCodeExpiry = Date.now() + 15 * 60 * 1000;

    await setCache(`registration:${registrationId}`, registrationData, 3600);

    const maskedEmail = email.replace(/(.{1})(.*)(@.*)/, (match, first, middle, domain) => {
      return first + '*'.repeat(middle.length) + domain;
    });

    await sendEmail({
      to: email,
      subject: 'Email Verification Code - NovaMart',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4F46E5; margin: 0;">NovaMart</h1>
            </div>
            <h2 style="color: #1f2937; margin-bottom: 20px;">Email Verification</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Hi ${firstName},</p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Thank you for registering with NovaMart. Please use the verification code below to complete your registration:</p>
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4F46E5;">${verificationCode}</div>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">This code will expire in 15 minutes.</p>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">If you didn't request this code, please ignore this email.</p>
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">© 2024 NovaMart. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
      maskedEmail,
    });
  } catch (error) {
    next(error);
  }
};

const verifyRegistrationCode = async (req, res, next) => {
  try {
    const { registrationId, code } = req.body;

    if (!registrationId || !code) {
      return res.status(400).json({ message: 'Registration ID and code are required' });
    }

    const registrationData = await getCache(`registration:${registrationId}`);
    if (!registrationData) {
      return res.status(400).json({ message: 'Invalid or expired registration session' });
    }

    if (!registrationData.verificationCode || !registrationData.verificationCodeExpiry) {
      return res.status(400).json({ message: 'No verification code found. Please request a new code.' });
    }

    if (Date.now() > registrationData.verificationCodeExpiry) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }

    if (registrationData.verificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    registrationData.isEmailVerified = true;
    await setCache(`registration:${registrationId}`, registrationData, 3600);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

const resendVerificationCode = async (req, res, next) => {
  try {
    const { registrationId } = req.body;

    if (!registrationId) {
      return res.status(400).json({ message: 'Registration ID is required' });
    }

    const registrationData = await getCache(`registration:${registrationId}`);
    if (!registrationData || !registrationData.personalInfo) {
      return res.status(400).json({ message: 'Invalid or expired registration session' });
    }

    const verificationCode = generateVerificationCode();
    const { email, firstName } = registrationData.personalInfo;

    registrationData.verificationCode = verificationCode;
    registrationData.verificationCodeExpiry = Date.now() + 15 * 60 * 1000;

    await setCache(`registration:${registrationId}`, registrationData, 3600);

    await sendEmail({
      to: email,
      subject: 'Email Verification Code - NovaMart',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4F46E5; margin: 0;">NovaMart</h1>
            </div>
            <h2 style="color: #1f2937; margin-bottom: 20px;">Email Verification</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Hi ${firstName},</p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Here is your new verification code:</p>
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4F46E5;">${verificationCode}</div>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">This code will expire in 15 minutes.</p>
          </div>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: 'Verification code resent successfully',
    });
  } catch (error) {
    next(error);
  }
};

const completeRegistration = async (req, res, next) => {
  try {
    const { registrationId, agreeToTerms, agreeToPrivacy } = req.body;

    if (!registrationId) {
      return res.status(400).json({ message: 'Registration ID is required' });
    }

    if (!agreeToTerms || !agreeToPrivacy) {
      return res.status(400).json({ message: 'You must agree to Terms & Conditions and Privacy Policy' });
    }

    const registrationData = await getCache(`registration:${registrationId}`);
    if (!registrationData) {
      return res.status(400).json({ message: 'Invalid or expired registration session' });
    }

    if (!registrationData.isEmailVerified) {
      return res.status(400).json({ message: 'Email verification required' });
    }

    const { personalInfo, address, businessInfo, accountType } = registrationData;

    const userData = {
      firstName: personalInfo.firstName,
      lastName: personalInfo.lastName,
      email: personalInfo.email,
      phone: personalInfo.phone,
      password: personalInfo.password,
      accountType,
      role: accountType === 'seller' ? 'seller' : 'user',
      isEmailVerified: true,
      addresses: [address],
    };

    if (accountType === 'seller' && businessInfo) {
      userData.businessInfo = businessInfo;
      userData.accountStatus = 'pending_verification';
    }

    const user = await User.create(userData);

    if (accountType === 'seller') {
      await Store.create({
        seller: user._id,
        storeName: businessInfo.businessName,
        description: businessInfo.description,
        logo: businessInfo.logo,
      });

      await sendEmail({
        to: personalInfo.email,
        subject: 'Welcome to NovaMart - Seller Account Pending Verification',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Welcome to NovaMart, ${personalInfo.firstName}!</h2>
            <p>Your seller account has been created successfully.</p>
            <p>Your business information is currently under review by our team. We'll notify you once your account is verified.</p>
            <p>This process typically takes 1-2 business days.</p>
            <p>Thank you for choosing NovaMart!</p>
          </div>
        `,
      });
    } else {
      await sendEmail({
        to: personalInfo.email,
        subject: 'Welcome to NovaMart!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Welcome to NovaMart, ${personalInfo.firstName}!</h2>
            <p>Your account has been created successfully.</p>
            <p>Start exploring thousands of products and enjoy a seamless shopping experience.</p>
            <p>Happy Shopping!</p>
          </div>
        `,
      });
    }

    await deleteCache(`registration:${registrationId}`);

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json({
        success: true,
        message: 'Registration completed successfully',
        user: sanitizeUser(user),
      });
    });
  } catch (error) {
    next(error);
  }
};

const checkEmailAvailability = async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const existingUser = await User.findOne({ email });

    res.status(200).json({
      available: !existingUser,
      message: existingUser ? 'Email already registered' : 'Email available',
    });
  } catch (error) {
    next(error);
  }
};

const checkBusinessNameAvailability = async (req, res, next) => {
  try {
    const { businessName } = req.query;

    if (!businessName) {
      return res.status(400).json({ message: 'Business name is required' });
    }

    const existingStore = await Store.findOne({ storeName: businessName });

    res.status(200).json({
      available: !existingStore,
      message: existingStore ? 'Business name already taken' : 'Business name available',
    });
  } catch (error) {
    next(error);
  }
};

export {
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
};
