const createError = require('http-errors');
const User = require('../Modals/UserModal');

/**
 * Get user statistics (Admin only)
 * GET /api/mcq/admin/stats/users
 */
const getUserStats = async (req, res, next) => {
  try {
    // Get total users
    const totalUsers = await User.countDocuments();

    // Get free users
    const freeUsers = await User.countDocuments({ subscription: 'free' });

    // Get premium users
    const premiumUsers = await User.countDocuments({ subscription: 'premium' });

    // Get premium users grouped by group
    const premiumUsersByGroup = await User.aggregate([
      {
        $match: {
          subscription: 'premium',
        },
      },
      {
        $group: {
          _id: '$group',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Format the group data
    const groupStats = premiumUsersByGroup.map((item) => ({
      group: item._id || 'No Group',
      count: item.count,
    }));

    // Get all premium users with their details
    const premiumUsersDetails = await User.find({
      subscription: 'premium',
    })
      .select('fullName email group createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        freeUsers,
        premiumUsers,
        premiumUsersByGroup: groupStats,
        premiumUsersDetails,
      },
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    return next(createError(500, 'Failed to fetch user statistics'));
  }
};

/**
 * Get all users with pagination (Admin only)
 * GET /api/mcq/admin/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.subscription) {
      filter.subscription = req.query.subscription;
    }
    if (req.query.group) {
      filter.group = req.query.group;
    }
    if (req.query.role) {
      filter.role = req.query.role;
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error getting users:', error);
    return next(createError(500, 'Failed to fetch users'));
  }
};

module.exports = {
  getUserStats,
  getAllUsers,
};

