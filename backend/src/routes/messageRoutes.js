import express from 'express';
import { getConversation } from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Retrieve conversation history with a specific user
router.get('/:userId', authenticateToken, getConversation);

export default router;
