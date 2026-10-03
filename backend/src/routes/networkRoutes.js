import express from 'express';
import { getNetworkInfo } from '../controllers/networkController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Retrieve network details (protected by JWT authentication)
router.get('/info', authenticateToken, getNetworkInfo);

export default router;
