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
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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
    status: {
      type: String,
      enum: ['pending', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'],
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

orderSchema.index({ user: 1, createdAt: -1 });
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

const Order = mongoose.model('Order', orderSchema);

export default Order;
