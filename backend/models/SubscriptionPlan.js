import mongoose from 'mongoose';
import slugify from 'slugify';

const { Schema } = mongoose;

const limitSchema = new Schema(
  {
    maxActiveProducts: { type: Number, default: 10, min: 0 },
    uploadsPerCycle: { type: Number, default: 10, min: 0 },
    editsPerCycle: { type: Number, default: 30, min: 0 },
    deletesPerCycle: { type: Number, default: 10, min: 0 },
  },
  { _id: false, minimize: false }
);

const discountSchema = new Schema(
  {
    isActive: { type: Boolean, default: false },
    type: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
    value: { type: Number, default: 0, min: 0 },
    label: { type: String, trim: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
    minPrice: { type: Number, default: 0, min: 0 },
  },
  { _id: false, minimize: false }
);

const subscriptionPlanSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    tier: {
      type: String,
      enum: ['free', 'starter', 'growth', 'pro', 'enterprise'],
      default: 'free',
    },
    priceMonthly: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'USD' },
    durationDays: { type: Number, default: 30, min: 1 },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    limits: { type: limitSchema, default: () => ({}) },
    features: { type: [String], default: [] },
    badges: { type: [String], default: [] },
    highlightColor: { type: String, default: '#0ea5e9' },
    discount: { type: discountSchema, default: () => ({}) },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

subscriptionPlanSchema.pre('validate', function generateSlug(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

subscriptionPlanSchema.pre('save', function normalizeDefaults(next) {
  const limits = this.limits || {};
  this.limits = {
    maxActiveProducts: limits.maxActiveProducts ?? 10,
    uploadsPerCycle: limits.uploadsPerCycle ?? 10,
    editsPerCycle: limits.editsPerCycle ?? 30,
    deletesPerCycle: limits.deletesPerCycle ?? 10,
  };
  next();
});

subscriptionPlanSchema.index({ slug: 1 }, { unique: true });
subscriptionPlanSchema.index({ tier: 1 });
subscriptionPlanSchema.index({ isDefault: 1 });
subscriptionPlanSchema.index({ isActive: 1 });

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

export default SubscriptionPlan;
