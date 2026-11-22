import path from 'path';
import mongoose from 'mongoose';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { Conversation, getConversationKey } from '../models/Conversation.js';
import { deleteUploadedFile } from '../middleware/uploadMiddleware.js';
import { connectionManager } from '../sockets/connectionManager.js';
import { saveFileToGridFS } from '../utils/gridfs.js';

const REACTION_EMOJI_PATTERN =
  /^(?:\p{Extended_Pictographic}(?:\uFE0F)?(?:\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F)?(?:\p{Emoji_Modifier})?)*|\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3)$/u;

/**
 * Message Controller — LANOVA
 * Handles REST conversation history retrieval, file/image uploads,
 * message deletion, and full conversation clearing between authenticated users.
 */

export async function getConversation(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const { userId: otherUserId } = req.params;

    // Validate that the other user ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: 'Invalid recipient user ID format' });
    }

    // Check if other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (otherUserId === currentUserId) {
      return res.status(400).json({ message: 'Cannot open a conversation with yourself' });
    }

    const queryFilter = {
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    };

    const isUnboundedRequest = req.query.limit === 'all';
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = isUnboundedRequest
      ? null
      : Math.min(Math.max(requestedLimit || 50, 1), 100);
    let pageFilter = queryFilter;

    if (req.query.before) {
      if (!mongoose.Types.ObjectId.isValid(req.query.before) || isUnboundedRequest) {
        return res.status(400).json({ message: 'Invalid message history cursor' });
      }

      const cursorMessage = await Message.findOne({
        _id: req.query.before,
        ...queryFilter,
      })
        .select('_id createdAt')
        .lean();
      if (!cursorMessage) {
        return res.status(400).json({ message: 'Message history cursor is not in this conversation' });
      }
      pageFilter = {
        $and: [
          queryFilter,
          {
            $or: [
              { createdAt: { $lt: cursorMessage.createdAt } },
              {
                createdAt: cursorMessage.createdAt,
                _id: { $lt: cursorMessage._id },
              },
            ],
          },
        ],
      };
    }

    const recentQuery = Message.find(pageFilter).sort({ createdAt: -1, _id: -1 });
    if (!isUnboundedRequest) recentQuery.limit(limit + 1);
    const recentMessages = await recentQuery;
    const hasMore = !isUnboundedRequest && recentMessages.length > limit;
    const messages = (isUnboundedRequest ? recentMessages : recentMessages.slice(0, limit)).reverse();

    const pendingDeliveries = messages.filter(
      (message) => message.sender.toString() === otherUserId && !message.deliveredAt
    );
    if (pendingDeliveries.length > 0) {
      const deliveredAt = new Date();
      const messageIds = pendingDeliveries.map((message) => message._id);
      await Message.updateMany(
        { _id: { $in: messageIds }, receiver: currentUserId, deliveredAt: null },
        { $set: { deliveredAt } }
      );
      for (const message of pendingDeliveries) message.deliveredAt = deliveredAt;
      connectionManager.sendToUser(otherUserId, {
        type: 'messages:receipt',
        payload: {
          senderId: otherUserId,
          receiverId: currentUserId,
          lastDeliveredMessageId: pendingDeliveries[pendingDeliveries.length - 1]._id.toString(),
          status: 'delivered',
          timestamp: deliveredAt.toISOString(),
        },
      });
    }

    const conversation = await Conversation.findOne({
      conversationKey: getConversationKey(currentUserId, otherUserId),
    })
      .select('wallpaper wallpaperUpdatedAt')
      .lean();

    return res.status(200).json({
      messages: messages.map((m) => m.toJSON()),
      hasMore,
      nextCursor: hasMore && messages.length ? messages[0]._id.toString() : null,
      wallpaper: conversation?.wallpaper?.url ? conversation.wallpaper : null,
      wallpaperUpdatedAt: conversation?.wallpaperUpdatedAt || null,
    });
  } catch (error) {
    next(error);
  }
}

