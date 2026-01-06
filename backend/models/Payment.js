import mongoose from 'mongoose';

const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, enum: ['stripe', 'paypal', 'cod', 'bank'], default: 'stripe' },
    method: { type: String, default: 'card' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['pending', 'authorized', 'captured', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: { type: String, index: true },
    receiptUrl: String,
    paidAt: Date,
    refundedAt: Date,
    metadata: Schema.Types.Mixed,
    errorMessage: String,
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ order: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
