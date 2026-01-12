import mongoose from 'mongoose';

const { Schema } = mongoose;

const interactionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'message', 'note'],
      required: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      trim: true,
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      default: 'outbound',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'scheduled', 'cancelled'],
      default: 'completed',
    },
    scheduledAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

const accountManagerSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      default: 'Account Manager',
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    availability: {
      type: String,
      enum: ['available', 'busy', 'away', 'offline'],
      default: 'available',
    },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      timezone: { type: String, default: 'UTC' },
    },
    specializations: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const accountManagerAssignmentSchema = new Schema(
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
    manager: {
      type: Schema.Types.ObjectId,
      ref: 'AccountManager',
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    interactions: [interactionSchema],
    notes: {
      type: String,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'vip'],
      default: 'normal',
    },
    nextFollowUp: {
      type: Date,
    },
  },
  { timestamps: true }
);

accountManagerAssignmentSchema.index({ store: 1 }, { unique: true });
accountManagerAssignmentSchema.index({ seller: 1 });
accountManagerAssignmentSchema.index({ manager: 1 });

const AccountManager = mongoose.model('AccountManager', accountManagerSchema);
const AccountManagerAssignment = mongoose.model('AccountManagerAssignment', accountManagerAssignmentSchema);

export { AccountManager, AccountManagerAssignment };
