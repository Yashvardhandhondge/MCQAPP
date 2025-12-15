const createError = require('http-errors');
const User = require('../Modals/UserModal');
const { getModelBySubject, getAllModels } = require('../models/Mcq');
const UserAttempt = require('../models/UserAttempt');
const mongoose = require('mongoose');

/**
 * Save a question for the current user
 * POST /api/mcq/questions/:questionId/save
 */
const saveQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const userId = req.user._id;

    if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
      return next(createError(400, 'Invalid question ID'));
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
        // Continue searching in other collections
        continue;
      }
    }

    if (!question) {
      return next(createError(404, 'Question not found'));
    }

    // Get user and check if question is already saved
    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, 'User not found'));
    }

    // Check if question is already saved
    const questionIdObj = new mongoose.Types.ObjectId(questionId);
    if (user.savedQuestions && user.savedQuestions.some(id => id.toString() === questionId)) {
      return res.status(200).json({
        success: true,
        message: 'Question already saved',
        data: { isSaved: true },
      });
    }

    // Add question to savedQuestions array
    if (!user.savedQuestions) {
      user.savedQuestions = [];
    }
    user.savedQuestions.push(questionIdObj);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Question saved successfully',
      data: { isSaved: true },
    });
  } catch (error) {
    console.error('Error saving question:', error);
    return next(createError(500, 'Failed to save question'));
  }
};

/**
 * Unsave a question for the current user
 * DELETE /api/mcq/questions/:questionId/save
 */
const unsaveQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const userId = req.user._id;

    if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
      return next(createError(400, 'Invalid question ID'));
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, 'User not found'));
    }

    // Remove question from savedQuestions array
    if (user.savedQuestions && user.savedQuestions.length > 0) {
      user.savedQuestions = user.savedQuestions.filter(
        id => id.toString() !== questionId
      );
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Question unsaved successfully',
      data: { isSaved: false },
    });
  } catch (error) {
    console.error('Error unsaving question:', error);
    return next(createError(500, 'Failed to unsave question'));
  }
};

/**
 * Get all saved questions for the current user
 * GET /api/mcq/me/saved-questions
 */
const getSavedQuestions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return next(createError(400, 'Invalid pagination parameters. Page must be >= 1, limit must be between 1-100'));
    }

    // Get user with saved questions
    const user = await User.findById(userId).select('savedQuestions');
    if (!user) {
      return next(createError(404, 'User not found'));
    }

    if (!user.savedQuestions || user.savedQuestions.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          currentPage: pageNum,
          totalPages: 0,
          totalQuestions: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    }

    // Get all saved question IDs
    const savedQuestionIds = user.savedQuestions.map(id => id.toString());

    // Find questions across all subject collections
    const allModels = getAllModels();
    const questions = [];

    for (const [subject, Model] of Object.entries(allModels)) {
      try {
        const foundQuestions = await Model.find({
          _id: { $in: savedQuestionIds },
        }).lean();
        
        // Add subject info to each question
        foundQuestions.forEach(q => {
          questions.push({
            ...q,
            subject: subject, // Ensure subject is set
          });
        });
      } catch (error) {
        // Continue if collection doesn't exist
        continue;
      }
    }

    // Sort questions to match the order in savedQuestions array
    const questionMap = new Map(questions.map(q => [q._id.toString(), q]));
    const orderedQuestions = savedQuestionIds
      .map(id => questionMap.get(id))
      .filter(q => q !== undefined);

    // Apply pagination
    const totalQuestions = orderedQuestions.length;
    const totalPages = Math.ceil(totalQuestions / limitNum);
    const paginatedQuestions = orderedQuestions.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum
    );

    res.status(200).json({
      success: true,
      data: paginatedQuestions,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalQuestions,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('Error getting saved questions:', error);
    return next(createError(500, 'Failed to fetch saved questions'));
  }
};

/**
 * Check if a question is saved for the current user
 * GET /api/mcq/questions/:questionId/saved-status
 */
const getSavedStatus = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const userId = req.user._id;

    if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
      return next(createError(400, 'Invalid question ID'));
    }

    // Get user
    const user = await User.findById(userId).select('savedQuestions');
    if (!user) {
      return next(createError(404, 'User not found'));
    }

    // Check if question is saved
    const isSaved = user.savedQuestions && user.savedQuestions.some(
      id => id.toString() === questionId
    );

    res.status(200).json({
      success: true,
      data: { isSaved },
    });
  } catch (error) {
    console.error('Error checking saved status:', error);
    return next(createError(500, 'Failed to check saved status'));
  }
};

/**
 * Get saved questions grouped by subject
 * GET /api/mcq/me/saved-questions/subjects
 */
