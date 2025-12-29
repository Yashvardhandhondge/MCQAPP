const createError = require('http-errors');
const { getModelBySubject, getAllModels } = require('../models/Mcq');
const UserAttempt = require('../models/UserAttempt');
const TestSession = require('../models/TestSession');
const DailyQuestionView = require('../models/DailyQuestionView');
const mongoose = require('mongoose');
const { getChapterInfo } = require('../config/chapterMapping');

/**
 * Helper function to check if a chapter is locked for a non-premium user
 * Non-premium users can access:
 * - 11th standard: chapters with chapterNumber 1 and 2 (first 2 chapters)
 * - 12th standard: chapter with chapterNumber 1 (first 1 chapter)
 * @param {Object} user - The user object
 * @param {string} subject - The subject name
 * @param {string} chapter - The chapter name
 * @param {Object} Model - The Mongoose model for the subject
 * @returns {Promise<boolean>} - Returns true if chapter is locked, false if accessible
 */
const isChapterLocked = async (user, subject, chapter, Model) => {
  // Premium users have access to all chapters
  if (user.subscription === 'premium') {
    return false;
  }

  // Get chapter info from chapterMapping (standard and chapterNumber)
  const chapterInfo = getChapterInfo(subject, chapter);

  // If chapter not found in mapping, consider it locked (safety check)
  if (!chapterInfo || !chapterInfo.chapterNumber || !chapterInfo.standard) {
    return true;
  }

  // Check based on standard:
  // - 11th standard: allow chapters 1 and 2 (chapterNumber <= 2)
  // - 12th standard: allow chapter 1 only (chapterNumber <= 1)
  if (chapterInfo.standard === '11') {
    return chapterInfo.chapterNumber > 2;
  } else if (chapterInfo.standard === '12') {
    return chapterInfo.chapterNumber > 1;
  }

  // If standard is not 11 or 12, lock it
  return true;
};

/**
 * Helper function to check if a year should be blurred for a non-premium user
 * For free chapters (11th: chapters 1-2, 12th: chapter 1), all years are accessible
 * For locked chapters, all years are shown but blurred
 * @param {Object} user - The user object
 * @param {string} subject - The subject name
 * @param {string} chapter - The chapter name
 * @returns {Promise<boolean>} - Returns true if year should be blurred, false if accessible
 */
const shouldBlurYear = async (user, subject, chapter) => {
  // Premium users have access to all years without blur
  if (user.subscription === 'premium') {
    return false;
  }

  // Get chapter info from chapterMapping (standard and chapterNumber)
  const chapterInfo = getChapterInfo(subject, chapter);

  // If chapter not found in mapping, blur it (safety check)
  if (!chapterInfo || !chapterInfo.chapterNumber || !chapterInfo.standard) {
    return true;
  }

  // Check based on standard:
  // - 11th standard: chapters 1 and 2 (chapterNumber <= 2) - all years accessible (no blur)
  // - 12th standard: chapter 1 (chapterNumber <= 1) - all years accessible (no blur)
  if (chapterInfo.standard === '11' && chapterInfo.chapterNumber <= 2) {
    return false;
  } else if (chapterInfo.standard === '12' && chapterInfo.chapterNumber <= 1) {
    return false;
  }

  // For locked chapters (3rd chapter onwards), blur all years
  return true;
};

