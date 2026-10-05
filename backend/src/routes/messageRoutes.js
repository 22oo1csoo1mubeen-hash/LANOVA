import express from 'express';
import { getConversation, uploadImage } from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { handleImageUpload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Upload image file for message sharing
router.post('/upload', authenticateToken, handleImageUpload, uploadImage);

// Retrieve conversation history with a specific user
router.get('/:userId', authenticateToken, getConversation);

export default router;

