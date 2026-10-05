import mongoose from 'mongoose';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';

/**
 * Message Controller — LANOVA Milestone 2
 * Handles REST conversation history retrieval between authenticated users.
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

    // Enforce message limit
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);

    // Retrieve conversation history between these two users only
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: 1, _id: 1 })
      .limit(limit);

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
        mimeType: req.file.mimetype,
      },
    });
  } catch (error) {
    next(error);
  }
}
