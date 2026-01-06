import mongoose from 'mongoose';

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    icon: String,
    type: {
      type: String,
      enum: ['order', 'promotion', 'system', 'payment', 'shipping', 'review'],
      default: 'system',
    },
    link: { type: String, trim: true },
    data: Schema.Types.Mixed,
    readAt: Date,
    expiresAt: Date,
    channels: {
      email: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
    priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ readAt: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $exists: true } } });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
