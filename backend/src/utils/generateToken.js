import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT for an authenticated user.
 * @param {object} user - User document or object with id and username
 * @returns {string} Signed JWT string
 */
export function generateToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  const payload = {
    id: user.id || user._id.toString(),
    username: user.username,
  };

  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  return jwt.sign(payload, secret, { expiresIn });
}
