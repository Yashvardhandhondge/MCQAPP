const express = require('express');
const { authGuard } = require('../middleware/auth.middleware');
const {
  getDashboardSummary,
  getChaptersBySubject,
  getChaptersWithAnalytics,
  getYearsBySubjectAndChapter,
  getYearsWithAnalytics,
  getQuestionsBySubjectAndChapter,
  getQuestionsBySubjectChapterAndYear,
  getQuestionsByIds,
  generatePracticeTest,
  generateChapterPractice,
  revealQuestion,
  getDailyViews,
} = require('../controllers/mcq.controller');
const {
  submitAnswer,
  getUserStatsOverview,
  getUserProgressBySubjectAndChapter,
  getUserAttemptsByQuestions,
  getStudyStreakAndTodayProgress,
  getTimeSeriesAnalytics,
} = require('../controllers/attempt.controller');
const {
  getAvailableTests,
  getDistinctYears,
  generateRandomTest,
  startTestSession,
  submitTestSession,
  getUserTestSessions,
  getTestReport,
  getTestReports,
  getRecentActivity,
} = require('../controllers/test.controller');
const {
  getLeaderboard,
  getUserRank,
} = require('../controllers/leaderboard.controller');
const {
  getExamConfig,
  updateExamConfig,
} = require('../controllers/config.controller');
const {
  getQuestionSolution,
} = require('../controllers/solution.controller');
const {
  saveQuestion,
  unsaveQuestion,
  getSavedQuestions,
  getSavedStatus,
  getSavedQuestionsBySubjects,
  getSavedQuestionsByChapters,
  getSavedQuestionsBySubjectAndChapter,
} = require('../controllers/savedQuestions.controller');
const {
  reportQuestion,
  getReportedQuestionsBySubjects,
  getReportedQuestionsByChapters,
  getReportedQuestionsForReview,
  resolveReport,
} = require('../controllers/questionReport.controller');
const { adminAuthGuard } = require('../middleware/admin.middleware');
const { getUserStats, getAllUsers } = require('../controllers/admin.controller');
const { getPremiumContent, updatePremiumContent } = require('../controllers/premiumContent.controller');
const { getUserAchievements } = require('../controllers/achievement.controller');

const router = express.Router();

/**
 * Public endpoints (no auth required)
 */
router.get('/premium-content', getPremiumContent);

/**
 * Apply auth middleware to all routes below
 * Only authenticated users can access MCQ endpoints
 */
router.use(authGuard);

/**
 * @route   GET /api/mcq/config
 * @desc    Get exam configuration (target date, etc)
 * @access  Private (requires authentication)
 */
router.get('/config', getExamConfig);

/**
 * @route   PUT /api/mcq/config
 * @desc    Update exam configuration (admin only)
 * @access  Private (requires authentication)
 */
router.put('/config', updateExamConfig);

/**
 * @route   GET /api/mcq/dashboard
 * @desc    Get dashboard summary with total questions and subject-wise counts
 * @access  Private (requires authentication)
 */
router.get('/dashboard', getDashboardSummary);

/**
 * @route   GET /api/mcq/tests/years
 * @desc    Get distinct years available for PYQ tests
 * @access  Private (requires authentication)
 */
router.get('/tests/years', getDistinctYears);

/**
 * @route   GET /api/mcq/tests
 * @desc    Get all available PYQ tests with user status
 * @query   {string} filter - Optional filter ('year' or 'subject')
 * @access  Private (requires authentication)
 */
router.get('/tests', getAvailableTests);

/**
 * @route   POST /api/mcq/tests/random
 * @desc    Generate a random test with questions from any subjects
 * @body    {number} questionCount - Number of questions (10-50, default 25)
 * @body    {string} year - Optional year filter
 * @body    {string} subject - Optional subject filter
 * @access  Private (requires authentication)
 */
router.post('/tests/random', generateRandomTest);

/**
 * @route   POST /api/mcq/tests/start
 * @desc    Start a new test session
 * @body    {string} year - Year for PYQ test
 * @body    {string} shift - Shift number
 * @body    {string} testType - 'pyq' or 'chapter'
 * @body    {string} subject - Subject (for chapter tests)
 * @body    {string} chapter - Chapter (for chapter tests)
 * @body    {number} limit - Number of questions (default 200)
 * @access  Private (requires authentication)
 */
router.post('/tests/start', startTestSession);

/**
 * @route   POST /api/mcq/tests/submit
 * @desc    Submit test answers and complete session
 * @body    {string} sessionId - Test session ID
 * @body    {array} answers - Array of answers
 * @access  Private (requires authentication)
 */
router.post('/tests/submit', submitTestSession);

