const createError = require('http-errors');
const UserAttempt = require('../models/UserAttempt');
const User = require('../Modals/UserModal');
const TestSession = require('../models/TestSession');

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

/**
 * Get mock test leaderboard
 * GET /api/mcq/leaderboard/mock-test/:mockTestNumber
 */
const getMockTestLeaderboard = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const { mockTestNumber } = req.params;

    if (!mockTestNumber) {
      return next(createError(400, 'Mock test number is required'));
    }

    const mockTestNum = parseInt(mockTestNumber, 10);
    if (isNaN(mockTestNum)) {
      return next(createError(400, 'Invalid mock test number'));
    }

    // Find all completed test sessions for this mock test
    const sessions = await TestSession.find({
      testType: 'mocktest',
      mockTestNumber: mockTestNum,
      status: 'completed',
    })
      .select('user score totalQuestions completedAt')
      .sort({ score: -1, completedAt: 1 }) // Sort by score descending, then by completion time (earlier first for same score)
      .limit(100)
      .lean();

    if (sessions.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Get unique user IDs (in case a user has multiple attempts, we'll take the best one)
    const userScoreMap = new Map();
    sessions.forEach((session) => {
      const userIdStr = session.user.toString();
      if (!userScoreMap.has(userIdStr) || userScoreMap.get(userIdStr).score < session.score) {
        userScoreMap.set(userIdStr, {
          userId: userIdStr,
          score: session.score || 0,
          totalQuestions: session.totalQuestions || 0,
          completedAt: session.completedAt,
        });
      }
    });

    // Convert map to array and sort by score descending
    const leaderboardData = Array.from(userScoreMap.values())
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // If scores are equal, earlier completion time ranks higher
        return new Date(a.completedAt) - new Date(b.completedAt);
      })
      .slice(0, 100);

    // Get user details
    const userIds = leaderboardData.map((entry) => entry.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('fullName email')
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // Build leaderboard with user info
    const leaderboard = leaderboardData.map((entry, index) => {
      const user = userMap.get(entry.userId);
      return {
        id: entry.userId,
        name: user?.fullName || 'Anonymous',
        score: parseFloat((entry.score || 0).toFixed(1)),
        rank: index + 1,
        isCurrentUser: entry.userId === userId,
        totalCorrect: Math.round(entry.score || 0), // Approximate correct count
        totalAttempts: entry.totalQuestions || 0,
      };
    });

    res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error('Error getting mock test leaderboard:', error);
    return next(createError(500, 'Failed to fetch mock test leaderboard'));
  }
};

module.exports = {
  getLeaderboard,
  getUserRank,
  getMockTestLeaderboard,
};




