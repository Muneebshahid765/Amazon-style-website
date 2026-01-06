import mongoose from 'mongoose';

const { Schema } = mongoose;

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    discountType: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
    discountValue: { type: Number, required: true },
    maxDiscountValue: { type: Number },
    minOrderValue: { type: Number, default: 0 },
    appliesTo: {
      scope: { type: String, enum: ['all', 'category', 'product', 'user'], default: 'all' },
      categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
      products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    },
    usageLimit: { type: Number, default: 0 }, // 0 -> unlimited
    usageLimitPerUser: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    usersUsed: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        count: { type: Number, default: 0 },
      },
    ],
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    isStackable: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ expiresAt: 1 });
couponSchema.index({ 'appliesTo.categories': 1 });
couponSchema.index({ 'appliesTo.products': 1 });

couponSchema.methods.incrementUsage = function incrementUsage(userId) {
  this.usedCount += 1;
  const userUsage = this.usersUsed.find((entry) => entry.user.toString() === userId.toString());
  if (userUsage) {
    userUsage.count += 1;
  } else {
    this.usersUsed.push({ user: userId, count: 1 });
  }
};

couponSchema.methods.canUse = function canUse(userId) {
  if (!this.isActive) return false;
  if (this.startsAt && this.startsAt > Date.now()) return false;
  if (this.expiresAt && this.expiresAt < Date.now()) return false;
  if (this.usageLimit && this.usedCount >= this.usageLimit) return false;

  if (this.usageLimitPerUser && userId) {
    const userUsage = this.usersUsed.find((entry) => entry.user.toString() === userId.toString());
    if (userUsage && userUsage.count >= this.usageLimitPerUser) {
      return false;
    }
  }

  return true;
};

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
