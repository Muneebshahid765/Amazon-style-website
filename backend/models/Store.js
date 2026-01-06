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
