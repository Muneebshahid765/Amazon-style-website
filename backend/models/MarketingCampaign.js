import mongoose from 'mongoose';

const { Schema } = mongoose;

const marketingCampaignSchema = new Schema(
  {
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'social'],
      default: 'email',
    },
    template: {
      type: String,
      enum: ['welcome', 'seasonal_sale', 'product_launch', 'abandoned_cart', 'newsletter', 'custom'],
      default: 'custom',
    },
    subject: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'],
      default: 'draft',
    },
    audience: {
      type: {
        type: String,
        enum: ['all', 'new_customers', 'returning_customers', 'inactive', 'custom'],
        default: 'all',
      },
      filters: Schema.Types.Mixed,
      estimatedReach: { type: Number, default: 0 },
    },
    schedule: {
      startDate: Date,
      endDate: Date,
      sendTime: String,
      frequency: {
        type: String,
        enum: ['once', 'daily', 'weekly', 'monthly'],
        default: 'once',
      },
    },
    stats: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      unsubscribed: { type: Number, default: 0 },
      bounced: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
    },
    lastSentAt: Date,
  },
  { timestamps: true }
);

marketingCampaignSchema.index({ store: 1, status: 1 });
marketingCampaignSchema.index({ seller: 1 });
marketingCampaignSchema.index({ status: 1, 'schedule.startDate': 1 });

marketingCampaignSchema.virtual('openRate').get(function() {
  return this.stats.sent > 0 ? ((this.stats.opened / this.stats.sent) * 100).toFixed(1) : 0;
});

marketingCampaignSchema.virtual('clickRate').get(function() {
  return this.stats.sent > 0 ? ((this.stats.clicked / this.stats.sent) * 100).toFixed(1) : 0;
});

marketingCampaignSchema.virtual('conversionRate').get(function() {
  return this.stats.sent > 0 ? ((this.stats.conversions / this.stats.sent) * 100).toFixed(1) : 0;
});

const MarketingCampaign = mongoose.model('MarketingCampaign', marketingCampaignSchema);

export default MarketingCampaign;
