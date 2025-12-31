const createError = require('http-errors');
const UserAttempt = require('../models/UserAttempt');
const { getModelBySubject } = require('../models/Mcq');

/**
 * Submit an answer for a question
 * POST /api/mcq/answer
 */
const submitAnswer = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { questionId, selectedOption } = req.body;

    // Validate input
    if (!questionId || !selectedOption) {
      return next(createError(400, 'Question ID and selected option are required'));
    }

    // Find the question across all subject collections
    let question = null;
    let questionModel = null;
    const subjects = ['Chemistry', 'Physics', 'Maths', 'Biology'];

    for (const subject of subjects) {
      try {
        const Model = getModelBySubject(subject);
        const foundQuestion = await Model.findById(questionId);
        if (foundQuestion) {
          question = foundQuestion;
          questionModel = Model;
          break;
        }
      } catch (error) {
        // Continue searching in other collections
        continue;
      }
    }

    if (!question) {
      return next(createError(404, 'Question not found'));
    }

    // Compare selected option with correct answer
    const isCorrect = selectedOption.trim() === question.correctanswrs.trim();

    // Check if user has already attempted this question - if yes, update it; if no, create new
    const existingAttempt = await UserAttempt.findOne({
      user: userId,
      question: questionId,
    });

    let userAttempt;
    if (existingAttempt) {
      // Update existing attempt
      existingAttempt.selectedOption = selectedOption.trim();
      existingAttempt.isCorrect = isCorrect;
      existingAttempt.answeredAt = new Date(); // Update timestamp
      await existingAttempt.save();
      userAttempt = existingAttempt;
    } else {
      // Create new user attempt record
      userAttempt = new UserAttempt({
        user: userId,
        question: question._id,
        subject: question.subject,
        chapter: question.chapter,
        year: question.year,
        selectedOption: selectedOption.trim(),
        isCorrect,
        sourceFile: question.sourceFile,
      });
      await userAttempt.save();
    }

    // Return response
    res.status(200).json({
      success: true,
      data: {
        isCorrect,
        correctAnswer: question.correctanswrs,
        questionId: question._id,
      },
    });

  } catch (error) {
    console.error('Error submitting answer:', error);
    return next(createError(500, 'Something went wrong'));
  }
};

/**
 * Get user stats overview
 * GET /api/mcq/me/stats
 */
const getUserStatsOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const TestSession = require('../models/TestSession');

    // Overall stats from individual attempts
    const [overallAttemptStats] = await UserAttempt.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          totalCorrect: {
            $sum: {
              $cond: ['$isCorrect', 1, 0]
            }
          }
        }
      }
    ]);

    // Overall stats from completed tests (excluding mock tests)
    const [overallTestStats] = await TestSession.aggregate([
      { 
        $match: { 
          user: userId,
          status: 'completed',
          testType: { $ne: 'mocktest' }, // Exclude mock tests
        } 
      },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: '$totalQuestions' },
          totalCorrect: { $sum: '$score' },
        }
      }
    ]);

    // Combine individual attempts and test attempts
    const totalAttempts = (overallAttemptStats?.totalAttempts || 0) + (overallTestStats?.totalAttempts || 0);
    const totalCorrect = (overallAttemptStats?.totalCorrect || 0) + (overallTestStats?.totalCorrect || 0);
    const overallAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts * 100) : 0;

    // Per subject stats from individual attempts
    const perSubjectAttemptStats = await UserAttempt.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$subject',
          totalAttempts: { $sum: 1 },
          correctAttempts: {
            $sum: {
              $cond: ['$isCorrect', 1, 0]
            }
          },
        },
      },
      {
        $project: {
          subject: '$_id',
          totalAttempts: 1,
          correctAttempts: 1,
          _id: 0,
        },
      },
    ]);

    // Per subject stats from completed tests (where subject is specified, excluding mock tests)
    const perSubjectTestStats = await TestSession.aggregate([
      { 
        $match: { 
          user: userId,
          status: 'completed',
          testType: { $ne: 'mocktest' }, // Exclude mock tests
          subject: { $exists: true, $ne: null },
        } 
      },
      {
        $group: {
          _id: '$subject',
          totalAttempts: { $sum: '$totalQuestions' },
          correctAttempts: { $sum: '$score' },
        },
      },
      {
        $project: {
          subject: '$_id',
          totalAttempts: 1,
          correctAttempts: 1,
          _id: 0,
        },
      },
    ]);

    // Combine per-subject stats
    const subjectStatsMap = new Map();
    
    // Add individual attempt stats
    perSubjectAttemptStats.forEach((stat) => {
      if (stat.subject) {
        subjectStatsMap.set(stat.subject, {
          totalAttempts: stat.totalAttempts,
          correctAttempts: stat.correctAttempts,
        });
      }
    });

    // Add test stats (merge with existing or create new)
    perSubjectTestStats.forEach((stat) => {
      if (stat.subject) {
        const existing = subjectStatsMap.get(stat.subject) || { totalAttempts: 0, correctAttempts: 0 };
        subjectStatsMap.set(stat.subject, {
          totalAttempts: existing.totalAttempts + stat.totalAttempts,
          correctAttempts: existing.correctAttempts + stat.correctAttempts,
        });
      }
    });

    // Convert map to array and calculate accuracy
    const perSubjectStats = Array.from(subjectStatsMap.entries()).map(([subject, stats]) => ({
      subject,
      totalAttempts: stats.totalAttempts,
      correctAttempts: stats.correctAttempts,
      accuracy: stats.totalAttempts > 0 
        ? Math.round((stats.correctAttempts / stats.totalAttempts * 100) * 100) / 100
        : 0,
    })).sort((a, b) => a.subject.localeCompare(b.subject));

    // Per subject-chapter stats using aggregation
    // Uses compound index { user: 1, subject: 1, chapter: 1 } for optimal performance
    const perSubjectChapterStats = await UserAttempt.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: { subject: '$subject', chapter: '$chapter' },
          totalAttempts: { $sum: 1 },
          correctAttempts: {
            $sum: {
              $cond: ['$isCorrect', 1, 0]
            }
          },
        },
      },
      {
        $project: {
          subject: '$_id.subject',
          chapter: '$_id.chapter',
          totalAttempts: 1,
          correctAttempts: 1,
          accuracy: {
            $cond: [
              { $gt: ['$totalAttempts', 0] },
              { 
                $round: [
                  { 
                    $multiply: [
                      { $divide: ['$correctAttempts', '$totalAttempts'] }, 
                      100
                    ] 
                  }, 
                  2
                ]
              },
              0
            ]
          },
          _id: 0,
        },
      },
      { $sort: { subject: 1, chapter: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: {
          totalAttempts,
          totalCorrect,
          accuracy: Math.round(overallAccuracy * 100) / 100, // Round to 2 decimal places
        },
        perSubject: perSubjectStats,
        perSubjectChapter: perSubjectChapterStats,
      },
    });

  } catch (error) {
    console.error('Error getting user stats:', error);
    return next(createError(500, 'Failed to fetch user statistics'));
  }
};

/**
 * Get detailed progress grouped by subject and chapter (and year breakdown)
 * GET /api/mcq/me/progress
 */