export async function setConversationWallpaper(req, res, next) {
  let wallpaperSaved = false;
  try {
    const currentUserId = req.user.id;
    const { userId: otherUserId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(otherUserId) || otherUserId === currentUserId) {
      return res.status(400).json({ message: 'A valid conversation partner is required' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No wallpaper image uploaded' });
    }

    const otherUser = await User.findById(otherUserId).select('_id');
    if (!otherUser) {
      deleteUploadedFile(`/uploads/${req.file.filename}`);
      return res.status(404).json({ message: 'User not found' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const persisted = await saveFileToGridFS(
      req.file.filename,
      req.file.path,
      req.file.mimetype
    );
    if (!persisted) {
      deleteUploadedFile(fileUrl);
      return res.status(503).json({ message: 'Wallpaper storage is temporarily unavailable' });
    }

    const conversationKey = getConversationKey(currentUserId, otherUserId);
    const previousConversation = await Conversation.findOne({ conversationKey })
      .select('wallpaper.url')
      .lean();
    const updatedAt = new Date();
    const conversation = await Conversation.findOneAndUpdate(
      { conversationKey },
      {
        $setOnInsert: {
          conversationKey,
          participants: [currentUserId, otherUserId],
        },
        $set: {
          wallpaper: {
            url: fileUrl,
            fileName: req.file.originalname,
            updatedBy: currentUserId,
            updatedAt,
          },
          wallpaperUpdatedAt: updatedAt,
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).select('wallpaper');
    wallpaperSaved = true;

    const wallpaper = {
      url: conversation.wallpaper.url,
      fileName: conversation.wallpaper.fileName,
      updatedBy: conversation.wallpaper.updatedBy.toString(),
      updatedAt: conversation.wallpaper.updatedAt.toISOString(),
    };
    const event = {
      type: 'conversation:wallpaper',
      payload: {
        participantIds: [currentUserId, otherUserId],
        wallpaper,
        updatedAt: updatedAt.toISOString(),
      },
    };
    connectionManager.sendToUser(currentUserId, event);
    connectionManager.sendToUser(otherUserId, event);

    if (previousConversation?.wallpaper?.url && previousConversation.wallpaper.url !== fileUrl) {
      deleteUploadedFile(previousConversation.wallpaper.url);
    }
    return res.status(200).json({
      wallpaper,
      wallpaperUpdatedAt: updatedAt.toISOString(),
    });
  } catch (error) {
    if (req.file && !wallpaperSaved) deleteUploadedFile(`/uploads/${req.file.filename}`);
    next(error);
  }
}

export async function removeConversationWallpaper(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const { userId: otherUserId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(otherUserId) || otherUserId === currentUserId) {
      return res.status(400).json({ message: 'A valid conversation partner is required' });
    }

    const otherUser = await User.findById(otherUserId).select('_id');
    if (!otherUser) return res.status(404).json({ message: 'User not found' });

    const conversationKey = getConversationKey(currentUserId, otherUserId);
    const updatedAt = new Date();
    const conversation = await Conversation.findOneAndUpdate(
      { conversationKey },
      { $set: { wallpaper: null, wallpaperUpdatedAt: updatedAt } },
      { new: false }
    )
      .select('wallpaper')
      .lean();
    const previousUrl = conversation?.wallpaper?.url;

    connectionManager.sendToUser(currentUserId, {
      type: 'conversation:wallpaper',
      payload: {
        participantIds: [currentUserId, otherUserId],
        wallpaper: null,
        updatedAt: updatedAt.toISOString(),
      },
    });
    connectionManager.sendToUser(otherUserId, {
      type: 'conversation:wallpaper',
      payload: {
        participantIds: [currentUserId, otherUserId],
        wallpaper: null,
        updatedAt: updatedAt.toISOString(),
      },
    });

    if (previousUrl) deleteUploadedFile(previousUrl);
    return res.status(200).json({ wallpaper: null, wallpaperUpdatedAt: updatedAt });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle image file upload for chat sharing.
 * Returns relative image URL and file metadata.
 */
export async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const relativeUrl = `/uploads/${req.file.filename}`;

    // Persist to MongoDB GridFS for permanence across container rebuilds/restarts (e.g. Render)
    saveFileToGridFS(req.file.filename, req.file.path, req.file.mimetype).catch(() => {});

    return res.status(201).json({
      success: true,
      imageUrl: relativeUrl,
      imageMeta: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype || 'image/png',
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle generic document and file upload for chat sharing (any extension like WhatsApp).
 * Returns relative file URL and comprehensive file metadata.
 */
export async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const relativeUrl = `/uploads/${req.file.filename}`;
    const ext = path.extname(req.file.originalname).toLowerCase();

    // Persist to MongoDB GridFS for permanence across container rebuilds/restarts (e.g. Render)
    saveFileToGridFS(req.file.filename, req.file.path, req.file.mimetype).catch(() => {});

    return res.status(201).json({
      success: true,
      fileUrl: relativeUrl,
      fileMeta: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype || 'application/octet-stream',
        extension: ext,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Clear all messages in a conversation between authenticated user and target user.
 * Deletes database records, removes associated uploaded files from disk, and
 * notifies the peer in real time via WebSocket.
 */
export async function clearConversation(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const { userId: otherUserId } = req.params;

    // Validate that the other user ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: 'Invalid recipient user ID format' });
    }

    // Check if other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const conversationFilter = {
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    };

    // 1. Find all messages to clean up stored files on disk
    const messagesToDelete = await Message.find(conversationFilter).select(
      'imageUrl fileUrl'
    );
    for (const msg of messagesToDelete) {
      if (msg.imageUrl) deleteUploadedFile(msg.imageUrl);
      if (msg.fileUrl) deleteUploadedFile(msg.fileUrl);
    }

    // 2. Delete all messages exchanged between the two users
    const result = await Message.deleteMany(conversationFilter);

    // 3. Notify the peer in real-time over WebSocket if online
    connectionManager.sendToUser(otherUserId, {
      type: 'conversation:cleared',
      payload: {
        clearedByUserId: currentUserId,
        targetUserId: otherUserId,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Conversation cleared successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an individual message by ID.
 * Authorizes sender or receiver, cleans disk file if attached, and notifies peer.
 */
export async function deleteMessage(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: 'Invalid message ID format' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const senderId = message.sender.toString();
    const receiverId = message.receiver.toString();

    // Verify caller is either sender or receiver
    if (senderId !== currentUserId && receiverId !== currentUserId) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    // Remove file from disk if present
    if (message.imageUrl) deleteUploadedFile(message.imageUrl);
    if (message.fileUrl) deleteUploadedFile(message.fileUrl);

    await Message.deleteOne({ _id: message._id });

    // Notify peer in real time if online
    const peerId = senderId === currentUserId ? receiverId : senderId;
    connectionManager.sendToUser(peerId, {
      type: 'message:deleted',
      payload: {
        messageId,
        peerId: currentUserId,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      messageId,
    });
  } catch (error) {
    next(error);
  }
}

async function findMessageForParticipant(messageId, currentUserId) {
  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    return { status: 400, error: 'Invalid message ID format' };
  }

  const message = await Message.findById(messageId);
  if (!message) return { status: 404, error: 'Message not found' };

  const userId = currentUserId.toString();
  const senderId = message.sender.toString();
  const receiverId = message.receiver.toString();
  if (senderId !== userId && receiverId !== userId) {
    return { status: 403, error: 'Not authorized to modify this message' };
  }

  return { message, senderId, receiverId, userId };
}

export async function editMessage(req, res, next) {
  try {
    const result = await findMessageForParticipant(req.params.messageId, req.user.id);
    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }
    if (result.senderId !== result.userId) {
      return res.status(403).json({ message: 'Only the sender can edit this message' });
    }

    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    if (!content) return res.status(400).json({ message: 'Message content cannot be empty' });
    if (content.length > 5000) {
      return res.status(400).json({ message: 'Message exceeds maximum length of 5000 characters' });
    }

    result.message.content = content;
    result.message.editedAt = new Date();
    await result.message.save();

    const payload = {
      id: result.message._id.toString(),
      senderId: result.senderId,
      receiverId: result.receiverId,
      content: result.message.content,
      editedAt: result.message.editedAt.toISOString(),
    };
    connectionManager.sendToUser(result.receiverId, {
      type: 'message:updated',
      payload,
    });
    if (result.senderId !== result.receiverId) {
      connectionManager.sendToUser(result.senderId, {
        type: 'message:updated',
        payload,
      });
    }

    return res.status(200).json({ success: true, message: result.message.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function toggleMessageReaction(req, res, next) {
  try {
    const result = await findMessageForParticipant(req.params.messageId, req.user.id);
    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }

    const { emoji } = req.body || {};
    if (
      typeof emoji !== 'string' ||
      emoji.length > 32 ||
      !REACTION_EMOJI_PATTERN.test(emoji)
    ) {
      return res.status(400).json({ message: 'Unsupported reaction' });
    }

    const userObjectId = new mongoose.Types.ObjectId(result.userId);
    let updatedMessage = await Message.findOneAndUpdate(
      {
        _id: result.message._id,
        reactions: { $elemMatch: { userId: userObjectId, emoji } },
      },
      { $pull: { reactions: { userId: userObjectId } } },
      { new: true }
    );

    if (!updatedMessage) {
      updatedMessage = await Message.findOneAndUpdate(
        { _id: result.message._id, 'reactions.userId': userObjectId },
        { $set: { 'reactions.$.emoji': emoji } },
        { new: true, runValidators: true }
      );
    }

    if (!updatedMessage) {
      updatedMessage = await Message.findOneAndUpdate(
        { _id: result.message._id, 'reactions.userId': { $ne: userObjectId } },
        { $push: { reactions: { userId: userObjectId, emoji } } },
        { new: true, runValidators: true }
      );
    }

    if (!updatedMessage) {
      return res.status(404).json({ message: 'Message no longer exists' });
    }

    const reactionPayload = updatedMessage.reactions.map((reaction) => ({
      userId: reaction.userId.toString(),
      emoji: reaction.emoji,
    }));
    const payload = {
      messageId: updatedMessage._id.toString(),
      senderId: result.senderId,
      receiverId: result.receiverId,
      reactions: reactionPayload,
    };

    connectionManager.sendToUser(result.senderId, {
      type: 'message:reaction',
      payload,
    });
    if (result.receiverId !== result.senderId) {
      connectionManager.sendToUser(result.receiverId, {
        type: 'message:reaction',
        payload,
      });
    }

    return res.status(200).json({ success: true, reactions: reactionPayload });
  } catch (error) {
    next(error);
  }
}

