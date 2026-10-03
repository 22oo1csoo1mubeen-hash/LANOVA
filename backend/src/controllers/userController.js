import { User } from '../models/User.js';

/**
 * @desc    Get all registered users (excluding the currently authenticated user)
 * @route   GET /api/users
 * @access  Private (JWT required)
 */
export async function getUsers(req, res, next) {
  try {
    const currentUserId = req.user._id;

    // Find all users except the caller
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('-passwordHash')
      .sort({ username: 1 });

    const safeUsers = users.map((u) => ({
      id: u.id,
      username: u.username,
      createdAt: u.createdAt,
    }));

    return res.status(200).json({
      users: safeUsers,
    });
  } catch (error) {
    next(error);
  }
}
