const createError = require('http-errors');
const UserAttempt = require('../models/UserAttempt');
const User = require('../Modals/UserModal');
const TestSession = require('../models/TestSession');
const MockTestModel = require('../models/MockTest');
const PyqMockTestModel = require('../models/PyqMockTest');

const getQuestionSubjectName = (question) =>
  String(question?.subject || question?.originalSubject || question?.sub || '').trim();

/**
 * Get leaderboard
 * GET /api/mcq/leaderboard
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const { timeframe = 'all-time' } = req.query; // 'month' or 'all-time'

    // Calculate date filters for attempts and tests
    let attemptsDateFilter = {};
    let testsDateFilter = {};
    if (timeframe === 'month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      attemptsDateFilter = { answeredAt: { $gte: startOfMonth } };
      testsDateFilter = { completedAt: { $gte: startOfMonth } };
    }

    // Aggregate scores from individual attempts
    const attemptsAgg = await UserAttempt.aggregate([
      { $match: attemptsDateFilter },
      {
        $group: {
          _id: '$user',
          totalAttempts: { $sum: 1 },
          totalCorrect: {
            $sum: {
              $cond: ['$isCorrect', 1, 0],
            },
          },
        },
      },
    ]).allowDiskUse(true);

    // Aggregate scores from completed tests (excluding mock-style tests)
    const testsAgg = await TestSession.aggregate([
      {
        $match: {
          status: 'completed',
          testType: { $nin: ['mocktest', 'pyq-mocktest'] },
          ...testsDateFilter,
        },
      },
      {
        $group: {
          _id: '$user',
          totalAttempts: { $sum: '$totalQuestions' },
          totalCorrect: { $sum: '$score' },
        },
      },
    ]).allowDiskUse(true);

    // Merge attempts and tests into a single per-user map
    const userStatsMap = new Map();

    attemptsAgg.forEach((stat) => {
      if (!stat?._id) return;
      const id = stat._id.toString();
      userStatsMap.set(id, {
        userId: id,
        totalAttempts: stat.totalAttempts || 0,
        totalCorrect: stat.totalCorrect || 0,
      });
    });

    testsAgg.forEach((stat) => {
      if (!stat?._id) return;
      const id = stat._id.toString();
      const existing = userStatsMap.get(id) || {
        userId: id,
        totalAttempts: 0,
        totalCorrect: 0,
      };
      userStatsMap.set(id, {
        userId: id,
        totalAttempts: (existing.totalAttempts || 0) + (stat.totalAttempts || 0),
        totalCorrect: (existing.totalCorrect || 0) + (stat.totalCorrect || 0),
      });
    });

    // Build sorted leaderboard data (score = totalCorrect from attempts + tests)
    const leaderboardData = Array.from(userStatsMap.values())
      .map((entry) => ({
        ...entry,
        score: entry.totalCorrect || 0,
      }))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 100);

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

    // Calculate date filters for attempts and tests
    let attemptsDateFilter = {};
    let testsDateFilter = {};
    if (timeframe === 'month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      attemptsDateFilter = { answeredAt: { $gte: startOfMonth } };
      testsDateFilter = { completedAt: { $gte: startOfMonth } };
    }

    // Aggregate from attempts
    const attemptsAgg = await UserAttempt.aggregate([
      { $match: attemptsDateFilter },
      {
        $group: {
          _id: '$user',
          totalAttempts: { $sum: 1 },
          totalCorrect: {
            $sum: {
              $cond: ['$isCorrect', 1, 0],
            },
          },
        },
      },
    ]).allowDiskUse(true);

    // Aggregate from tests (excluding mock-style tests)
    const testsAgg = await TestSession.aggregate([
      {
        $match: {
          status: 'completed',
          testType: { $nin: ['mocktest', 'pyq-mocktest'] },
          ...testsDateFilter,
        },
      },
      {
        $group: {
          _id: '$user',
          totalAttempts: { $sum: '$totalQuestions' },
          totalCorrect: { $sum: '$score' },
        },
      },
    ]).allowDiskUse(true);

    // Merge into single map
    const userStatsMap = new Map();

    attemptsAgg.forEach((stat) => {
      if (!stat?._id) return;
      const id = stat._id.toString();
      userStatsMap.set(id, {
        userId: id,
        totalAttempts: stat.totalAttempts || 0,
        totalCorrect: stat.totalCorrect || 0,
      });
    });

    testsAgg.forEach((stat) => {
      if (!stat?._id) return;
      const id = stat._id.toString();
      const existing = userStatsMap.get(id) || {
        userId: id,
        totalAttempts: 0,
        totalCorrect: 0,
      };
      userStatsMap.set(id, {
        userId: id,
        totalAttempts: (existing.totalAttempts || 0) + (stat.totalAttempts || 0),
        totalCorrect: (existing.totalCorrect || 0) + (stat.totalCorrect || 0),
      });
    });

    // Build sorted list to determine rank
    const leaderboardData = Array.from(userStatsMap.values())
      .map((entry) => ({
        ...entry,
        score: entry.totalCorrect || 0,
      }))
      .sort((a, b) => (b.score || 0) - (a.score || 0));

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
      .select('user score totalQuestions completedAt answers.questionId answers.isCorrect')
      .sort({ score: -1, completedAt: 1 }) // Sort by score descending, then by completion time (earlier first for same score)
      .limit(100)
      .lean();

    if (sessions.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const allCorrectQuestionIds = sessions
      .flatMap((session) =>
        (session.answers || [])
          .filter((answer) => Boolean(answer?.isCorrect) && answer?.questionId)
          .map((answer) => answer.questionId)
      );

    const questions = allCorrectQuestionIds.length
      ? await MockTestModel.find({ _id: { $in: allCorrectQuestionIds } })
          .select('subject originalSubject sub')
          .lean()
      : [];

    const questionSubjectMap = new Map(
      questions.map((question) => [question._id.toString(), getQuestionSubjectName(question)])
    );

    const resolveSessionScore = (session) => {
      const baseScore = Number(session?.score) || 0;
      if (baseScore > 0) {
        return baseScore;
      }

      const answers = Array.isArray(session?.answers) ? session.answers : [];
      if (answers.length === 0) {
        return baseScore;
      }

      let recoveredMarks = 0;
      for (const answer of answers) {
        if (!answer?.isCorrect || !answer?.questionId) {
          continue;
        }

        const subject = questionSubjectMap.get(answer.questionId.toString());
        if (subject === 'Maths' || subject === 'Mathematics') {
          recoveredMarks += 2;
        } else if (subject === 'Physics' || subject === 'Chemistry') {
          recoveredMarks += 1;
        }
      }

      return recoveredMarks;
    };

    // Get unique user IDs (in case a user has multiple attempts, we'll take the best one)
    const userScoreMap = new Map();
    sessions.forEach((session) => {
      const userIdStr = session.user.toString();
      const resolvedScore = resolveSessionScore(session);
      if (!userScoreMap.has(userIdStr) || userScoreMap.get(userIdStr).score < resolvedScore) {
        userScoreMap.set(userIdStr, {
          userId: userIdStr,
          score: resolvedScore,
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

/**
 * Get PYQ mock test leaderboard
 * GET /api/mcq/leaderboard/pyq-mocktest?title=...&year=...
 * Ranks users for a specific PYQ mock paper (title + optional year)
 */
