import mongoose from 'mongoose';

const { Schema } = mongoose;

const cartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    image: String,
    variant: Schema.Types.Mixed,
    sku: String,
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1, min: 1 },
    maxQuantity: { type: Number, default: 10 },
    available: { type: Boolean, default: true },
  },
  { _id: false }
);

const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', sparse: true },
    guestId: { type: String, sparse: true },
    items: {
      type: [cartItemSchema],
      default: [],
      validate: [(val) => Array.isArray(val), 'Items must be an array'],
    },
    subtotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    currency: { type: String, default: 'USD' },
    expiresAt: { type: Date, default: () => Date.now() + 7 * 24 * 60 * 60 * 1000 },
  },
  { timestamps: true }
);

cartSchema.index({ user: 1 }, { sparse: true });
cartSchema.index({ guestId: 1 }, { sparse: true });

// Validation: cart must have either user OR guestId
cartSchema.pre('validate', function (next) {
  if (!this.user && !this.guestId) {
    return next(new Error('Cart must have either user or guestId'));
  }
  if (this.user && this.guestId) {
    return next(new Error('Cart cannot have both user and guestId'));
  }
  next();
});

cartSchema.methods.recalculateTotals = function recalculateTotals() {
  this.subtotal = this.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  this.taxTotal = this.subtotal * 0.1; // placeholder; ideally dynamic
  this.grandTotal = this.subtotal + this.taxTotal - this.discountTotal;
};

cartSchema.pre('save', function handleTotals(next) {
  this.recalculateTotals();
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

export const dropLegacyCartIndexes = async () => {
  try {
    await Cart.collection.dropIndex('user_1');
    console.info('[cart-index] Dropped legacy user_1 unique index');
  } catch (error) {
    if (error.codeName !== 'IndexNotFound' && error.code !== 27) {
      console.warn('[cart-index] Unable to drop legacy user_1 index', error.message);
    }
  }
};

export default Cart;