/**
 * Get dashboard summary with total questions and subject-wise counts
 * Filters subjects based on user's group (PCM, PCB, PCMB)
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const user = req.user;
    const userGroup = user.group;

    // Define subject groups
    const groupSubjects = {
      PCM: ['Chemistry', 'Physics', 'Maths'],
      PCB: ['Chemistry', 'Physics', 'Biology'],
      PCMB: ['Chemistry', 'Physics', 'Maths', 'Biology'],
    };

    // Get subjects based on user's group, default to all if no group selected
    let subjectsToShow = ['Chemistry', 'Physics', 'Maths', 'Biology'];
    if (userGroup && groupSubjects[userGroup]) {
      subjectsToShow = groupSubjects[userGroup];
    }

    const subjectData = [];
    let totalQuestions = 0;

    // Get count for each subject
    for (const subject of subjectsToShow) {
      try {
        const Model = getModelBySubject(subject);
        const count = await Model.countDocuments();
        
        subjectData.push({
          name: subject,
          questionCount: count,
        });
        
        totalQuestions += count;
      } catch (error) {
        // If collection doesn't exist, count is 0
        subjectData.push({
          name: subject,
          questionCount: 0,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalQuestions,
        subjects: subjectData,
      },
    });
  } catch (error) {
    console.error('Error getting dashboard summary:', error);
    return next(createError(500, 'Failed to fetch dashboard summary'));
  }
};

/**
 * Get distinct chapters for a specific subject
 */
const getChaptersBySubject = async (req, res, next) => {
  try {
    const { subject } = req.params;

    // Validate subject
    const validSubjects = ['Chemistry', 'Physics', 'Maths', 'Biology'];
    if (!validSubjects.includes(subject)) {
      return next(createError(400, 'Invalid subject. Must be one of: Chemistry, Physics, Maths, Biology'));
    }

    const Model = getModelBySubject(subject);
    
    // Get distinct chapters for the subject
    const chapters = await Model.distinct('chapter');

    if (!chapters || chapters.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No chapters found for subject: ${subject}`,
      });
    }

    res.status(200).json({
      success: true,
      data: chapters.sort(), // Sort alphabetically
    });
  } catch (error) {
    console.error('Error getting chapters by subject:', error);
    return next(createError(500, 'Failed to fetch chapters'));
  }
};

/**
 * Get chapters with analytics (total questions and user attempts) for a specific subject
 * GET /api/mcq/subjects/:subject/chapters/analytics
 * Returns chapters grouped by standard (11th/12th) with chapter numbers
 */
const getChaptersWithAnalytics = async (req, res, next) => {
  try {
    const { subject } = req.params;
    const userId = req.user._id;

    // Validate subject
    const validSubjects = ['Chemistry', 'Physics', 'Maths', 'Biology'];
    if (!validSubjects.includes(subject)) {
      return next(createError(400, 'Invalid subject. Must be one of: Chemistry, Physics, Maths, Biology'));
    }

    const Model = getModelBySubject(subject);
    
    // Get distinct chapters for the subject
    const chapters = await Model.distinct('chapter');

    if (!chapters || chapters.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No chapters found for subject: ${subject}`,
      });
    }

    // Use aggregation to get question counts per chapter (more efficient)
    const questionCounts = await Model.aggregate([
      { $match: { subject: subject } },
      {
        $group: {
          _id: '$chapter',
          totalQuestions: { $sum: 1 },
        },
      },
    ]);

    // Use aggregation to get user attempt counts per chapter
    const userAttemptCounts = await UserAttempt.aggregate([
      {
        $match: {
          user: userId,
          subject: subject,
        },
      },
      {
        $group: {
          _id: '$chapter',
          userAttempts: { $sum: 1 },
        },
      },
    ]);

    // Create maps for quick lookup
    const questionCountMap = new Map(
      questionCounts.map((item) => [item._id, item.totalQuestions])
    );
    const attemptCountMap = new Map(
      userAttemptCounts.map((item) => [item._id, item.userAttempts])
    );

    // Group chapters by standard and assign chapter numbers
    const standard11Chapters = [];
    const standard12Chapters = [];
    const unclassifiedChapters = [];

    chapters.forEach((chapter) => {
      const chapterInfo = getChapterInfo(subject, chapter);
      const chapterData = {
        chapter,
        totalQuestions: questionCountMap.get(chapter) || 0,
        userAttempts: attemptCountMap.get(chapter) || 0,
      };

      if (chapterInfo) {
        chapterData.standard = chapterInfo.standard;
        chapterData.chapterNumber = chapterInfo.chapterNumber;
        // Add exam weightage (MHT-CET exam questions and marks)
        chapterData.examQuestions = chapterInfo.examQuestions !== undefined ? chapterInfo.examQuestions : null;
        chapterData.examMarks = chapterInfo.examMarks !== undefined ? chapterInfo.examMarks : null;
        
        if (chapterInfo.standard === '11') {
          standard11Chapters.push(chapterData);
        } else if (chapterInfo.standard === '12') {
          standard12Chapters.push(chapterData);
        } else {
          unclassifiedChapters.push(chapterData);
        }
      } else {
        // If chapter not found in mapping, add to unclassified
        console.log(`[Chapter Mapping] Chapter "${chapter}" for subject "${subject}" not found in mapping - adding to unclassified`);
        unclassifiedChapters.push(chapterData);
      }
    });

    console.log(`[Chapter Mapping] Subject: ${subject}, Std. 11: ${standard11Chapters.length}, Std. 12: ${standard12Chapters.length}, Unclassified: ${unclassifiedChapters.length}`);

    // Sort chapters by chapter number within each standard
    standard11Chapters.sort((a, b) => {
      if (a.chapterNumber !== undefined && b.chapterNumber !== undefined) {
        return a.chapterNumber - b.chapterNumber;
      }
      return a.chapter.localeCompare(b.chapter);
    });

    standard12Chapters.sort((a, b) => {
      if (a.chapterNumber !== undefined && b.chapterNumber !== undefined) {
        return a.chapterNumber - b.chapterNumber;
      }
      return a.chapter.localeCompare(b.chapter);
    });

    unclassifiedChapters.sort((a, b) => a.chapter.localeCompare(b.chapter));

    // Return grouped by standard
    res.status(200).json({
      success: true,
      data: {
        standard11: standard11Chapters,
        standard12: standard12Chapters,
        unclassified: unclassifiedChapters,
      },
    });
  } catch (error) {
    console.error('Error getting chapters with analytics:', error);
    return next(createError(500, 'Failed to fetch chapters analytics'));
  }
};

