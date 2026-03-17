const createError = require('http-errors');
const mongoose = require('mongoose');
const User = require('../Modals/UserModal');
const PaymentEventLog = require('../models/PaymentEventLog');

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
      .select('fullName email group createdAt premiumActivatedAt')
      .sort({ premiumActivatedAt: -1, createdAt: -1 })
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
 * Escape a value for CSV (quote if contains comma, newline, or double quote)
 */
const escapeCsv = (val) => {
  if (val === undefined || val === null) return '';
  const s = String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

/**
 * Export all users as CSV (Admin only)
 * GET /api/mcq/admin/users/export
 */
const exportAllUsersAsCsv = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.subscription) filter.subscription = req.query.subscription;
    if (req.query.group) filter.group = req.query.group;
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      const search = String(req.query.search).trim();
      if (search) {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [
          { fullName: regex },
          { email: regex },
          { phoneNumber: regex },
        ];
      }
    }
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        const start = new Date(req.query.startDate);
        if (!Number.isNaN(start.getTime())) {
          filter.createdAt.$gte = start;
        }
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        if (!Number.isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    const freeCount = users.filter((u) => u.subscription === 'free').length;
    const premiumCount = users.filter((u) => u.subscription === 'premium').length;

    const lines = [
      'Summary (all users)',
      `Total,${users.length}`,
      `Free,${freeCount}`,
      `Premium,${premiumCount}`,
      '',
      'No.,Name,Email,Mobile,Group,Subscription,Joined/PremiumSince',
      ...users.map((user, i) => {
        const effectiveDate =
          user.subscription === 'premium' && user.premiumActivatedAt
            ? user.premiumActivatedAt
            : user.createdAt;
        const joined = effectiveDate
          ? new Date(effectiveDate).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })
          : '';
        return [
          i + 1,
          escapeCsv(user.fullName),
          escapeCsv(user.email),
          escapeCsv(user.phoneNumber),
          escapeCsv(user.group),
          escapeCsv(user.subscription),
          escapeCsv(joined),
        ].join(',');
      }),
    ];
    const csv = '\uFEFF' + lines.join('\r\n');
    const filename = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting users CSV:', error);
    return next(createError(500, 'Failed to export users'));
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
    if (req.query.search) {
      const search = String(req.query.search).trim();
      if (search) {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [
          { fullName: regex },
          { email: regex },
          { phoneNumber: regex },
        ];
      }
    }
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        const start = new Date(req.query.startDate);
        if (!Number.isNaN(start.getTime())) {
          filter.createdAt.$gte = start;
        }
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        if (!Number.isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }
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

/**
 * Get premium users with pagination (Admin only)
 * GET /api/mcq/admin/premium-users
 */
const getPremiumUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = { subscription: 'premium' };
    if (req.query.group) {
      filter.group = req.query.group;
    }
    if (req.query.role) {
      filter.role = req.query.role;
    }
    if (req.query.search) {
      const search = String(req.query.search).trim();
      if (search) {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [
          { fullName: regex },
          { email: regex },
          { phoneNumber: regex },
        ];
      }
    }
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        const start = new Date(req.query.startDate);
        if (!Number.isNaN(start.getTime())) {
          filter.createdAt.$gte = start;
        }
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        if (!Number.isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }
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
    console.error('Error getting premium users:', error);
    return next(createError(500, 'Failed to fetch premium users'));
  }
};

/**
 * Get payment/order event logs (Admin only)
 * GET /api/mcq/admin/payment-logs
 */
const getPaymentLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;
    const event = req.query.event;
    const userId = req.query.userId;

    const filter = {};
    if (event) filter.event = event;
    if (userId) filter.userId = new mongoose.Types.ObjectId(userId);

    const logs = await PaymentEventLog.find(filter)
      .populate('userId', 'fullName email phoneNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await PaymentEventLog.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit) || 1,
          total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error getting payment logs:', error);
    return next(createError(500, 'Failed to fetch payment logs'));
  }
};

/**
 * Update user subscription (Admin only)
 * PUT /api/mcq/admin/users/:userId/subscription
 * Body: { subscription: 'free' | 'premium' }
 */
const updateUserSubscription = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { subscription } = req.body;

    if (!['free', 'premium'].includes(subscription)) {
      return next(createError(400, 'subscription must be "free" or "premium"'));
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return next(createError(404, 'User not found'));
    }

    user.subscription = subscription;
    if (subscription === 'premium' && !user.premiumActivatedAt) {
      user.premiumActivatedAt = new Date();
    }
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User subscription set to ${subscription}`,
      data: { user },
    });
  } catch (error) {
    console.error('Error updating user subscription:', error);
    return next(createError(500, 'Failed to update subscription'));
  }
};

module.exports = {
  getUserStats,
  getAllUsers,
  getPremiumUsers,
  exportAllUsersAsCsv,
  getPaymentLogs,
  updateUserSubscription,
};








