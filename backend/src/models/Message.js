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
      trim: true,
      default: '',
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
      validate: {
        validator: function (v) {
          // If this message contains an image, text content/caption is optional
          if (this.messageType === 'image' || this.imageUrl) {
            return true;
          }
          return typeof v === 'string' && v.trim().length > 0;
        },
        message: 'Message content cannot be empty',
      },
    },
    messageType: {
      type: String,
      enum: ['text', 'image'],
      default: 'text',
      index: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    imageMeta: {
      fileName: { type: String, default: null },
      fileSize: { type: Number, default: null },
      mimeType: { type: String, default: null },
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
    ret.messageType = ret.messageType || (ret.imageUrl ? 'image' : 'text');
    ret.imageUrl = ret.imageUrl || null;
    ret.imageMeta = ret.imageMeta || null;
    delete ret._id;
    delete ret.sender;
    delete ret.receiver;
    delete ret.__v;
    return ret;
  },
});

export const Message = mongoose.model('Message', messageSchema);