const getPyqMockTestLeaderboard = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const { title, year } = req.query;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return next(createError(400, 'Title is required for PYQ mock test leaderboard'));
    }

    const normalizedTitle = title.trim();

    const filter = {
      testType: 'pyq-mocktest',
      status: 'completed',
      chapter: normalizedTitle,
    };

    if (year !== undefined && year !== null && String(year).trim() !== '') {
      filter.year = String(year).trim();
    }

    const sessions = await TestSession.find(filter)
      .select('user score totalQuestions completedAt')
      .sort({ score: -1, completedAt: 1 })
      .limit(100)
      .lean();

    if (sessions.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Aggregate best score per user (in case of multiple attempts)
    const userScoreMap = new Map();
    sessions.forEach((session) => {
      const userIdStr = session.user.toString();
      const resolvedScore = Number(session.score) || 0;
      if (!userScoreMap.has(userIdStr) || userScoreMap.get(userIdStr).score < resolvedScore) {
        userScoreMap.set(userIdStr, {
          userId: userIdStr,
          score: resolvedScore,
          totalQuestions: session.totalQuestions || 0,
          completedAt: session.completedAt,
        });
      }
    });

    const leaderboardData = Array.from(userScoreMap.values())
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return new Date(a.completedAt) - new Date(b.completedAt);
      })
      .slice(0, 100);

    const userIds = leaderboardData.map((entry) => entry.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('fullName email')
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const leaderboard = leaderboardData.map((entry, index) => {
      const user = userMap.get(entry.userId);
      return {
        id: entry.userId,
        name: user?.fullName || 'Anonymous',
        score: parseFloat((entry.score || 0).toFixed(1)),
        rank: index + 1,
        isCurrentUser: entry.userId === userId,
        totalCorrect: Math.round(entry.score || 0),
        totalAttempts: entry.totalQuestions || 0,
      };
    });

    res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error('Error getting PYQ mock test leaderboard:', error);
    return next(createError(500, 'Failed to fetch PYQ mock test leaderboard'));
  }
};

module.exports = {
  getLeaderboard,
  getUserRank,
  getMockTestLeaderboard,
  getPyqMockTestLeaderboard,
};