const getUserProgressBySubjectAndChapter = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [stats] = await UserAttempt.aggregate([
      { $match: { user: userId } },
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalAttempts: { $sum: 1 },
                totalCorrect: {
                  $sum: {
                    $cond: ['$isCorrect', 1, 0],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                totalAttempts: 1,
                totalCorrect: 1,
                accuracy: {
                  $cond: [
                    { $gt: ['$totalAttempts', 0] },
                    {
                      $round: [
                        {
                          $multiply: [
                            { $divide: ['$totalCorrect', '$totalAttempts'] },
                            100,
                          ],
                        },
                        2,
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          ],
          perSubject: [
            {
              $group: {
                _id: '$subject',
                totalAttempts: { $sum: 1 },
                correctAttempts: {
                  $sum: {
                    $cond: ['$isCorrect', 1, 0],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                subject: '$_id',
                totalAttempts: 1,
                correctAttempts: 1,
                accuracy: {
                  $cond: [
                    { $gt: ['$totalAttempts', 0] },
                    {
                      $round: [
                        {
                          $multiply: [
                            { $divide: ['$correctAttempts', '$totalAttempts'] },
                            100,
                          ],
                        },
                        2,
                      ],
                    },
                    0,
                  ],
                },
              },
            },
            { $sort: { subject: 1 } },
          ],
          perSubjectChapter: [
            {
              $group: {
                _id: { subject: '$subject', chapter: '$chapter' },
                totalAttempts: { $sum: 1 },
                correctAttempts: {
                  $sum: {
                    $cond: ['$isCorrect', 1, 0],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                subject: '$_id.subject',
                chapter: '$_id.chapter',
                totalAttempts: 1,
                correctAttempts: 1,
                accuracy: {
                  $cond: [
                    { $gt: ['$totalAttempts', 0] },
                    {
                      $round: [
                        {
                          $multiply: [
                            { $divide: ['$correctAttempts', '$totalAttempts'] },
                            100,
                          ],
                        },
                        2,
                      ],
                    },
                    0,
                  ],
                },
              },
            },
            { $sort: { subject: 1, chapter: 1 } },
          ],
          perSubjectChapterYear: [
            {
              $group: {
                _id: { subject: '$subject', chapter: '$chapter', year: '$year' },
                totalAttempts: { $sum: 1 },
                correctAttempts: {
                  $sum: {
                    $cond: ['$isCorrect', 1, 0],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                subject: '$_id.subject',
                chapter: '$_id.chapter',
                year: '$_id.year',
                totalAttempts: 1,
                correctAttempts: 1,
                accuracy: {
                  $cond: [
                    { $gt: ['$totalAttempts', 0] },
                    {
                      $round: [
                        {
                          $multiply: [
                            { $divide: ['$correctAttempts', '$totalAttempts'] },
                            100,
                          ],
                        },
                        2,
                      ],
                    },
                    0,
                  ],
                },
              },
            },
            { $sort: { subject: 1, chapter: 1, year: 1 } },
          ],
        },
      },
    ]);

    const overallFallback = {
      totalAttempts: 0,
      totalCorrect: 0,
      accuracy: 0,
    };

    const overall = stats?.overall?.[0] || overallFallback;

    return res.status(200).json({
      success: true,
      data: {
        overall,
        perSubject: stats?.perSubject || [],
        perSubjectChapter: stats?.perSubjectChapter || [],
        perSubjectChapterYear: stats?.perSubjectChapterYear || [],
      },
    });
  } catch (error) {
    console.error('Error getting user progress:', error);
    return next(createError(500, 'Something went wrong while fetching progress.'));
  }
};

/**
 * Get user attempts for specific questions
 * POST /api/mcq/attempts/by-questions
 */
const getUserAttemptsByQuestions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { questionIds } = req.body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return next(createError(400, 'questionIds array is required'));
    }

    // Get all attempts for these questions by this user
    const attempts = await UserAttempt.find({
      user: userId,
      question: { $in: questionIds },
    }).lean();

    // Create a map of questionId -> attempt for easy lookup
    const attemptMap = new Map();
    attempts.forEach((attempt) => {
      attemptMap.set(attempt.question.toString(), {
        questionId: attempt.question.toString(),
        selectedOption: attempt.selectedOption,
        isCorrect: attempt.isCorrect,
        isSubmitted: true,
      });
    });

    res.status(200).json({
      success: true,
      data: Object.fromEntries(attemptMap),
    });
  } catch (error) {
    console.error('Error getting user attempts by questions:', error);
    return next(createError(500, 'Failed to fetch user attempts'));
  }
};

/**
 * Get study streak and today's progress
 * GET /api/mcq/me/streak
 */
const getStudyStreakAndTodayProgress = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    
    // Get start of today (00:00:00)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Get end of today (23:59:59)
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Calculate today's progress
    // Count questions from individual attempts today
    const todayAttempts = await UserAttempt.countDocuments({
      user: userId,
      answeredAt: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    });

    // Count questions from tests completed today (excluding mock tests)
    const TestSession = require('../models/TestSession');
    const todayTests = await TestSession.find({
      user: userId,
      status: 'completed',
      completedAt: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
      // Exclude mock tests from today's progress
      testType: { $ne: 'mocktest' },
    });

    const todayTestQuestions = todayTests.reduce((sum, test) => sum + (test.totalQuestions || 0), 0);
    const todayProgress = todayAttempts + todayTestQuestions;

    // Calculate study streak
    // Get all unique dates when user attempted questions (from UserAttempt)
    // Use aggregation to get dates normalized to YYYY-MM-DD format
    const attemptDatesAgg = await UserAttempt.aggregate([
      { $match: { user: userId, answeredAt: { $exists: true } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$answeredAt',
            },
          },
        },
      },
      { $project: { date: '$_id', _id: 0 } },
    ]);

    // Get all unique dates when user completed tests
    const testDatesAgg = await TestSession.aggregate([
      {
        $match: {
          user: userId,
          status: 'completed',
          completedAt: { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$completedAt',
            },
          },
        },
      },
      { $project: { date: '$_id', _id: 0 } },
    ]);

    // Combine and normalize dates (remove time, keep only date)
    const allDates = new Set();
    
    attemptDatesAgg.forEach((item) => {
      if (item.date) {
        allDates.add(item.date);
      }
    });

    testDatesAgg.forEach((item) => {
      if (item.date) {
        allDates.add(item.date);
      }
    });

    // Sort dates in descending order
    const sortedDates = Array.from(allDates).sort().reverse();

    // Calculate streak: count consecutive days from today backwards
    let streak = 0;
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    // Check if user has activity today
    const hasTodayActivity = sortedDates.includes(todayStr);
    
    if (hasTodayActivity) {
      streak = 1; // Today counts
      
      // Count backwards from yesterday
      for (let i = 1; i <= 365; i++) { // Max 365 days streak
        const checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() - i);
        const checkDateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        
        if (sortedDates.includes(checkDateStr)) {
          streak++;
        } else {
          // Streak broken
          break;
        }
      }
    } else {
      // No activity today, streak is 0
      streak = 0;
    }

    // Calculate max streak (longest consecutive streak from all dates)
    let maxStreak = 0;
    if (sortedDates.length > 0) {
      // Sort dates in ascending order for streak calculation
      const ascendingDates = Array.from(allDates).sort();
      let currentStreak = 1;
      maxStreak = 1; // Initialize to 1 since we have at least one date
      
      // Helper function to parse date string and get date components
      const parseDateString = (dateStr) => {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          return {
            year: parseInt(parts[0], 10),
            month: parseInt(parts[1], 10) - 1, // Month is 0-indexed
            day: parseInt(parts[2], 10),
          };
        }
        return null;
      };
      
      // Helper function to calculate days difference between two date strings
      const getDaysDifference = (dateStr1, dateStr2) => {
        const date1 = parseDateString(dateStr1);
        const date2 = parseDateString(dateStr2);
        if (!date1 || !date2) return Infinity;
        
        const d1 = new Date(date1.year, date1.month, date1.day);
        const d2 = new Date(date2.year, date2.month, date2.day);
        const diffTime = d2 - d1;
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
      };
      
      // Calculate max streak by checking consecutive dates
      for (let i = 1; i < ascendingDates.length; i++) {
        const diffDays = getDaysDifference(ascendingDates[i - 1], ascendingDates[i]);
        
        if (diffDays === 1) {
          // Consecutive day - increment streak
          currentStreak++;
        } else {
          // Streak broken - update max streak and reset current streak
          maxStreak = Math.max(maxStreak, currentStreak);
          currentStreak = 1;
        }
      }
      // Update max streak with the final current streak
      maxStreak = Math.max(maxStreak, currentStreak);
    }

    res.status(200).json({
      success: true,
      data: {
        studyStreak: streak,
        maxStreak: maxStreak,
        todayProgress,
        hasTodayActivity,
        activityDates: Array.from(allDates), // Return all dates with activity
      },
    });
  } catch (error) {
    console.error('Error getting study streak:', error);
    return next(createError(500, 'Failed to fetch study streak'));
  }
};