/**
 * Get distinct years for a specific subject and chapter
 * Only returns years that actually have questions (verified by count)
 */
const getYearsBySubjectAndChapter = async (req, res, next) => {
  try {
    const { subject, chapter } = req.params;

    // Validate subject
    const validSubjects = ['Chemistry', 'Physics', 'Maths', 'Biology'];
    if (!validSubjects.includes(subject)) {
      return next(createError(400, 'Invalid subject. Must be one of: Chemistry, Physics, Maths, Biology'));
    }

    const Model = getModelBySubject(subject);
    const decodedChapter = decodeURIComponent(chapter);
    
    // Use aggregation to get years that actually have questions
    // This ensures we only return years where questions exist
    const yearResults = await Model.aggregate([
      {
        $match: {
          subject: subject,
          chapter: decodedChapter
        }
      },
      {
        $group: {
          _id: '$year',
          questionCount: { $sum: 1 }
        }
      },
      {
        $match: {
          questionCount: { $gt: 0 } // Only include years with at least 1 question
        }
      },
      {
        $project: {
          _id: 0,
          year: '$_id'
        }
      }
    ]);

    // Extract years from aggregation results and normalize them
    // Normalize: convert all years to strings to merge duplicates (e.g., 2010 and "2010")
    const yearMap = new Map();
    
    yearResults.forEach(result => {
      const year = result.year;
      // Normalize year: convert to string to merge duplicates
      const normalizedYear = String(year);
      
      // Use the normalized year as key to merge duplicates
      if (!yearMap.has(normalizedYear)) {
        yearMap.set(normalizedYear, normalizedYear);
      }
    });

    const years = Array.from(yearMap.values());

    if (!years || years.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No years found for subject: ${subject}, chapter: ${decodedChapter}`,
      });
    }

    // Sort years: numeric years first (ascending), then string years (alphabetically)
    const sortedYears = years.sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      
      // If both are numbers, sort numerically
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      
      // If one is a number, it comes first
      if (!isNaN(aNum)) return -1;
      if (!isNaN(bNum)) return 1;
      
      // Both are strings, sort alphabetically
      return a.localeCompare(b);
    });

    res.status(200).json({
      success: true,
      data: sortedYears,
    });
  } catch (error) {
    console.error('Error getting years by subject and chapter:', error);
    return next(createError(500, 'Failed to fetch years'));
  }
};

/**
 * Get years with analytics (total questions and user attempts) for a specific subject and chapter
 * GET /api/mcq/subjects/:subject/chapters/:chapter/years/analytics
 */
const getYearsWithAnalytics = async (req, res, next) => {
  try {
    const { subject, chapter } = req.params;
    const user = req.user;
    const userId = user._id;

    // Validate subject
    const validSubjects = ['Chemistry', 'Physics', 'Maths', 'Biology'];
    if (!validSubjects.includes(subject)) {
      return next(createError(400, 'Invalid subject. Must be one of: Chemistry, Physics, Maths, Biology'));
    }

    const Model = getModelBySubject(subject);
    const decodedChapter = decodeURIComponent(chapter);
    
    // Check if years should be blurred for this chapter
    const shouldBlur = await shouldBlurYear(user, subject, decodedChapter);
    
    // Use aggregation to get question counts per year
    const questionCounts = await Model.aggregate([
      {
        $match: {
          subject: subject,
          chapter: decodedChapter
        }
      },
      {
        $group: {
          _id: '$year',
          totalQuestions: { $sum: 1 }
        }
      },
      {
        $match: {
          totalQuestions: { $gt: 0 } // Only include years with at least 1 question
        }
      }
    ]);

    // Normalize years: convert all to strings to merge duplicates
    const yearMap = new Map();
    questionCounts.forEach(item => {
      const normalizedYear = String(item._id);
      if (!yearMap.has(normalizedYear)) {
        yearMap.set(normalizedYear, {
          year: normalizedYear,
          totalQuestions: item.totalQuestions
        });
      } else {
        // Merge duplicate years by adding question counts
        yearMap.get(normalizedYear).totalQuestions += item.totalQuestions;
      }
    });

    // Get user attempt counts per year
    const userAttemptCounts = await UserAttempt.aggregate([
      {
        $match: {
          user: userId,
          subject: subject,
          chapter: decodedChapter,
        },
      },
      {
        $group: {
          _id: '$year',
          userAttempts: { $sum: 1 },
        },
      },
    ]);

    // Create map for user attempts
    const attemptCountMap = new Map();
    userAttemptCounts.forEach(item => {
      const normalizedYear = String(item._id);
      attemptCountMap.set(normalizedYear, item.userAttempts);
    });

    // Combine data for all years
    const yearsWithAnalytics = Array.from(yearMap.values())
      .map(yearData => ({
        year: yearData.year,
        totalQuestions: yearData.totalQuestions,
        userAttempts: attemptCountMap.get(yearData.year) || 0,
        isBlurred: shouldBlur && user.subscription !== 'premium',
      }))
      .sort((a, b) => {
        // Sort years: numeric years first (ascending), then string years (alphabetically)
        const aNum = parseInt(a.year);
        const bNum = parseInt(b.year);
        
        // If both are numbers, sort numerically
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        
        // If one is a number, it comes first
        if (!isNaN(aNum)) return -1;
        if (!isNaN(bNum)) return 1;
        
        // Both are strings, sort alphabetically
        return a.year.localeCompare(b.year);
      });

    if (yearsWithAnalytics.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No years found for subject: ${subject}, chapter: ${decodedChapter}`,
      });
    }

    res.status(200).json({
      success: true,
      data: yearsWithAnalytics,
    });
  } catch (error) {
    console.error('Error getting years with analytics:', error);
    return next(createError(500, 'Failed to fetch years analytics'));
  }
};