/**
 * @route   GET /api/mcq/tests/sessions
 * @desc    Get user's test sessions
 * @query   {string} testType - Optional filter by test type
 * @query   {string} status - Optional filter by status
 * @access  Private (requires authentication)
 */
router.get('/tests/sessions', getUserTestSessions);

/**
 * @route   GET /api/mcq/tests/reports/:sessionId
 * @desc    Get detailed test report by session ID
 * @param   {string} sessionId - Test session ID
 * @access  Private (requires authentication)
 */
router.get('/tests/reports/:sessionId', getTestReport);

/**
 * @route   GET /api/mcq/tests/reports
 * @desc    Get test reports filtered by subject/chapter/year
 * @query   {string} subject - Optional filter by subject
 * @query   {string} chapter - Optional filter by chapter
 * @query   {string} year - Optional filter by year
 * @query   {string} testType - Optional filter by test type
 * @access  Private (requires authentication)
 */
router.get('/tests/reports', getTestReports);

/**
 * @route   GET /api/mcq/tests/recent-activity
 * @desc    Get recent test activity (last 3 completed tests)
 * @access  Private (requires authentication)
 */
router.get('/tests/recent-activity', getRecentActivity);

/**
 * @route   GET /api/mcq/leaderboard/my-rank
 * @desc    Get current user's rank
 * @query   {string} timeframe - 'month' or 'all-time' (default: 'all-time')
 * @access  Private (requires authentication)
 */
router.get('/leaderboard/my-rank', getUserRank);

/**
 * @route   GET /api/mcq/leaderboard
 * @desc    Get leaderboard rankings
 * @query   {string} timeframe - 'month' or 'all-time' (default: 'all-time')
 * @access  Private (requires authentication)
 */
router.get('/leaderboard', getLeaderboard);

/**
 * @route   POST /api/mcq/questions/by-ids
 * @desc    Get questions by their IDs (for test sessions)
 * @body    {array} questionIds - Array of question IDs
 * @access  Private (requires authentication)
 */
router.post('/questions/by-ids', getQuestionsByIds);

/**
 * @route   GET /api/mcq/practice
 * @desc    Generate a random practice test with optional chapter/year filters
 * @query   {string} subject - Required subject filter
 * @query   {string} chapter - Optional chapter filter
 * @query   {string} year - Optional year filter
 * @query   {number} limit - Optional question count (default 20)
 * @access  Private (requires authentication)
 */
router.get('/practice', generatePracticeTest);

/**
 * @route   GET /api/mcq/chapters/:subject/:chapter/practice
 * @desc    Generate random practice test for a chapter, excluding attempted questions
 *          If <= 10 unattempted questions remain, includes attempted questions too
 * @param   {string} subject - Subject name (Chemistry, Physics, Maths, Biology)
 * @param   {string} chapter - Chapter name (URL encoded)
 * @query   {number} limit - Optional question count (default 20, max 100)
 * @access  Private (requires authentication)
 */
router.get('/chapters/:subject/:chapter/practice', generateChapterPractice);

/**
 * @route   GET /api/mcq/subjects/:subject/chapters
 * @desc    Get all distinct chapters for a specific subject
 * @param   {string} subject - Subject name (Chemistry, Physics, Maths, Biology)
 * @access  Private (requires authentication)
 */
router.get('/subjects/:subject/chapters', getChaptersBySubject);

/**
 * @route   GET /api/mcq/subjects/:subject/chapters/analytics
 * @desc    Get chapters with analytics (total questions and user attempts) for a specific subject
 * @param   {string} subject - Subject name (Chemistry, Physics, Maths, Biology)
 * @access  Private (requires authentication)
 */
router.get('/subjects/:subject/chapters/analytics', getChaptersWithAnalytics);

/**
 * @route   GET /api/mcq/subjects/:subject/chapters/:chapter/years/analytics
 * @desc    Get years with analytics (total questions and user attempts) for a specific subject and chapter
 * @param   {string} subject - Subject name (Chemistry, Physics, Maths, Biology)
 * @param   {string} chapter - Chapter name (URL encoded)
 * @access  Private (requires authentication)
 */
router.get('/subjects/:subject/chapters/:chapter/years/analytics', getYearsWithAnalytics);

/**
 * @route   GET /api/mcq/subjects/:subject/chapters/:chapter/years
 * @desc    Get all distinct years for a specific subject and chapter
 * @param   {string} subject - Subject name (Chemistry, Physics, Maths, Biology)
 * @param   {string} chapter - Chapter name (URL encoded)
 * @access  Private (requires authentication)
 */
router.get('/subjects/:subject/chapters/:chapter/years', getYearsBySubjectAndChapter);

