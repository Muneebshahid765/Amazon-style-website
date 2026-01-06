import mongoose from 'mongoose';

const { Schema } = mongoose;

const mediaSchema = new Schema(
  {
    public_id: String,
    url: String,
    alt: String,
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    costPrice: { type: Number, min: 0 },
    tax: { type: Number, min: 0, default: 0 },
    stock: { type: Number, default: 0 },
    sku: { type: String, unique: true, sparse: true, uppercase: true },
    lowStockThreshold: { type: Number, default: 5 },
    trackInventory: { type: Boolean, default: true },
    images: [mediaSchema],
    video: { type: String },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: { type: Schema.Types.ObjectId, ref: 'Category' },
    brand: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    keywords: [{ type: String, trim: true }],
    ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0 },
    specifications: { type: Schema.Types.Mixed, default: {} },
    seller: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    sellerInfo: { type: Schema.Types.ObjectId, ref: 'Store' },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
      index: true,
    },
    rejectionReason: { type: String },
    status: {
      type: String,
      enum: ['active', 'inactive', 'outofstock'],
      default: 'active',
    },
    viewsCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
});

productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ title: 'text', description: 'text', tags: 'text' });

productSchema.pre('save', function normalizeDiscount(next) {
  if (this.discountPrice && this.discountPrice > this.price) {
    this.discountPrice = this.price;
  }
  if (this.trackInventory && this.stock <= this.lowStockThreshold) {
    this.status = 'outofstock';
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;