/**
 * Get time-series analytics for performance trends
 * GET /api/mcq/me/analytics/time-series
 * Query params: period (7d, 30d, 90d, 1y), groupBy (day, week, month)
 */
const getTimeSeriesAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { period = '30d', groupBy = 'day' } = req.query;
    const TestSession = require('../models/TestSession');

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    let dateFormat = '%Y-%m-%d';
    let dateGroupFormat = '%Y-%m-%d';

    if (period === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === '30d') {
      startDate.setDate(now.getDate() - 30);
    } else if (period === '90d') {
      startDate.setDate(now.getDate() - 90);
    } else if (period === '1y') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    if (groupBy === 'week') {
      dateFormat = '%Y-W%V';
      dateGroupFormat = '%Y-W%V';
    } else if (groupBy === 'month') {
      dateFormat = '%Y-%m';
      dateGroupFormat = '%Y-%m';
    }

    // Get attempts data grouped by date
    const attemptsData = await UserAttempt.aggregate([
      {
        $match: {
          user: userId,
          answeredAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: '$answeredAt',
            },
          },
          totalAttempts: { $sum: 1 },
          correctAttempts: {
            $sum: {
              $cond: ['$isCorrect', 1, 0],
            },
          },
        },
      },
      {
        $project: {
          date: '$_id',
          totalAttempts: 1,
          correctAttempts: 1,
          accuracy: {
            $cond: [
              { $gt: ['$totalAttempts', 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ['$correctAttempts', '$totalAttempts'] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Get test sessions data grouped by date
    const testsData = await TestSession.aggregate([
      {
        $match: {
          user: userId,
          status: 'completed',
          completedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: '$completedAt',
            },
          },
          totalQuestions: { $sum: '$totalQuestions' },
          correctQuestions: { $sum: '$score' },
          testCount: { $sum: 1 },
        },
      },
      {
        $project: {
          date: '$_id',
          totalQuestions: 1,
          correctQuestions: 1,
          testCount: 1,
          accuracy: {
            $cond: [
              { $gt: ['$totalQuestions', 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ['$correctQuestions', '$totalQuestions'] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Combine attempts and tests data
    const combinedData = new Map();
    
    attemptsData.forEach((item) => {
      combinedData.set(item.date, {
        date: item.date,
        totalAttempts: item.totalAttempts,
        correctAttempts: item.correctAttempts,
        accuracy: item.accuracy,
        testCount: 0,
        totalQuestions: item.totalAttempts,
        correctQuestions: item.correctAttempts,
      });
    });

    testsData.forEach((item) => {
      const existing = combinedData.get(item.date) || {
        date: item.date,
        totalAttempts: 0,
        correctAttempts: 0,
        accuracy: 0,
        testCount: 0,
        totalQuestions: 0,
        correctQuestions: 0,
      };
      
      combinedData.set(item.date, {
        date: item.date,
        totalAttempts: existing.totalAttempts + item.totalQuestions,
        correctAttempts: existing.correctAttempts + item.correctQuestions,
        testCount: item.testCount,
        totalQuestions: existing.totalQuestions + item.totalQuestions,
        correctQuestions: existing.correctQuestions + item.correctQuestions,
        accuracy:
          existing.totalAttempts + item.totalQuestions > 0
            ? Math.round(
                ((existing.correctAttempts + item.correctQuestions) /
                  (existing.totalAttempts + item.totalQuestions)) *
                  100 *
                  100
              ) / 100
            : 0,
      });
    });

    const timeSeries = Array.from(combinedData.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Get subject-wise breakdown for the period
    const subjectBreakdown = await UserAttempt.aggregate([
      {
        $match: {
          user: userId,
          answeredAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$subject',
          totalAttempts: { $sum: 1 },
          correctAttempts: {
            $sum: {
              $cond: ['$isCorrect', 1, 0],
            },
          },
        },
      },
      {
        $project: {
          subject: '$_id',
          totalAttempts: 1,
          correctAttempts: 1,
          accuracy: {
            $cond: [
              { $gt: ['$totalAttempts', 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ['$correctAttempts', '$totalAttempts'] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },
          _id: 0,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        timeSeries,
        subjectBreakdown,
        period,
        groupBy,
      },
    });
  } catch (error) {
    console.error('Error getting time-series analytics:', error);
    return next(createError(500, 'Failed to fetch time-series analytics'));
  }
};

module.exports = {
  submitAnswer,
  getUserStatsOverview,
  getUserProgressBySubjectAndChapter,
  getUserAttemptsByQuestions,
  getStudyStreakAndTodayProgress,
  getTimeSeriesAnalytics,
};