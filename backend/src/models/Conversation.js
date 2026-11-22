import mongoose from 'mongoose';

export function getConversationKey(firstUserId, secondUserId) {
  return [firstUserId.toString(), secondUserId.toString()].sort().join(':');
}

const conversationSchema = new mongoose.Schema(
  {
    conversationKey: {
      type: String,
      required: true,
      unique: true,
    },
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
      required: true,
      validate: {
        validator: (participants) =>
          participants.length === 2 &&
          new Set(participants.map((participant) => participant.toString())).size === 2,
        message: 'A conversation must have two distinct participants',
      },
    },
    wallpaper: {
      url: { type: String, default: null },
      fileName: { type: String, default: null },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      updatedAt: { type: Date, default: null },
    },
    wallpaperUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const Conversation = mongoose.model('Conversation', conversationSchema);
