import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    addressType: { type: String, enum: ['home', 'office', 'other'], default: 'home' },
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
    phoneNumber: { type: String, trim: true },
  },
  { _id: false, timestamps: false }
);

const businessAddressSchema = new Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    zipCode: { type: String, trim: true },
  },
  { _id: false, timestamps: false }
);

const businessDocumentSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
  },
  { _id: false }
);

const businessInfoSchema = new Schema(
  {
    businessName: { type: String, trim: true },
    businessType: { type: String, enum: ['individual', 'company', 'partnership'] },
    registrationNumber: { type: String, trim: true },
    taxId: { type: String, trim: true },
    businessAddress: businessAddressSchema,
    businessCategory: { type: String, trim: true },
    description: { type: String, trim: true },
    logo: {
      public_id: String,
      url: String,
    },
    documents: [businessDocumentSchema],
    isVerified: { type: Boolean, default: false },
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String, trim: true },
  },
  { _id: false, timestamps: false }
);

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, trim: true },
    avatar: {
      public_id: String,
      url: String,
    },
    accountType: { type: String, enum: ['customer', 'seller', 'admin'], default: 'customer' },
    role: { type: String, enum: ['user', 'admin', 'seller'], default: 'user' },
    businessInfo: businessInfoSchema,
    buyerProfile: {
      displayName: { type: String, trim: true },
      createdAt: { type: Date },
    },
    hasBuyerProfile: { type: Boolean, default: false },
    addresses: [addressSchema],
    wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    verificationCode: { type: String, select: false },
    verificationCodeExpiry: { type: Date, select: false },
    phoneVerificationCode: { type: String, select: false },
    phoneVerificationExpiry: { type: Date, select: false },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    refreshToken: String,
    lastLogin: Date,
    googleId: { type: String, index: true, sparse: true },
    accountStatus: { type: String, enum: ['active', 'suspended', 'pending_verification'], default: 'active' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.virtual('fullName').get(function getFullName() {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ lastName: 1, firstName: 1 });
userSchema.index({ role: 1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateVerificationToken = function generateVerificationToken() {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
  return token;
};

userSchema.methods.generatePasswordResetToken = function generatePasswordResetToken() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.methods.setRefreshToken = function setRefreshToken(token) {
  this.refreshToken = crypto.createHash('sha256').update(token).digest('hex');
};

const User = mongoose.model('User', userSchema);

export default User;
