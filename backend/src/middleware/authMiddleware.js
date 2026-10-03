import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

/**
 * Protect routes by verifying Bearer JWT and attaching authenticated user to req.user.
 */
export async function protect(req, res, next) {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      message: 'Authentication required. No token provided.',
    });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is missing from server configuration');
    }

    const decoded = jwt.verify(token, secret);

    // Fetch user from DB to ensure user still exists and attach fresh details
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        message: 'User no longer exists. Please re-authenticate.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Authentication token has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      message: 'Invalid authentication token. Authorization denied.',
    });
  }
}

export const authenticateToken = protect;
