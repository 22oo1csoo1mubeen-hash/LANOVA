import express from 'express';
import {
  getConversation,
  uploadImage,
  uploadFile,
  clearConversation,
  deleteMessage,
  editMessage,
  toggleMessageReaction,
} from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { handleImageUpload, handleFileUpload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Upload image file for message sharing
router.post('/upload', authenticateToken, handleImageUpload, uploadImage);

// Upload generic file/document with any extension (WhatsApp style)
router.post('/upload-file', authenticateToken, handleFileUpload, uploadFile);

// Delete an individual message
router.delete('/item/:messageId', authenticateToken, deleteMessage);
router.put('/item/:messageId', authenticateToken, editMessage);
router.post('/item/:messageId/reactions', authenticateToken, toggleMessageReaction);

// Retrieve conversation history with a specific user
router.get('/:userId', authenticateToken, getConversation);

// Clear full conversation history with a specific user
router.delete('/:userId', authenticateToken, clearConversation);

export default router;

