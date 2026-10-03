import mongoose from 'mongoose';

/**
 * Message Schema — LANOVA Private Messaging
 * Represents one-to-one messages persisted in MongoDB.
 */
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Message sender is required'],
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Message receiver is required'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Message content cannot be empty'],
      trim: true,
      minlength: [1, 'Message must contain at least 1 character'],
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for rapid conversation history retrieval between two users
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });
messageSchema.index({ receiver: 1, sender: 1, createdAt: 1 });

// Ensure message formatting matches PRD requirements and omits internal fields
messageSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.senderId = ret.sender.toString();
    ret.receiverId = ret.receiver.toString();
    delete ret._id;
    delete ret.sender;
    delete ret.receiver;
    delete ret.__v;
    return ret;
  },
});

export const Message = mongoose.model('Message', messageSchema);
