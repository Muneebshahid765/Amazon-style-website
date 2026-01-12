import mongoose from 'mongoose';

const { Schema } = mongoose;

const socialMediaSchema = new Schema(
  {
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
    twitter: { type: String, trim: true },
    website: { type: String, trim: true },
  },
  { _id: false }
);

const ratingSchema = new Schema(
  {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
  { _id: false }
);

const bankAccountSchema = new Schema(
  {
    accountHolderName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    bankName: { type: String, trim: true },
    routingNumber: { type: String, trim: true },
    swiftCode: { type: String, trim: true },
    iban: { type: String, trim: true },
    country: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
  },
  { _id: false }
);

const paypalAccountSchema = new Schema(
  {
    email: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
  },
  { _id: false }
);

const businessInfoSchema = new Schema(
  {
    businessName: { type: String, trim: true },
    businessType: { type: String, enum: ['individual', 'company', 'partnership'], default: 'individual' },
    taxId: { type: String, trim: true },
    vatNumber: { type: String, trim: true },
    registrationNumber: { type: String, trim: true },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
  },
  { _id: false }
);

const storeSchema = new Schema(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    storeName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    logo: {
      public_id: String,
      url: String,
    },
    banner: {
      public_id: String,
      url: String,
    },
    rating: {
      type: ratingSchema,
      default: () => ({ average: 0, count: 0 }),
    },
    totalProducts: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSales: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    commission: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'suspended'],
      default: 'pending',
    },
    verifiedAt: { type: Date },
    socialMedia: socialMediaSchema,
    returnPolicy: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    shippingPolicy: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    // Payment & Payout Settings
    payoutMethod: {
      type: String,
      enum: ['bank_transfer', 'paypal', 'stripe'],
      default: 'bank_transfer',
    },
    bankAccount: bankAccountSchema,
    paypalAccount: paypalAccountSchema,
    stripeAccountId: { type: String, trim: true },
    minimumPayout: {
      type: Number,
      default: 50,
      min: 0,
    },
    autoPayoutEnabled: {
      type: Boolean,
      default: false,
    },
    autoPayoutDay: {
      type: Number,
      min: 1,
      max: 28,
      default: 1,
    },
    // Business Information
    businessInfo: businessInfoSchema,
    // Seller Performance Metrics
    metrics: {
      responseTime: { type: Number, default: 0 },
      fulfillmentRate: { type: Number, default: 100 },
      returnRate: { type: Number, default: 0 },
      cancellationRate: { type: Number, default: 0 },
      onTimeShippingRate: { type: Number, default: 100 },
    },
    // Seller Level/Tier
    sellerLevel: {
      type: String,
      enum: ['new', 'bronze', 'silver', 'gold', 'platinum'],
      default: 'new',
    },
    levelUpdatedAt: { type: Date },
    // Vacation Mode
    vacationMode: {
      isEnabled: { type: Boolean, default: false },
      startDate: { type: Date },
      endDate: { type: Date },
      message: { type: String, maxlength: 500 },
    },
    // Custom Branding
    branding: {
      primaryColor: { type: String, default: '#3b82f6' },
      secondaryColor: { type: String, default: '#8b5cf6' },
      accentColor: { type: String, default: '#10b981' },
      fontFamily: { type: String, default: 'Inter' },
    },
    tagline: { type: String, trim: true, maxlength: 200 },
    // Security Settings
    securitySettings: {
      twoFactorAuth: { type: Boolean, default: false },
      ipWhitelist: { type: Boolean, default: false },
      whitelistedIPs: [{ type: String }],
      sessionTimeout: { type: Number, default: 30 },
      passwordExpiry: { type: Number, default: 90 },
      loginNotifications: { type: Boolean, default: true },
    },
    // Multiple Stores Support
    isPrimary: { type: Boolean, default: true },
    domain: { type: String, trim: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    // Available Balance for wallet payments
    availableBalance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

storeSchema.index({ seller: 1 });
storeSchema.index({ storeName: 1 });
storeSchema.index({ slug: 1 });
storeSchema.index({ isActive: 1 });

storeSchema.pre('save', function generateSlug(next) {
  if (this.isModified('storeName')) {
    this.slug = this.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

const Store = mongoose.model('Store', storeSchema);

export default Store;