/**
 * @route   GET /api/mcq/subjects/:subject/chapters/:chapter/questions
 * @desc    Get questions by subject and chapter, optionally filtered by year
 * @param   {string} subject - Subject name (Chemistry, Physics, Maths, Biology)
 * @param   {string} chapter - Chapter name (URL encoded)
 * @query   {string} year - Optional year filter (URL encoded)
 * @query   {number} page - Optional page number (default: 1)
 * @query   {number} limit - Optional limit per page (default: 50, max: 100)
 * @access  Private (requires authentication)
 */
router.get('/subjects/:subject/chapters/:chapter/questions', (req, res, next) => {
  // Check if year query parameter is provided
  if (req.query.year) {
    // Call the year-filtered controller
    return getQuestionsBySubjectChapterAndYear(req, res, next);
  } else {
    // Call the non-year-filtered controller
    return getQuestionsBySubjectAndChapter(req, res, next);
  }
});

/**
 * @route   GET /api/mcq/subjects/:subject/chapters/:chapter/years/:year/questions
 * @desc    Get questions by subject, chapter, and specific year
 * @param   {string} subject - Subject name (Chemistry, Physics, Maths, Biology)
 * @param   {string} chapter - Chapter name (URL encoded)
 * @param   {string} year - Year (URL encoded)
 * @access  Private (requires authentication)
 */
router.get('/subjects/:subject/chapters/:chapter/years/:year/questions', getQuestionsBySubjectChapterAndYear);

/**
 * @route   POST /api/mcq/answer
 * @desc    Submit an answer for a question and track user attempt
 * @body    {string} questionId - ID of the question being answered
 * @body    {string} selectedOption - The option selected by the user
 * @access  Private (requires authentication)
 */
router.post('/answer', submitAnswer);

/**
 * @route   GET /api/mcq/questions/:questionId/solution
 * @desc    Get or generate AI solution for a question
 * @param   {string} questionId - ID of the question
 * @access  Private (requires authentication)
 */
router.get('/questions/:questionId/solution', getQuestionSolution);

/**
 * @route   GET /api/mcq/me/stats
 * @desc    Get user's attempt statistics and performance overview
 * @access  Private (requires authentication)
 */
router.get('/me/stats', getUserStatsOverview);

/**
 * @route   GET /api/mcq/me/progress
 * @desc    Get detailed progress grouped by subject, chapter, and year
 * @access  Private (requires authentication)
 */
router.get('/me/progress', getUserProgressBySubjectAndChapter);

/**
 * @route   POST /api/mcq/attempts/by-questions
 * @desc    Get user attempts for specific questions
 * @body    {array} questionIds - Array of question IDs
 * @access  Private (requires authentication)
 */
router.post('/attempts/by-questions', getUserAttemptsByQuestions);

/**
 * @route   GET /api/mcq/me/streak
 * @desc    Get study streak and today's progress
 * @access  Private (requires authentication)
 */
router.get('/me/streak', getStudyStreakAndTodayProgress);

/**
 * @route   GET /api/mcq/me/achievements
 * @desc    Get user achievements
 * @access  Private (requires authentication)
 */
router.get('/me/achievements', getUserAchievements);

/**
 * @route   GET /api/mcq/me/analytics/time-series
 * @desc    Get time-series analytics for performance trends
 * @query   {string} period - Time period: '7d', '30d', '90d', '1y' (default: '30d')
 * @query   {string} groupBy - Grouping: 'day', 'week', 'month' (default: 'day')
 * @access  Private (requires authentication)
 */
router.get('/me/analytics/time-series', getTimeSeriesAnalytics);

/**
 * @route   GET /api/mcq/me/daily-views
 * @desc    Get today's question view count for the user
 * @access  Private (requires authentication)
 */
router.get('/me/daily-views', getDailyViews);

/**
 * @route   POST /api/mcq/questions/:questionId/reveal
 * @desc    Reveal a blurred question (track daily view limit for free users)
 * @param   {string} questionId - ID of the question to reveal
 * @access  Private (requires authentication)
 */
router.post('/questions/:questionId/reveal', revealQuestion);

/**
 * @route   POST /api/mcq/questions/:questionId/save
 * @desc    Save a question for the current user
 * @param   {string} questionId - ID of the question to save
 * @access  Private (requires authentication)
 */
router.post('/questions/:questionId/save', saveQuestion);

/**
 * @route   DELETE /api/mcq/questions/:questionId/save
 * @desc    Unsave a question for the current user
 * @param   {string} questionId - ID of the question to unsave
 * @access  Private (requires authentication)
 */
router.delete('/questions/:questionId/save', unsaveQuestion);

/**
 * @route   GET /api/mcq/questions/:questionId/saved-status
 * @desc    Check if a question is saved for the current user
 * @param   {string} questionId - ID of the question to check
 * @access  Private (requires authentication)
 */
