const createError = require('http-errors');
const UserAttempt = require('../models/UserAttempt');
const User = require('../Modals/UserModal');

/**
 * Get leaderboard
 * GET /api/mcq/leaderboard
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const { timeframe = 'all-time' } = req.query; // 'month' or 'all-time'

    // Calculate date filter
    let dateFilter = {};
    if (timeframe === 'month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      dateFilter = { answeredAt: { $gte: startOfMonth } };
    }

    // Aggregate user scores
    // Optimized for large datasets: use allowDiskUse for large aggregations
    const leaderboardData = await UserAttempt.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$user',
          totalCorrect: {
            $sum: {
              $cond: ['$isCorrect', 1, 0],
            },
          },
          totalAttempts: { $sum: 1 },
        },
      },
      {
        $project: {
          userId: '$_id',
          score: {
            $multiply: [
              {
                $divide: ['$totalCorrect', { $max: ['$totalAttempts', 1] }],
              },
              200, // Scale to 200 (MHT CET total marks)
            ],
          },
          totalCorrect: 1,
          totalAttempts: 1,
        },
      },
      { $sort: { score: -1 } },
      { $limit: 100 },
    ]).allowDiskUse(true); // Allow disk use for large aggregations (30K+ users)

    // Get user details
    const userIds = leaderboardData.map((entry) => entry.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('fullName email')
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // Build leaderboard with user info
    const leaderboard = leaderboardData.map((entry, index) => {
      const user = userMap.get(entry.userId.toString());
      return {
        id: entry.userId.toString(),
        name: user?.fullName || 'Anonymous',
        score: parseFloat(entry.score.toFixed(1)),
        rank: index + 1,
        isCurrentUser: entry.userId.toString() === userId,
        totalCorrect: entry.totalCorrect,
        totalAttempts: entry.totalAttempts,
      };
    });

    res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return next(createError(500, 'Failed to fetch leaderboard'));
  }
};

/**
 * Get user's current rank
 * GET /api/mcq/leaderboard/my-rank
 */
const getUserRank = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const { timeframe = 'all-time' } = req.query;

    // Calculate date filter
    let dateFilter = {};
    if (timeframe === 'month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      dateFilter = { answeredAt: { $gte: startOfMonth } };
    }

    // Aggregate user scores
    const leaderboardData = await UserAttempt.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$user',
          totalCorrect: {
            $sum: {
              $cond: ['$isCorrect', 1, 0],
            },
          },
          totalAttempts: { $sum: 1 },
        },
      },
      {
        $project: {
          userId: '$_id',
          score: {
            $multiply: [
              {
                $divide: ['$totalCorrect', { $max: ['$totalAttempts', 1] }],
              },
              200,
            ],
          },
          totalCorrect: 1,
          totalAttempts: 1,
        },
      },
      { $sort: { score: -1 } },
    ]).allowDiskUse(true);

    // Find user's rank
    const userIndex = leaderboardData.findIndex(
      (entry) => entry.userId.toString() === userId
    );

    const rank = userIndex >= 0 ? userIndex + 1 : null;
    const userData = userIndex >= 0 ? leaderboardData[userIndex] : null;

    res.status(200).json({
      success: true,
      data: {
        rank: rank,
        score: userData ? parseFloat(userData.score.toFixed(1)) : 0,
        totalCorrect: userData?.totalCorrect || 0,
        totalAttempts: userData?.totalAttempts || 0,
      },
    });
  } catch (error) {
    console.error('Error getting user rank:', error);
    return next(createError(500, 'Failed to fetch user rank'));
  }
};

module.exports = {
  getLeaderboard,
  getUserRank,
};




