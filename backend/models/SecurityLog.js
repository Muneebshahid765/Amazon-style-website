import mongoose from 'mongoose';

const { Schema } = mongoose;

const securityLogSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
    },
    type: {
      type: String,
      enum: ['login', 'logout', 'failed_login', 'password_change', 'settings_change', '2fa_enabled', '2fa_disabled', 'api_key_generated', 'api_key_revoked', 'suspicious_activity'],
      required: true,
    },
    status: {
      type: String,
      enum: ['success', 'warning', 'error'],
      default: 'success',
    },
    message: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    location: {
      city: String,
      country: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

securityLogSchema.index({ user: 1, createdAt: -1 });
securityLogSchema.index({ store: 1, createdAt: -1 });
securityLogSchema.index({ type: 1 });

const SecurityLog = mongoose.model('SecurityLog', securityLogSchema);

export default SecurityLog;
