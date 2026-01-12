import mongoose from 'mongoose';

const { Schema } = mongoose;

const teamMemberSchema = new Schema(
  {
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'sales', 'support', 'staff'],
      default: 'staff',
    },
    permissions: {
      manageProducts: { type: Boolean, default: false },
      manageOrders: { type: Boolean, default: false },
      viewAnalytics: { type: Boolean, default: false },
      manageTeam: { type: Boolean, default: false },
      manageSettings: { type: Boolean, default: false },
      manageCoupons: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'inactive', 'removed'],
      default: 'pending',
    },
    inviteToken: {
      type: String,
      select: false,
    },
    inviteTokenExpiry: {
      type: Date,
      select: false,
    },
    joinedAt: {
      type: Date,
    },
    lastActiveAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

teamMemberSchema.index({ store: 1, email: 1 }, { unique: true });
teamMemberSchema.index({ store: 1, status: 1 });
teamMemberSchema.index({ inviteToken: 1 });

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);

export default TeamMember;
