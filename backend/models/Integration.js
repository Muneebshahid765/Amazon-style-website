import mongoose from 'mongoose';

const { Schema } = mongoose;

const integrationSchema = new Schema(
  {
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['shopify', 'woocommerce', 'quickbooks', 'salesforce', 'hubspot', 'mailchimp', 'zapier', 'slack', 'stripe', 'custom'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'inactive', 'error'],
      default: 'pending',
    },
    config: {
      apiKey: { type: String, select: false },
      apiSecret: { type: String, select: false },
      webhookUrl: String,
      accessToken: { type: String, select: false },
      refreshToken: { type: String, select: false },
      expiresAt: Date,
      customSettings: Schema.Types.Mixed,
    },
    lastSyncAt: {
      type: Date,
    },
    syncStatus: {
      type: String,
      enum: ['idle', 'syncing', 'success', 'failed'],
      default: 'idle',
    },
    syncError: {
      type: String,
    },
    stats: {
      totalSyncs: { type: Number, default: 0 },
      successfulSyncs: { type: Number, default: 0 },
      failedSyncs: { type: Number, default: 0 },
      itemsSynced: { type: Number, default: 0 },
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    requestedAt: {
      type: Date,
    },
    requestNotes: {
      type: String,
    },
  },
  { timestamps: true }
);

integrationSchema.index({ store: 1, type: 1 });
integrationSchema.index({ store: 1, status: 1 });

const Integration = mongoose.model('Integration', integrationSchema);

export default Integration;
