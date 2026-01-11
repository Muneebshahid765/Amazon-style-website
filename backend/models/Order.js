import mongoose from 'mongoose';

const { Schema } = mongoose;

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User' },
    variant: { type: Schema.Types.Mixed },
    title: String,
    sku: String,
    price: Number,
    quantity: { type: Number, default: 1 },
    image: String,
    itemStatus: {
      type: String,
      enum: ['pending', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },
    trackingInfo: {
      trackingNumber: String,
      carrier: String,
      trackingUrl: String,
      shippedAt: Date,
    },
  },
  { _id: true }
);

const addressSchema = new Schema(
  {
    fullName: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    notes: String,
  },
  { _id: false }
);

const statusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'],
    },
    updatedAt: { type: Date, default: Date.now },
    note: String,
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', sparse: true },
    guestId: { type: String, sparse: true },
    guestEmail: { type: String },
    guestPhone: { type: String },
    seller: { type: Schema.Types.ObjectId, ref: 'User' },
    orderItems: { type: [orderItemSchema], validate: [(val) => val.length > 0, 'Items required'] },
    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    payment: { type: Schema.Types.ObjectId, ref: 'Payment' },
    itemsPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxPrice: { type: Number, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    paymentMethod: {
      type: String,
      enum: ['cod', 'stripe'],
      default: 'cod',
    },
    paymentCardBrand: { type: String },
    paymentCardLast4: { type: String },
    paymentIntentId: { type: String },
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    status: {
      type: String,
      enum: [
        'pending',
        'awaiting_payment',
        'processing',
        'packed',
        'shipped',
        'delivered',
        'cancelled',
        'refunded',
      ],
      default: 'pending',
    },
    statusHistory: [statusHistorySchema],
    deliveredAt: Date,
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Virtual fields for backward compatibility with frontend
orderSchema.virtual('items').get(function () {
  return this.orderItems;
});

orderSchema.virtual('totalAmount').get(function () {
  return this.totalPrice;
});

orderSchema.virtual('paymentDisplayMethod').get(function () {
  if (this.paymentCardBrand) {
    const brand = this.paymentCardBrand.toUpperCase();
    const last4 = this.paymentCardLast4 ? ` •••• ${this.paymentCardLast4}` : '';
    return `${brand}${last4}`;
  }
  if (this.paymentMethod) {
    return this.paymentMethod === 'stripe'
      ? 'Stripe'
      : this.paymentMethod.toUpperCase();
  }
  return 'N/A';
});

// Ensure virtuals are included in JSON and Object outputs
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

orderSchema.index({ user: 1, createdAt: -1 }, { sparse: true });
orderSchema.index({ guestId: 1, createdAt: -1 }, { sparse: true });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

orderSchema.pre('save', function ensureHistory(next) {
  if (!this.statusHistory.length) {
    this.statusHistory.push({ status: this.status });
  }
  next();
});

orderSchema.pre('save', function ensureOrderNumber(next) {
  if (this.orderNumber) return next();
  this.orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  next();
});

// Validation: order must have either user OR guestId
orderSchema.pre('validate', function (next) {
  if (!this.user && !this.guestId) {
    return next(new Error('Order must have either user or guestId'));
  }
  if (this.user && this.guestId) {
    return next(new Error('Order cannot have both user and guestId'));
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
