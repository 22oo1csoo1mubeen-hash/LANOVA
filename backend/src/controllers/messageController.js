import path from 'path';
import mongoose from 'mongoose';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { deleteUploadedFile } from '../middleware/uploadMiddleware.js';
import { connectionManager } from '../sockets/connectionManager.js';

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

    const queryFilter = {
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    };

    let messages;
    // If a specific limit is provided, fetch the most recent messages in chronological order
    if (req.query.limit && req.query.limit !== 'all') {
      const limit = Math.max(1, parseInt(req.query.limit, 10) || 500);
      const recent = await Message.find(queryFilter)
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit);
      messages = recent.reverse();
    } else {
      // Default: retrieve complete conversation history chronologically (no arbitrary cutoff)
      messages = await Message.find(queryFilter).sort({ createdAt: 1, _id: 1 });
    }

    return res.status(200).json({
      messages: messages.map((m) => m.toJSON()),
    });
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


