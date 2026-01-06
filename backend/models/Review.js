import mongoose from 'mongoose';

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: { type: String, trim: true, maxlength: 100 },
    comment: { type: String, trim: true, required: true, maxlength: 2000 },
    images: [
      {
        public_id: String,
        url: String,
      },
    ],
    verifiedPurchase: { type: Boolean, default: false },
    helpfulVotes: {
      helpful: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      notHelpful: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    reportedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    reportCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    sellerResponse: {
      comment: String,
      respondedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      respondedAt: Date,
    },
    isEdited: { type: Boolean, default: false },
    editedAt: Date,
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, rating: -1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ status: 1 });

reviewSchema.virtual('helpfulCount').get(function () {
  return this.helpfulVotes.helpful.length;
});

reviewSchema.virtual('notHelpfulCount').get(function () {
  return this.helpfulVotes.notHelpful.length;
});

reviewSchema.set('toJSON', { virtuals: true });
reviewSchema.set('toObject', { virtuals: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
