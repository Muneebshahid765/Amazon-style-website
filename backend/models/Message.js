import mongoose from 'mongoose';

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['user', 'admin'], required: true },
    message: { type: String, required: true, trim: true },
    attachments: [
      {
        url: String,
        type: String,
        name: String,
      },
    ],
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    readAt: Date,
  },
  { timestamps: true }
);

messageSchema.index({ order: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