/**
 * Get questions by subject and chapter (with optional pagination)
 */
const getQuestionsBySubjectAndChapter = async (req, res, next) => {
  try {
    const { subject, chapter } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const user = req.user;

    // Validate subject
    const validSubjects = ['Chemistry', 'Physics', 'Maths', 'Biology'];
    if (!validSubjects.includes(subject)) {
      return next(createError(400, 'Invalid subject. Must be one of: Chemistry, Physics, Maths, Biology'));
    }

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return next(createError(400, 'Invalid pagination parameters. Page must be >= 1, limit must be between 1-100'));
    }

    const Model = getModelBySubject(subject);
    const decodedChapter = decodeURIComponent(chapter);

    // Check if chapter is locked for non-premium users
    const locked = await isChapterLocked(user, subject, decodedChapter, Model);
    
    const filter = {
      subject: subject,
      chapter: decodedChapter
    };

    // Get questions with pagination
    const questions = await Model
      .find(filter)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    if (!questions || questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No questions found for subject: ${subject}, chapter: ${decodedChapter}`,
      });
    }

    // For locked chapters, mark questions as blurred for free users
    // Premium users see all questions without blur
    const questionsWithBlur = questions.map(q => ({
      ...q,
      isBlurred: locked && user.subscription !== 'premium'
    }));

    // Get total count for pagination info
    const totalQuestions = await Model.countDocuments(filter);
    const totalPages = Math.ceil(totalQuestions / limitNum);

    res.status(200).json({
      success: true,
      data: questionsWithBlur,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalQuestions,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      isChapterLocked: locked,
    });
  } catch (error) {
    console.error('Error getting questions by subject and chapter:', error);
    return next(createError(500, 'Failed to fetch questions'));
  }
};

/**
 * Get questions by subject, chapter, and year (with optional pagination)
 */
const getQuestionsBySubjectChapterAndYear = async (req, res, next) => {
  try {
    const { subject, chapter, year } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const user = req.user;

    // If year is not in params, check query params (for backward compatibility)
    const yearParam = year || req.query.year;
    if (!yearParam) {
      return next(createError(400, 'Year parameter is required'));
    }

    // Validate subject
    const validSubjects = ['Chemistry', 'Physics', 'Maths', 'Biology'];
    if (!validSubjects.includes(subject)) {
      return next(createError(400, 'Invalid subject. Must be one of: Chemistry, Physics, Maths, Biology'));
    }

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return next(createError(400, 'Invalid pagination parameters. Page must be >= 1, limit must be between 1-100'));
    }

    const Model = getModelBySubject(subject);
    const decodedChapter = decodeURIComponent(chapter);
    const decodedYear = decodeURIComponent(yearParam);

    // Normalize year: convert to string for consistent matching
    const normalizedYear = String(decodedYear);

    // Check if this year should be blurred for non-premium users
    const shouldBlur = await shouldBlurYear(user, subject, decodedChapter);
    
    // Match both number and string versions of the same year
    // Use $or to explicitly match both types, and also use $expr for type-agnostic matching
    const yearNum = parseInt(normalizedYear);
    let yearFilter;
    
    if (!isNaN(yearNum)) {
      // For numeric years, match both string and number versions using $or
      // Also use $expr with $toString to handle any type conversion issues
      yearFilter = {
        $or: [
          { year: normalizedYear },                    // Match as string "2019"
          { year: yearNum },                           // Match as number 2019
          { $expr: { $eq: [{ $toString: "$year" }, normalizedYear] } }  // Type-agnostic match
        ]
      };
    } else {
      // Non-numeric year, match as string only (with type conversion fallback)
      yearFilter = {
        $or: [
          { year: normalizedYear },
          { $expr: { $eq: [{ $toString: "$year" }, normalizedYear] } }
        ]
      };
    }
    
    const filter = {
      subject: subject,
      chapter: decodedChapter,
      ...yearFilter
    };

    // Get questions with pagination
    const questions = await Model
      .find(filter)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    if (!questions || questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No questions found for this subject, chapter, and year.",
      });
    }

    // For locked chapters, mark questions as blurred for free users
    // Premium users see all questions without blur
    const questionsWithBlur = questions.map(q => ({
      ...q,
      isBlurred: shouldBlur && user.subscription !== 'premium'
    }));

    // Get total count for pagination info
    const totalQuestions = await Model.countDocuments(filter);
    const totalPages = Math.ceil(totalQuestions / limitNum);

    res.status(200).json({
      success: true,
      data: questionsWithBlur,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalQuestions,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      shouldBlurYear: shouldBlur,
    });
  } catch (error) {
    console.error('Error getting questions by subject, chapter, and year:', error);
    return next(createError(500, 'Failed to fetch questions'));
  }
};

/**
 * Generate a random practice test based on filters
 */
const generatePracticeTest = async (req, res, next) => {
  try {
    const { subject, chapter, year } = req.query;
    const limit = req.query.limit || 20;

    if (!subject) {
      return next(createError(400, 'Subject is required.'));
    }

    const validSubjects = ['Chemistry', 'Physics', 'Maths', 'Biology'];
    if (!validSubjects.includes(subject)) {
      return next(createError(400, 'Invalid subject. Must be one of: Chemistry, Physics, Maths, Biology'));
    }

    const limitNum = parseInt(limit, 10);
    if (Number.isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return next(createError(400, 'Limit must be a number between 1 and 100.'));
    }

    const Model = getModelBySubject(subject);
    const filter = { subject };
    if (chapter) {
      filter.chapter = chapter;
    }
    if (year) {
      // Normalize year and match both number and string versions
      const normalizedYear = String(year);
      const yearNum = parseInt(normalizedYear);
      if (!isNaN(yearNum)) {
        // For numeric years, use $or to match both string and number versions
        filter.$or = [
          { year: normalizedYear },                    // Match as string "2019"
          { year: yearNum },                           // Match as number 2019
          { $expr: { $eq: [{ $toString: "$year" }, normalizedYear] } }  // Type-agnostic match
        ];
      } else {
        // Non-numeric year, match as string only (with type conversion fallback)
        filter.$or = [
          { year: normalizedYear },
          { $expr: { $eq: [{ $toString: "$year" }, normalizedYear] } }
        ];
      }
    }

    const questions = await Model.aggregate([
      { $match: filter },
      { $sample: { size: limitNum } },
    ]);

    if (!questions || questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No questions found for the given filters.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        questions,
        count: questions.length,
      },
    });
  } catch (error) {
    console.error('Error generating practice test:', error);
    return next(createError(500, 'Something went wrong while generating the practice test.'));
  }
};

/**
 * Generate random practice test for a chapter, excluding attempted questions
 * If <= 10 unattempted questions remain, include attempted questions too
 * GET /api/mcq/chapters/:subject/:chapter/practice
 */
const generateChapterPractice = async (req, res, next) => {
  try {
    const { subject, chapter } = req.params;
    const user = req.user;
    const userId = user._id;
    const limit = parseInt(req.query.limit) || 20;

    // Validate subject
    const validSubjects = ['Chemistry', 'Physics', 'Maths', 'Biology'];
    if (!validSubjects.includes(subject)) {
      return next(createError(400, 'Invalid subject. Must be one of: Chemistry, Physics, Maths, Biology'));
    }

    // Validate limit
    if (limit < 1 || limit > 100) {
      return next(createError(400, 'Limit must be between 1 and 100'));
    }

    const Model = getModelBySubject(subject);
    const decodedChapter = decodeURIComponent(chapter);

    // Check if chapter is locked for non-premium users
    const locked = await isChapterLocked(user, subject, decodedChapter, Model);
    if (locked) {
      return next(createError(403, 'This chapter is available for premium users only. Please upgrade to premium to access all chapters.'));
    }

    // Get all questions for this chapter
    const allQuestions = await Model.find({
      subject: subject,
      chapter: decodedChapter,
    }).lean();

    if (allQuestions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No questions found for this chapter',
      });
    }

    // Get user's attempted question IDs for this chapter
    const userAttempts = await UserAttempt.find({
      user: userId,
      subject: subject,
      chapter: decodedChapter,
    }).select('question').lean();

    const attemptedQuestionIds = new Set(
      userAttempts.map((attempt) => attempt.question.toString())
    );

    // Separate attempted and unattempted questions
    const unattemptedQuestions = allQuestions.filter(
      (q) => !attemptedQuestionIds.has(q._id.toString())
    );
    const attemptedQuestions = allQuestions.filter(
      (q) => attemptedQuestionIds.has(q._id.toString())
    );

    let selectedQuestions = [];

    // If <= 10 unattempted questions, include attempted questions too
    if (unattemptedQuestions.length <= 10) {
      // Mix unattempted and attempted questions
      const allAvailable = [...unattemptedQuestions, ...attemptedQuestions];
      // Shuffle and take requested limit
      const shuffled = allAvailable.sort(() => Math.random() - 0.5);
      selectedQuestions = shuffled.slice(0, Math.min(limit, shuffled.length));
    } else {
      // Only use unattempted questions
      const shuffled = unattemptedQuestions.sort(() => Math.random() - 0.5);
      selectedQuestions = shuffled.slice(0, Math.min(limit, shuffled.length));
    }

    if (selectedQuestions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No questions available for practice',
      });
    }

    // Extract question IDs
    const questionIds = selectedQuestions.map((q) => q._id);

    // Check for existing in-progress session for this chapter
    const existingSession = await TestSession.findOne({
      user: userId,
      testType: 'chapter',
      subject: subject,
      chapter: decodedChapter,
      status: 'in-progress',
    });

    let session;
    if (existingSession) {
      // Update existing session with new questions
      existingSession.questions = questionIds;
      existingSession.totalQuestions = questionIds.length;
      existingSession.startedAt = new Date();
      await existingSession.save();
      session = existingSession;
    } else {
      // Create new test session
      session = new TestSession({
        user: userId,
        testType: 'chapter',
        subject: subject,
        chapter: decodedChapter,
        questions: questionIds,
        questionModel: subject,
        totalQuestions: questionIds.length,
        status: 'in-progress',
        startedAt: new Date(),
      });
      await session.save();
    }

    return res.status(200).json({
      success: true,
      data: {
        sessionId: session._id,
        questions: questionIds,
        questionsData: selectedQuestions, // Include full question data for frontend
        count: selectedQuestions.length,
        unattemptedCount: unattemptedQuestions.length,
        attemptedCount: attemptedQuestions.length,
      },
    });
  } catch (error) {
    console.error('Error generating chapter practice:', error);
    return next(createError(500, 'Failed to generate chapter practice test'));
  }
};

/**
 * Get questions by their IDs (for test sessions)
 * POST /api/mcq/questions/by-ids
 */
const getQuestionsByIds = async (req, res, next) => {
  try {
    const { questionIds } = req.body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return next(createError(400, 'questionIds array is required'));
    }

    const allModels = getAllModels();
    const subjects = ['Chemistry', 'Physics', 'Maths', 'Biology'];
    const questions = [];

    // Search across all subject collections
    for (const subject of subjects) {
      const Model = allModels[subject];
      try {
        const foundQuestions = await Model.find({
          _id: { $in: questionIds },
        }).lean();
        questions.push(...foundQuestions);
      } catch (error) {
        // Continue if collection doesn't exist
        console.error(`Error querying ${subject}:`, error);
      }
    }

    // If questions not found in subject collections, try MockTest collection
    if (questions.length === 0) {
      try {
        const MockTestModel = require('../models/MockTest');
        const mockQuestions = await MockTestModel.find({
          _id: { $in: questionIds },
        }).lean();
        questions.push(...mockQuestions);
      } catch (error) {
        console.error('Error querying MockTest collection:', error);
      }
    }

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No questions found for the provided IDs',
      });
    }

    // Sort questions to match the order of questionIds
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));
    const orderedQuestions = questionIds
      .map((id) => questionMap.get(id.toString()))
      .filter((q) => q !== undefined);

    res.status(200).json({
      success: true,
      data: orderedQuestions,
    });
  } catch (error) {
    console.error('Error getting questions by IDs:', error);
    return next(createError(500, 'Failed to fetch questions'));
  }
};

/**
 * Track a question view for daily limit (for free users viewing blurred questions)
 * POST /api/mcq/questions/:questionId/reveal
 */
const revealQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const user = req.user;
    const userId = user._id;

    // Premium users don't have limits
    if (user.subscription === 'premium') {
      return res.status(200).json({
        success: true,
        message: 'Question revealed',
        isRevealed: true,
        dailyViewsRemaining: -1, // Unlimited for premium
      });
    }

    // Get today's date string
    const today = DailyQuestionView.getTodayDateString();
    const DAILY_LIMIT = 25;

    // Check today's view count
    const todayViews = await DailyQuestionView.countDocuments({
      user: userId,
      date: today,
    });

    // Check if user has reached daily limit
    if (todayViews >= DAILY_LIMIT) {
      return res.status(403).json({
        success: false,
        message: "You have reached your today's limit to see more questions. Upgrade to premium to see unlimited questions.",
        isRevealed: false,
        dailyViewsRemaining: 0,
        dailyLimit: DAILY_LIMIT,
      });
    }

    // Check if this question was already viewed today
    const existingView = await DailyQuestionView.findOne({
      user: userId,
      question: questionId,
      date: today,
    });

    if (existingView) {
      // Already viewed today, return success
      return res.status(200).json({
        success: true,
        message: 'Question revealed',
        isRevealed: true,
        dailyViewsRemaining: DAILY_LIMIT - todayViews,
        dailyLimit: DAILY_LIMIT,
      });
    }

    // Create new view record
    await DailyQuestionView.create({
      user: userId,
      question: questionId,
      date: today,
      viewedAt: new Date(),
    });

    // Return success with updated count
    const newTodayViews = todayViews + 1;
    return res.status(200).json({
      success: true,
      message: 'Question revealed',
      isRevealed: true,
      dailyViewsRemaining: DAILY_LIMIT - newTodayViews,
      dailyLimit: DAILY_LIMIT,
    });
  } catch (error) {
    console.error('Error revealing question:', error);
    return next(createError(500, 'Failed to reveal question'));
  }
};

/**
 * Get today's question view count for the user
 * GET /api/mcq/me/daily-views
 */
const getDailyViews = async (req, res, next) => {
  try {
    const user = req.user;
    const userId = user._id;

    // Premium users don't have limits
    if (user.subscription === 'premium') {
      return res.status(200).json({
        success: true,
        dailyViews: 0,
        dailyLimit: -1, // Unlimited
        dailyViewsRemaining: -1, // Unlimited
      });
    }

    const today = DailyQuestionView.getTodayDateString();
    const DAILY_LIMIT = 25;

    const todayViews = await DailyQuestionView.countDocuments({
      user: userId,
      date: today,
    });

    return res.status(200).json({
      success: true,
      dailyViews: todayViews,
      dailyLimit: DAILY_LIMIT,
      dailyViewsRemaining: Math.max(0, DAILY_LIMIT - todayViews),
    });
  } catch (error) {
    console.error('Error getting daily views:', error);
    return next(createError(500, 'Failed to get daily views'));
  }
};

module.exports = {
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
};