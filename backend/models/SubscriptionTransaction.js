import mongoose from 'mongoose';

const subscriptionTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'PKR',
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'card'],
      default: 'stripe',
    },
    stripePaymentIntentId: {
      type: String,
      sparse: true,
    },
    stripeChargeId: {
      type: String,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentDetails: {
      cardLast4: String,
      cardBrand: String,
      receiptEmail: String,
    },
    metadata: {
      notes: String,
      ipAddress: String,
      userAgent: String,
    },
    failureReason: String,
    refundedAt: Date,
    refundAmount: Number,
  },
  {
    timestamps: true,
  }
);

subscriptionTransactionSchema.index({ user: 1, createdAt: -1 });
subscriptionTransactionSchema.index({ status: 1, createdAt: -1 });

const SubscriptionTransaction = mongoose.model('SubscriptionTransaction', subscriptionTransactionSchema);

export default SubscriptionTransaction;