const getSavedQuestionsBySubjects = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get user with saved questions
    const user = await User.findById(userId).select('savedQuestions');
    if (!user) {
      return next(createError(404, 'User not found'));
    }

    if (!user.savedQuestions || user.savedQuestions.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Get all saved question IDs
    const savedQuestionIds = user.savedQuestions.map(id => id.toString());

    // Find questions across all subject collections and group by subject
    const allModels = getAllModels();
    const subjectMap = new Map();

    for (const [subject, Model] of Object.entries(allModels)) {
      try {
        const foundQuestions = await Model.find({
          _id: { $in: savedQuestionIds },
        }).lean();
        
        if (foundQuestions.length > 0) {
          subjectMap.set(subject, foundQuestions.length);
        }
      } catch (error) {
        // Continue if collection doesn't exist
        continue;
      }
    }

    // Convert to array format
    const subjects = Array.from(subjectMap.entries()).map(([subject, count]) => ({
      subject,
      questionCount: count,
    }));

    res.status(200).json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    console.error('Error getting saved questions by subjects:', error);
    return next(createError(500, 'Failed to fetch saved questions by subjects'));
  }
};

/**
 * Get saved questions grouped by chapters for a specific subject
 * GET /api/mcq/me/saved-questions/subjects/:subject/chapters
 */
const getSavedQuestionsByChapters = async (req, res, next) => {
  try {
    const { subject } = req.params;
    const userId = req.user._id;

    // Validate subject
    const validSubjects = ['Chemistry', 'Physics', 'Maths', 'Biology'];
    if (!validSubjects.includes(subject)) {
      return next(createError(400, 'Invalid subject. Must be one of: Chemistry, Physics, Maths, Biology'));
    }

    // Get user with saved questions
    const user = await User.findById(userId).select('savedQuestions');
    if (!user) {
      return next(createError(404, 'User not found'));
    }

    if (!user.savedQuestions || user.savedQuestions.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Get all saved question IDs
    const savedQuestionIds = user.savedQuestions.map(id => id.toString());

    // Find questions for this subject
    const Model = getModelBySubject(subject);
    const questions = await Model.find({
      _id: { $in: savedQuestionIds },
      subject: subject,
    }).lean();

    if (questions.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Group by chapter
    const chapterMap = new Map();
    questions.forEach(q => {
      const chapter = q.chapter;
      if (!chapterMap.has(chapter)) {
        chapterMap.set(chapter, 0);
      }
      chapterMap.set(chapter, chapterMap.get(chapter) + 1);
    });

    // Convert to array format
    const chapters = Array.from(chapterMap.entries()).map(([chapter, count]) => ({
      chapter,
      questionCount: count,
    })).sort((a, b) => a.chapter.localeCompare(b.chapter));

    res.status(200).json({
      success: true,
      data: chapters,
    });
  } catch (error) {
    console.error('Error getting saved questions by chapters:', error);
    return next(createError(500, 'Failed to fetch saved questions by chapters'));
  }
};

/**
 * Get saved questions for a specific subject and chapter with user attempts
 * GET /api/mcq/me/saved-questions/subjects/:subject/chapters/:chapter/questions
 */
const getSavedQuestionsBySubjectAndChapter = async (req, res, next) => {
  try {
    const { subject, chapter } = req.params;
    const userId = req.user._id;

    // Validate subject
    const validSubjects = ['Chemistry', 'Physics', 'Maths', 'Biology'];
    if (!validSubjects.includes(subject)) {
      return next(createError(400, 'Invalid subject. Must be one of: Chemistry, Physics, Maths, Biology'));
    }

    // Get user with saved questions
    const user = await User.findById(userId).select('savedQuestions');
    if (!user) {
      return next(createError(404, 'User not found'));
    }

    if (!user.savedQuestions || user.savedQuestions.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Get all saved question IDs
    const savedQuestionIds = user.savedQuestions.map(id => id.toString());

    // Find questions for this subject and chapter
    const Model = getModelBySubject(subject);
    const decodedChapter = decodeURIComponent(chapter);
    const questions = await Model.find({
      _id: { $in: savedQuestionIds },
      subject: subject,
      chapter: decodedChapter,
    }).lean();

    if (questions.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Get user attempts for these questions
    const questionIds = questions.map(q => q._id);
    const userAttempts = await UserAttempt.find({
      user: userId,
      question: { $in: questionIds },
    }).lean();

    // Create a map of questionId -> attempt
    const attemptMap = new Map();
    userAttempts.forEach(attempt => {
      attemptMap.set(attempt.question.toString(), {
        selectedOption: attempt.selectedOption,
        isCorrect: attempt.isCorrect,
        answeredAt: attempt.answeredAt,
      });
    });

    // Add attempt info to questions
    const questionsWithAttempts = questions.map(q => {
      const attempt = attemptMap.get(q._id.toString());
      return {
        ...q,
        userAttempt: attempt || null,
      };
    });

    // Sort to match the order in savedQuestions array
    const questionMap = new Map(questionsWithAttempts.map(q => [q._id.toString(), q]));
    const orderedQuestions = savedQuestionIds
      .map(id => questionMap.get(id))
      .filter(q => q !== undefined);

    res.status(200).json({
      success: true,
      data: orderedQuestions,
    });
  } catch (error) {
    console.error('Error getting saved questions by subject and chapter:', error);
    return next(createError(500, 'Failed to fetch saved questions'));
  }
};

module.exports = {
  saveQuestion,
  unsaveQuestion,
  getSavedQuestions,
  getSavedStatus,
  getSavedQuestionsBySubjects,
  getSavedQuestionsByChapters,
  getSavedQuestionsBySubjectAndChapter,
};

