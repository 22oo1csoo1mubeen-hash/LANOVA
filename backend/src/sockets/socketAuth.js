import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

/**
 * Socket Authentication — LANOVA Milestone 2
 * Verifies JWT tokens for WebSocket connections.
 */

/**
 * Verify a JWT token string and return the corresponding User document.
 * @param {string} token
 * @returns {Promise<object>} User document
 */
export async function verifySocketToken(token) {
  if (!token) {
    throw new Error('Authentication token is required');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured on the server');
  }

  // Verify signature and expiration
  const decoded = jwt.verify(token, secret);

  // Retrieve user from database to ensure account is valid
  const user = await User.findById(decoded.id).select('-passwordHash');
  if (!user) {
    throw new Error('User not found or account deactivated');
  }

  return user;
}

/**
 * Extract token from connection HTTP upgrade request (URL query or headers).
 * @param {http.IncomingMessage} req
 * @returns {string|null}
 */
export function extractTokenFromRequest(req) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const token = url.searchParams.get('token');
    if (token) return token;

    // Also check Sec-WebSocket-Protocol or Authorization header if present
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      return req.headers.authorization.substring(7);
    }
  } catch (err) {
    // URL parsing failed
  }
  return null;
}
