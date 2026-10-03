import { User } from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export async function register(req, res, next) {
  try {
    const { username, password } = req.body;
    const normalizedUsername = username.trim().toLowerCase();

    // Check if username is already registered
    const userExists = await User.findOne({ username: normalizedUsername });
    if (userExists) {
      return res.status(409).json({
        message: 'Username is already taken. Please choose another username.',
      });
    }

    // Hash password with bcrypt (12 salt rounds)
    const passwordHash = await User.hashPassword(password);

    // Create user in MongoDB
    const user = await User.create({
      username: normalizedUsername,
      passwordHash,
    });

    // Return safe user object (no password or hash)
    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Authenticate user & return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const normalizedUsername = username.trim().toLowerCase();

    // Find user by normalized username
    const user = await User.findOne({ username: normalizedUsername });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid username or password',
      });
    }

    // Verify bcrypt password hash
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid username or password',
      });
    }

    // Generate signed JWT
    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get currently authenticated user details
 * @route   GET /api/auth/me
 * @access  Private (JWT required)
 */
export async function getMe(req, res) {
  return res.status(200).json({
    user: {
      id: req.user.id,
      username: req.user.username,
      createdAt: req.user.createdAt,
    },
  });
}
