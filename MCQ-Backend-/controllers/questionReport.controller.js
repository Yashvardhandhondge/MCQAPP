const createError = require('http-errors');
const QuestionReport = require('../models/QuestionReport');
const { getAllModels } = require('../models/Mcq');
const mongoose = require('mongoose');

/**
 * Report a question
 * POST /api/mcq/questions/:questionId/report
 */
const reportQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { reportType, details } = req.body;
    const userId = req.user._id;

    if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
      return next(createError(400, 'Invalid question ID'));
    }

    if (!reportType || !['wrong-question', 'wrong-options', 'invalid-question'].includes(reportType)) {
      return next(createError(400, 'Invalid report type'));
    }

    if (!details || details.trim().length === 0) {
      return next(createError(400, 'Report details are required'));
    }

    // Find the question in any subject collection
    const allModels = getAllModels();
    let question = null;
    let questionSubject = null;

    for (const [subject, Model] of Object.entries(allModels)) {
      try {
        const foundQuestion = await Model.findById(questionId).lean();
        if (foundQuestion) {
          question = foundQuestion;
          questionSubject = subject;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!question) {
      return next(createError(404, 'Question not found'));
    }

    // Check if user has already reported this question (to prevent spam)
    const existingReport = await QuestionReport.findOne({
      user: userId,
      questionId: questionId,
      status: 'pending',
    });

    if (existingReport) {
      return res.status(200).json({
        success: true,
        message: 'You have already reported this question. It is under review.',
        data: { reportId: existingReport._id },
      });
    }

    // Create new report
    const report = new QuestionReport({
      user: userId,
      questionId: questionId,
      subject: questionSubject,
      chapter: question.chapter,
      reportType,
      details: details.trim(),
      status: 'pending',
    });

    await report.save();

    res.status(201).json({
      success: true,
      message: 'Question reported successfully',
      data: { reportId: report._id },
    });
  } catch (error) {
    console.error('Error reporting question:', error);
    return next(createError(500, 'Failed to report question'));
  }
};

/**
 * Get reported questions grouped by subject and chapter (Admin only)
 * GET /api/mcq/admin/reports/subjects
 */
const getReportedQuestionsBySubjects = async (req, res, next) => {
  try {

    const reports = await QuestionReport.aggregate([
      {
        $match: {
          status: 'pending',
        },
      },
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const subjects = reports.map((r) => ({
      subject: r._id,
      reportCount: r.count,
    }));

    res.status(200).json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    console.error('Error getting reported questions by subjects:', error);
    return next(createError(500, 'Failed to fetch reported questions'));
  }
};

/**
 * Get reported questions by chapters for a subject (Admin only)
 * GET /api/mcq/admin/reports/subjects/:subject/chapters
 */
const getReportedQuestionsByChapters = async (req, res, next) => {
  try {

    const { subject } = req.params;

    if (!['Chemistry', 'Physics', 'Maths', 'Biology'].includes(subject)) {
      return next(createError(400, 'Invalid subject'));
    }

    const reports = await QuestionReport.aggregate([
      {
        $match: {
          subject: subject,
          status: 'pending',
        },
      },
      {
        $group: {
          _id: '$chapter',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const chapters = reports.map((r) => ({
      chapter: r._id,
      reportCount: r.count,
    }));

    res.status(200).json({
      success: true,
      data: chapters,
    });
  } catch (error) {
    console.error('Error getting reported questions by chapters:', error);
    return next(createError(500, 'Failed to fetch reported questions'));
  }
};

/**
 * Get reported questions for review (Admin only)
 * GET /api/mcq/admin/reports/subjects/:subject/chapters/:chapter/reviews
 */
const getReportedQuestionsForReview = async (req, res, next) => {
  try {

    const { subject, chapter } = req.params;

    if (!['Chemistry', 'Physics', 'Maths', 'Biology'].includes(subject)) {
      return next(createError(400, 'Invalid subject'));
    }

    const reports = await QuestionReport.find({
      subject: subject,
      chapter: decodeURIComponent(chapter),
      status: 'pending',
    })
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    // Get the actual questions
    const allModels = getAllModels();
    const QuestionModel = allModels[subject];

    const questionIds = reports.map((r) => r.questionId);
    const questions = await QuestionModel.find({
      _id: { $in: questionIds },
    }).lean();

    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    const reportsWithQuestions = reports.map((report) => ({
      _id: report._id,
      questionId: report.questionId,
      question: questionMap.get(report.questionId.toString()) || null,
      reportType: report.reportType,
      details: report.details,
      reportedBy: {
        name: report.user?.fullName || 'Unknown',
        email: report.user?.email || 'Unknown',
      },
      createdAt: report.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: reportsWithQuestions,
    });
  } catch (error) {
    console.error('Error getting reported questions for review:', error);
    return next(createError(500, 'Failed to fetch reported questions'));
  }
};

/**
 * Update question based on report (Admin only)
 * PUT /api/mcq/admin/reports/:reportId/resolve
 */
const resolveReport = async (req, res, next) => {
  try {

    const { reportId } = req.params;
    const { action, questionUpdates, adminNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return next(createError(400, 'Invalid report ID'));
    }

    const report = await QuestionReport.findById(reportId);
    if (!report) {
      return next(createError(404, 'Report not found'));
    }

    if (report.status !== 'pending') {
      return next(createError(400, 'Report has already been processed'));
    }

    // Update question if updates provided
    if (action === 'update' && questionUpdates) {
      const allModels = getAllModels();
      const QuestionModel = allModels[report.subject];

      const updateData = {};
      if (questionUpdates.question) updateData.question = questionUpdates.question;
      if (questionUpdates.options) updateData.options = questionUpdates.options;
      if (questionUpdates.correctanswrs) updateData.correctanswrs = questionUpdates.correctanswrs;
      if (questionUpdates.solution) updateData.solution = questionUpdates.solution;

      if (Object.keys(updateData).length > 0) {
        await QuestionModel.findByIdAndUpdate(report.questionId, updateData);
      }
    }

    // Update report status
    report.status = action === 'dismiss' ? 'dismissed' : 'resolved';
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    if (adminNotes) {
      report.adminNotes = adminNotes.trim();
    }

    await report.save();

    res.status(200).json({
      success: true,
      message: `Report ${action === 'dismiss' ? 'dismissed' : 'resolved'} successfully`,
      data: { reportId: report._id },
    });
  } catch (error) {
    console.error('Error resolving report:', error);
    return next(createError(500, 'Failed to resolve report'));
  }
};

module.exports = {
  reportQuestion,
  getReportedQuestionsBySubjects,
  getReportedQuestionsByChapters,
  getReportedQuestionsForReview,
  resolveReport,
};