router.get('/questions/:questionId/saved-status', getSavedStatus);

/**
 * @route   GET /api/mcq/me/saved-questions
 * @desc    Get all saved questions for the current user
 * @query   {number} page - Optional page number (default: 1)
 * @query   {number} limit - Optional limit per page (default: 50, max: 100)
 * @access  Private (requires authentication)
 */
router.get('/me/saved-questions', getSavedQuestions);

/**
 * @route   GET /api/mcq/me/saved-questions/subjects
 * @desc    Get saved questions grouped by subject
 * @access  Private (requires authentication)
 */
router.get('/me/saved-questions/subjects', getSavedQuestionsBySubjects);

/**
 * @route   GET /api/mcq/me/saved-questions/subjects/:subject/chapters
 * @desc    Get saved questions grouped by chapters for a specific subject
 * @param   {string} subject - Subject name (Chemistry, Physics, Maths, Biology)
 * @access  Private (requires authentication)
 */
router.get('/me/saved-questions/subjects/:subject/chapters', getSavedQuestionsByChapters);

/**
 * @route   GET /api/mcq/me/saved-questions/subjects/:subject/chapters/:chapter/questions
 * @desc    Get saved questions for a specific subject and chapter with user attempts
 * @param   {string} subject - Subject name (Chemistry, Physics, Maths, Biology)
 * @param   {string} chapter - Chapter name (URL encoded)
 * @access  Private (requires authentication)
 */
router.get('/me/saved-questions/subjects/:subject/chapters/:chapter/questions', getSavedQuestionsBySubjectAndChapter);

/**
 * @route   POST /api/mcq/questions/:questionId/report
 * @desc    Report a question
 * @param   {string} questionId - ID of the question to report
 * @body    {string} reportType - Type of report: 'wrong-question', 'wrong-options', 'invalid-question'
 * @body    {string} details - Detailed description of the issue
 * @access  Private (requires authentication)
 */
router.post('/questions/:questionId/report', reportQuestion);

/**
 * @route   GET /api/mcq/admin/reports/subjects
 * @desc    Get reported questions grouped by subject (Admin only)
 * @access  Private (requires admin role)
 */
router.get('/admin/reports/subjects', ...adminAuthGuard, getReportedQuestionsBySubjects);

/**
 * @route   GET /api/mcq/admin/reports/subjects/:subject/chapters
 * @desc    Get reported questions grouped by chapters for a subject (Admin only)
 * @param   {string} subject - Subject name (Chemistry, Physics, Maths, Biology)
 * @access  Private (requires admin role)
 */
router.get('/admin/reports/subjects/:subject/chapters', ...adminAuthGuard, getReportedQuestionsByChapters);

/**
 * @route   GET /api/mcq/admin/reports/subjects/:subject/chapters/:chapter/reviews
 * @desc    Get reported questions for review (Admin only)
 * @param   {string} subject - Subject name (Chemistry, Physics, Maths, Biology)
 * @param   {string} chapter - Chapter name (URL encoded)
 * @access  Private (requires admin role)
 */
router.get('/admin/reports/subjects/:subject/chapters/:chapter/reviews', ...adminAuthGuard, getReportedQuestionsForReview);

/**
 * @route   PUT /api/mcq/admin/reports/:reportId/resolve
 * @desc    Resolve or dismiss a report (Admin only)
 * @param   {string} reportId - ID of the report
 * @body    {string} action - 'update' or 'dismiss'
 * @body    {object} questionUpdates - Optional updates to the question
 * @body    {string} adminNotes - Optional admin notes
 * @access  Private (requires admin role)
 */
router.put('/admin/reports/:reportId/resolve', ...adminAuthGuard, resolveReport);

/**
 * @route   GET /api/mcq/admin/stats/users
 * @desc    Get user statistics (Admin only)
 * @access  Private (requires admin role)
 */
router.get('/admin/stats/users', ...adminAuthGuard, getUserStats);

/**
 * @route   GET /api/mcq/admin/users
 * @desc    Get all users with pagination (Admin only)
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 50)
 * @query   {string} subscription - Filter by subscription (free/premium)
 * @query   {string} group - Filter by group (PCM/PCB/PCMB)
 * @query   {string} role - Filter by role (student/admin)
 * @access  Private (requires admin role)
 */
router.get('/admin/users', ...adminAuthGuard, getAllUsers);

/**
 * @route   PUT /api/mcq/admin/premium-content
 * @desc    Update premium purchase page content (Admin only)
 * @body    {object} - Premium content object
 * @access  Private (requires admin role)
 */
router.put('/admin/premium-content', ...adminAuthGuard, updatePremiumContent);

module.exports = router;
