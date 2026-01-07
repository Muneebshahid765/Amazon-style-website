import mongoose from 'mongoose';

const { Schema } = mongoose;

const documentSchema = new Schema(
  {
    name: { type: String, trim: true },
    type: { type: String, trim: true },
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const addressSchema = new Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  { _id: false }
);

const paymentSchema = new Schema(
  {
    provider: { type: String, enum: ['stripe', 'wallet'], required: true },
    paymentIntentId: { type: String },
    transactionId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    cardBrand: { type: String },
    cardLast4: { type: String },
    paidAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const sellerVerificationSchema = new Schema(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: { type: String, required: true, trim: true },
    businessType: {
      type: String,
      enum: ['individual', 'company', 'partnership'],
      default: 'individual',
    },
    registrationNumber: { type: String, trim: true },
    taxId: { type: String, trim: true },
    businessCategory: { type: String, trim: true },
    website: { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 2000 },
    address: addressSchema,
    documents: [documentSchema],
    fee: { type: Number, default: 0 },
    payment: paymentSchema,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    submissionNotes: { type: String, trim: true },
    rejectionReason: { type: String, trim: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

sellerVerificationSchema.index({ seller: 1, status: 1 });

const SellerVerification = mongoose.model('SellerVerification', sellerVerificationSchema);

export default SellerVerification;
