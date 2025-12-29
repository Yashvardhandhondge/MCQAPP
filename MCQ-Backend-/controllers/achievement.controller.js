const createError = require('http-errors');
const UserAttempt = require('../models/UserAttempt');
const TestSession = require('../models/TestSession');

/**
 * Get user achievements
 * GET /api/mcq/me/achievements
 */
const getUserAchievements = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get user stats
    const [attemptStats, testStats, streakData] = await Promise.all([
      // Total attempts
      UserAttempt.countDocuments({ user: userId }),
      // Test count
      TestSession.countDocuments({ user: userId, status: 'completed' }),
      // Get streak from attempt controller logic
      (async () => {
        const attempts = await UserAttempt.find({ user: userId })
          .select('answeredAt')
          .lean();
        
        const dates = new Set();
        attempts.forEach((attempt) => {
          if (attempt.answeredAt) {
            const dateStr = new Date(attempt.answeredAt).toISOString().split('T')[0];
            dates.add(dateStr);
          }
        });

        // Calculate current streak
        const sortedDates = Array.from(dates).sort().reverse();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        
        let streak = 0;
        let cursor = new Date(today);
        
        if (sortedDates.includes(todayStr)) {
          while (sortedDates.includes(cursor.toISOString().split('T')[0])) {
            streak++;
            cursor.setDate(cursor.getDate() - 1);
          }
        } else {
          cursor.setDate(cursor.getDate() - 1);
          while (sortedDates.includes(cursor.toISOString().split('T')[0])) {
            streak++;
            cursor.setDate(cursor.getDate() - 1);
          }
        }

        // Calculate max streak
        let maxStreak = 0;
        let currentStreak = 0;
        const sortedDatesAsc = Array.from(dates).sort();
        for (let i = 0; i < sortedDatesAsc.length; i++) {
          if (i === 0) {
            currentStreak = 1;
          } else {
            const prevDate = new Date(sortedDatesAsc[i - 1]);
            const currDate = new Date(sortedDatesAsc[i]);
            const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
              currentStreak++;
            } else {
              maxStreak = Math.max(maxStreak, currentStreak);
              currentStreak = 1;
            }
          }
        }
        maxStreak = Math.max(maxStreak, currentStreak);

        return { streak, maxStreak };
      })(),
    ]);

    // Get accuracy
    const correctAttempts = await UserAttempt.countDocuments({
      user: userId,
      isCorrect: true,
    });
    const accuracy = attemptStats > 0 ? (correctAttempts / attemptStats) * 100 : 0;

    // Define achievements
    const achievements = [
      {
        id: 'first-test',
        title: 'First Test',
        icon: '🎯',
        unlocked: testStats >= 1,
        description: 'Complete your first test',
      },
      {
        id: 'seven-day-streak',
        title: '7 Day Streak',
        icon: '🔥',
        unlocked: streakData.streak >= 7,
        description: 'Maintain a 7-day study streak',
      },
      {
        id: 'speed-master',
        title: 'Speed Master',
        icon: '⚡',
        unlocked: testStats >= 10,
        description: 'Complete 10 tests',
      },
      {
        id: 'perfectionist',
        title: 'Perfectionist',
        icon: '💯',
        unlocked: accuracy >= 90 && attemptStats >= 50,
        description: 'Achieve 90%+ accuracy with 50+ attempts',
      },
    ];

    res.status(200).json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    console.error('Error getting achievements:', error);
    return next(createError(500, 'Failed to fetch achievements'));
  }
};

module.exports = {
  getUserAchievements,
};

