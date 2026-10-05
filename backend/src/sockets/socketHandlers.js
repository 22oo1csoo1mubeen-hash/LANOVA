import mongoose from 'mongoose';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { connectionManager } from './connectionManager.js';

/**
 * Socket Handlers — LANOVA Milestone 2
 * Handles incoming WebSocket application events.
 */

/**
 * Handle incoming message from an authenticated client.
 * @param {WebSocket} ws
 * @param {object} user - Authenticated user document
 * @param {string|Buffer} rawData
 */
export async function handleSocketMessage(ws, user, rawData) {
  let messageData;

  try {
    messageData = JSON.parse(rawData.toString());
  } catch (err) {
    return connectionManager.send(ws, {
      type: 'error',
      payload: { message: 'Malformed JSON payload' },
    });
  }

  const { type, payload } = messageData || {};

  switch (type) {
    case 'message:send':
      await handleSendMessage(ws, user, payload);
      break;

    case 'users:online':
      connectionManager.send(ws, {
        type: 'users:online',
        payload: {
          onlineUserIds: connectionManager.getOnlineUserIds(),
        },
      });
      break;

    default:
      connectionManager.send(ws, {
        type: 'error',
        payload: { message: `Unsupported event type: ${type}` },
      });
      break;
  }
}

/**
 * Handle private message send event.
 * @param {WebSocket} ws
 * @param {object} sender - Authenticated sender document
 * @param {object} payload - { receiverId, content }
 */
async function handleSendMessage(ws, sender, payload) {
  try {
    const { receiverId, content, messageType = 'text', imageUrl, imageMeta } = payload || {};

    // 1. Validate payload presence
    if (!receiverId || typeof receiverId !== 'string') {
      return connectionManager.send(ws, {
        type: 'error',
        payload: { message: 'Receiver ID is required' },
      });
    }

    // 2. Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return connectionManager.send(ws, {
        type: 'error',
        payload: { message: 'Invalid receiver ID format' },
      });
    }

    // 3. Prevent sending message to oneself
    const senderId = sender._id.toString();
    if (receiverId === senderId) {
      return connectionManager.send(ws, {
        type: 'error',
        payload: { message: 'Cannot send messages to yourself' },
      });
    }

    // 4. Validate message content and image
    const hasImage = Boolean(imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0);
    const trimmedContent = typeof content === 'string' ? content.trim() : '';

    if (!hasImage && trimmedContent.length === 0) {
      return connectionManager.send(ws, {
        type: 'error',
        payload: { message: 'Message content cannot be empty' },
      });
    }

    if (trimmedContent.length > 5000) {
      return connectionManager.send(ws, {
        type: 'error',
        payload: { message: 'Message exceeds maximum length of 5000 characters' },
      });
    }

    // 5. Verify that recipient exists in the database
    const recipient = await User.findById(receiverId);
    if (!recipient) {
      return connectionManager.send(ws, {
        type: 'error',
        payload: { message: 'Recipient user does not exist' },
      });
    }

    // 6. Persist message in MongoDB FIRST (guarantee persistence before delivery attempt)
    const isImage = hasImage || messageType === 'image';
    const savedMessage = await Message.create({
      sender: sender._id,
      receiver: receiverId,
      content: trimmedContent,
      messageType: isImage ? 'image' : 'text',
      imageUrl: hasImage ? imageUrl.trim() : null,
      imageMeta: isImage && imageMeta ? {
        fileName: imageMeta.fileName || 'image',
        fileSize: Number(imageMeta.fileSize) || 0,
        mimeType: imageMeta.mimeType || 'image/png',
      } : undefined,
    });

    const messagePayload = {
      id: savedMessage._id.toString(),
      senderId,
      receiverId,
      content: savedMessage.content,
      messageType: savedMessage.messageType,
      imageUrl: savedMessage.imageUrl,
      imageMeta: savedMessage.imageMeta,
      createdAt: savedMessage.createdAt.toISOString(),
    };

    // 7. Send save acknowledgement back to the sender
    connectionManager.send(ws, {
      type: 'message:sent',
      payload: {
        ...messagePayload,
        status: 'saved',
      },
    });

    // 8. If recipient is online, deliver the message in real-time over TCP WebSocket
    if (connectionManager.isUserOnline(receiverId)) {
      connectionManager.sendToUser(receiverId, {
        type: 'message:received',
        payload: messagePayload,
      });
    }
  } catch (error) {
    console.error('[Socket Error] Failed to process message:send:', error.message);
    connectionManager.send(ws, {
      type: 'error',
      payload: { message: 'Failed to process message' },
    });
  }
}
