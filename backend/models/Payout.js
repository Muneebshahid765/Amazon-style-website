import mongoose from 'mongoose';

const { Schema } = mongoose;

const payoutSchema = new Schema(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected'],
      default: 'pending',
      index: true,
    },
    method: {
      type: String,
      required: true,
      enum: ['bank_transfer', 'paypal', 'stripe', 'other'],
    },
    accountDetails: {
      accountHolderName: String,
      accountNumber: String,
      bankName: String,
      routingNumber: String,
      paypalEmail: String,
      notes: String,
    },
    processedAt: {
      type: Date,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
    },
    transactionId: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

payoutSchema.index({ seller: 1, status: 1 });
payoutSchema.index({ createdAt: -1 });

const Payout = mongoose.model('Payout', payoutSchema);

export default Payout;
