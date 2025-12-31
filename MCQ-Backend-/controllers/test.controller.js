const createError = require('http-errors');
const { getAllModels, getModelBySubject } = require('../models/Mcq');
const MockTestModel = require('../models/MockTest');
const TestSession = require('../models/TestSession');
const UserAttempt = require('../models/UserAttempt');
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
 * Get all available PYQ tests grouped by year and shift
 * GET /api/mcq/tests
 */
const getAvailableTests = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { filter } = req.query; // 'year' or 'subject'

    const allModels = getAllModels();
    const subjects = ['Chemistry', 'Physics', 'Maths', 'Biology'];
    
    // Get all distinct years from all subjects
    // Normalize years to merge duplicates (e.g., 2010 and "2010")
    const yearSet = new Set();
    const yearShiftMap = new Map(); // year -> Set of shifts
    
    for (const subject of subjects) {
      const Model = allModels[subject];
      const questions = await Model.find({}).select('year sourceFile').lean();
      
      questions.forEach((q) => {
        if (q.year) {
          // Normalize year: convert to string to merge duplicates
          const yearStr = String(q.year);
          yearSet.add(yearStr);
          
          // Extract shift from sourceFile if available (format: "MHT_CET_2024_Shift_2" or similar)
          let shift = '1'; // default shift
          if (q.sourceFile) {
            const shiftMatch = q.sourceFile.match(/shift[_\s]*(\d+)/i);
            if (shiftMatch) {
              shift = shiftMatch[1];
            }
          }
          
          const key = `${yearStr}_${shift}`;
          if (!yearShiftMap.has(key)) {
            yearShiftMap.set(key, { year: yearStr, shift });
          }
        }
      });
    }

    // Get user's test sessions to determine status
    const userSessions = await TestSession.find({
      user: userId,
      testType: 'pyq',
      status: { $in: ['completed', 'abandoned'] },
    }).lean();

    // Create test list with status
    const tests = [];
    for (const [key, { year, shift }] of yearShiftMap) {
      // Count total questions for this year/shift
      // Match both number and string versions of the year
      let totalQuestions = 0;
      for (const subject of subjects) {
        const Model = allModels[subject];
        const normalizedYear = String(year);
        const yearNum = parseInt(normalizedYear);
        let yearFilter;
        
        if (!isNaN(yearNum)) {
          // For numeric years, use $or to match both string and number versions
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
        
        const count = await Model.countDocuments({
          ...yearFilter,
          ...(shift && { sourceFile: new RegExp(`shift[_\s]*${shift}`, 'i') }),
        });
        totalQuestions += count;
      }

      // Find user's session for this test
      const session = userSessions.find(
        (s) => s.year === year && s.shift === shift
      );

      let status = 'not-started';
      let score = 0;
      let total = totalQuestions;

      if (session) {
        if (session.status === 'completed') {
          status = session.score >= (totalQuestions * 0.4) ? 'completed' : 'failed';
          score = session.score;
          total = session.totalQuestions || totalQuestions;
        } else {
          status = 'not-started'; // Treat abandoned as not started for retry
        }
      }

      tests.push({
        id: key,
        name: `PYQ MHT CET ${year}${shift ? ` | Shift ${shift}` : ''}`,
        year,
        shift: shift || '1',
        duration: 180, // 3 hours default
        status,
        score: status !== 'not-started' ? score : undefined,
        total: status !== 'not-started' ? total : undefined,
        questionCount: totalQuestions,
      });
    }

    // Sort by year descending, then by shift
    // Convert year to number for proper numeric sorting, fallback to string comparison
    tests.sort((a, b) => {
      const yearA = parseInt(a.year) || 0;
      const yearB = parseInt(b.year) || 0;
      if (yearA !== yearB) {
        return yearB - yearA; // Descending order
      }
      return parseInt(b.shift) - parseInt(a.shift);
    });

    // Filter by year or subject if requested
    let filteredTests = tests;
    if (filter === 'subject') {
      // Group by subject (would need to check which subjects have questions for each test)
      // For now, return all tests
      filteredTests = tests;
    }

    res.status(200).json({
      success: true,
      data: filteredTests,
    });
  } catch (error) {
    console.error('Error getting available tests:', error);
    return next(createError(500, 'Failed to fetch available tests'));
  }
};

/**
 * Get distinct years for PYQ tests
 * GET /api/mcq/tests/years
 * Uses aggregation to properly handle string and number year formats
 */
const getDistinctYears = async (req, res, next) => {
  try {
    const allModels = getAllModels();
    const subjects = ['Chemistry', 'Physics', 'Maths', 'Biology'];
    
    // Use aggregation to get distinct years from all subjects
    // This properly handles both string and number formats
    const allYearResults = [];
    
    for (const subject of subjects) {
      const Model = allModels[subject];
      try {
        const yearResults = await Model.aggregate([
          {
            $match: {
              year: { $exists: true, $ne: null }
            }
          },
          {
            $group: {
              _id: '$year',
              questionCount: { $sum: 1 }
            }
          },
          {
            $project: {
              _id: 0,
              year: '$_id'
            }
          }
        ]);
        allYearResults.push(...yearResults);
      } catch (error) {
        console.error(`Error aggregating years from ${subject}:`, error);
        // Continue with other subjects
      }
    }

    // Normalize years: convert all to strings to merge duplicates (e.g., 2010 and "2010")
    // Also handle cases where year might be an array or comma-separated string
    const yearMap = new Map();
    
    allYearResults.forEach(result => {
      const year = result.year;
      if (year !== null && year !== undefined) {
        // Handle array of years
        if (Array.isArray(year)) {
          year.forEach(y => {
            if (y !== null && y !== undefined) {
              const normalizedYear = String(y).trim();
              if (normalizedYear) {
                yearMap.set(normalizedYear, normalizedYear);
              }
            }
          });
        } else {
          // Handle string that might contain comma-separated years
          const yearStr = String(year).trim();
          if (yearStr.includes(',')) {
            // Split comma-separated years
            yearStr.split(',').forEach(y => {
              const normalizedYear = y.trim();
              if (normalizedYear) {
                yearMap.set(normalizedYear, normalizedYear);
              }
            });
          } else {
            // Single year value
            const normalizedYear = yearStr;
            if (normalizedYear) {
              yearMap.set(normalizedYear, normalizedYear);
            }
          }
        }
      }
    });

    const years = Array.from(yearMap.values());

    if (!years || years.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Sort years: numeric years descending, then string years alphabetically
    const sortedYears = years.sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      
      // If both are numbers, sort numerically (descending)
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return bNum - aNum; // Descending order
      }
      
      // If one is a number, it comes first
      if (!isNaN(aNum)) return -1;
      if (!isNaN(bNum)) return 1;
      
      // Both are strings, sort alphabetically (descending)
      return b.localeCompare(a);
    });

    res.status(200).json({
      success: true,
      data: sortedYears,
    });
  } catch (error) {
    console.error('Error getting distinct years:', error);
    return next(createError(500, 'Failed to fetch distinct years'));
  }
};

/**
 * Generate a random test with questions from any subjects
 * POST /api/mcq/tests/random
 * Supports year and subject filters, prioritizes unattempted questions
 */
const generateRandomTest = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { questionCount = 25, year, subject } = req.body; // Optional filters

    // Validate question count
    const count = Math.max(10, Math.min(100, parseInt(questionCount) || 25));

    const allModels = getAllModels();
    const subjects = ['Chemistry', 'Physics', 'Maths', 'Biology'];
    const targetSubjects = subject ? [subject] : subjects;

    // Build year filter if year is provided (match both number and string versions)
    let yearFilter = {};
    if (year) {
      const normalizedYear = String(year);
      const yearNum = parseInt(normalizedYear);
      
      if (!isNaN(yearNum)) {
        yearFilter = {
          $or: [
            { year: normalizedYear },
            { year: yearNum },
            { $expr: { $eq: [{ $toString: "$year" }, normalizedYear] } }
          ]
        };
      } else {
        yearFilter = {
          $or: [
            { year: normalizedYear },
            { $expr: { $eq: [{ $toString: "$year" }, normalizedYear] } }
          ]
        };
      }
    }

    // Get user's attempted question IDs
    const userAttempts = await UserAttempt.find({ user: userId }).select('question').lean();
    const attemptedQuestionIds = new Set(userAttempts.map(a => a.question.toString()));

    // Collect questions from target subjects (with optional year filter)
    const allQuestionIds = [];
    const questionSubjectMap = new Map(); // questionId -> subject

    for (const subj of targetSubjects) {
      const Model = allModels[subj];
      try {
        const queryFilter = Object.keys(yearFilter).length > 0 ? yearFilter : {};
        const questions = await Model.find(queryFilter).select('_id').lean();
        questions.forEach((q) => {
          allQuestionIds.push(q._id);
          questionSubjectMap.set(q._id.toString(), subj);
        });
      } catch (error) {
        console.error(`Error fetching questions from ${subj}:`, error);
      }
    }

    if (allQuestionIds.length === 0) {
      return next(createError(404, 'No questions available in database'));
    }

    // Separate unattempted and attempted questions
    const unattemptedQuestions = [];
    const attemptedQuestions = [];

    allQuestionIds.forEach((id) => {
      const idStr = id.toString();
      if (!attemptedQuestionIds.has(idStr)) {
        unattemptedQuestions.push(id);
      } else {
        attemptedQuestions.push(id);
      }
    });

    // Prioritize unattempted questions
    let selectedQuestionIds = [];
    
    if (unattemptedQuestions.length >= count) {
      // Enough unattempted questions, randomly select from them
      const shuffled = [...unattemptedQuestions].sort(() => Math.random() - 0.5);
      selectedQuestionIds = shuffled.slice(0, count);
    } else {
      // Not enough unattempted, use all unattempted + fill with attempted
      const shuffledAttempted = [...attemptedQuestions].sort(() => Math.random() - 0.5);
      const neededFromAttempted = count - unattemptedQuestions.length;
      selectedQuestionIds = [
        ...unattemptedQuestions,
        ...shuffledAttempted.slice(0, neededFromAttempted)
      ];
      // Shuffle the final selection
      selectedQuestionIds = selectedQuestionIds.sort(() => Math.random() - 0.5);
    }

    // Determine primary subject for the test
    const subjectCounts = new Map();
    selectedQuestionIds.forEach((id) => {
      const subj = questionSubjectMap.get(id.toString());
      if (subj) {
        subjectCounts.set(subj, (subjectCounts.get(subj) || 0) + 1);
      }
    });
    const primarySubject = Array.from(subjectCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || targetSubjects[0];

    // Create new test session
    const session = new TestSession({
      user: userId,
      testType: 'practice',
      questions: selectedQuestionIds,
      questionModel: primarySubject,
      totalQuestions: selectedQuestionIds.length,
      status: 'in-progress',
      startedAt: new Date(),
      year: year || undefined,
      subject: subject || undefined,
    });

    await session.save();

    res.status(201).json({
      success: true,
      data: {
        sessionId: session._id,
        questions: selectedQuestionIds,
        testType: 'random',
        questionCount: selectedQuestionIds.length,
      },
    });
  } catch (error) {
    console.error('Error generating random test:', error);
    return next(createError(500, 'Failed to generate random test'));
  }
};

/**
 * Start a new test session
 * POST /api/mcq/tests/start
 */
const startTestSession = async (req, res, next) => {
  try {
    const user = req.user;
    const userId = user._id;
    const { year, shift, subject, chapter, testType = 'pyq', limit = 200 } = req.body;

    if (testType === 'pyq' && (!year || !shift)) {
      return next(createError(400, 'Year and shift are required for PYQ tests'));
    }

    const allModels = getAllModels();
    const subjects = ['Chemistry', 'Physics', 'Maths', 'Biology'];

    // Collect questions for the test
    const questionIds = [];
    let questionModel = null;

    if (testType === 'pyq') {
      // Get questions from all subjects for the year/shift
      // Match both number and string versions of the year
      const normalizedYear = String(year);
      const yearNum = parseInt(normalizedYear);
      let yearFilter;
      
      if (!isNaN(yearNum)) {
        // For numeric years, use $or to match both string and number versions
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
      
      for (const subj of subjects) {
        const Model = allModels[subj];
        const filter = {
          ...yearFilter,
          ...(shift && { sourceFile: new RegExp(`shift[_\s]*${shift}`, 'i') }),
        };
        const questions = await Model.find(filter).limit(limit / subjects.length).lean();
        questionIds.push(...questions.map((q) => q._id));
        if (questions.length > 0 && !questionModel) {
          questionModel = subj;
        }
      }
    } else if (testType === 'chapter' && subject && chapter) {
      // Chapter practice test
      const Model = getModelBySubject(subject);
      
      // Check if chapter is locked for non-premium users
      const decodedChapter = decodeURIComponent(chapter);
      const locked = await isChapterLocked(user, subject, decodedChapter, Model);
      if (locked) {
        return next(createError(403, 'This chapter is available for premium users only. Please upgrade to premium to access all chapters.'));
      }
      
      questionModel = subject;
      const questions = await Model.find({ subject, chapter: decodedChapter })
        .limit(parseInt(limit))
        .lean();
      questionIds.push(...questions.map((q) => q._id));
    } else {
      return next(createError(400, 'Invalid test parameters'));
    }

    if (questionIds.length === 0) {
      return next(createError(404, 'No questions found for this test'));
    }

    // Check for existing in-progress session
    const existingSession = await TestSession.findOne({
      user: userId,
      testType,
      year,
      shift,
      status: 'in-progress',
    });

    if (existingSession) {
      return res.status(200).json({
        success: true,
        data: {
          sessionId: existingSession._id,
          questions: questionIds,
          testType,
          year,
          shift,
        },
      });
    }

    // Create new test session
    const session = new TestSession({
      user: userId,
      testType,
      year,
      shift,
      subject,
      chapter,
      questions: questionIds,
      questionModel: questionModel || subjects[0],
      totalQuestions: questionIds.length,
      status: 'in-progress',
      startedAt: new Date(),
    });

    await session.save();

    res.status(201).json({
      success: true,
      data: {
        sessionId: session._id,
        questions: questionIds,
        testType,
        year,
        shift,
      },
    });
  } catch (error) {
    console.error('Error starting test session:', error);
    return next(createError(500, 'Failed to start test session'));
  }
};

/**
 * Submit test answers and complete session
 * POST /api/mcq/tests/submit
 */
const submitTestSession = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { sessionId, answers } = req.body;

    if (!sessionId || !answers || !Array.isArray(answers)) {
      return next(createError(400, 'Session ID and answers array are required'));
    }

    const session = await TestSession.findOne({
      _id: sessionId,
      user: userId,
      status: 'in-progress',
    });

    if (!session) {
      return next(createError(404, 'Test session not found or already completed'));
    }

    // Get questions to verify answers - handle multiple subjects for random tests and mock tests
    const { getAllModels, getModelBySubject } = require('../models/Mcq');
    const allModels = getAllModels();
    const allQuestions = [];
    
    // For mock tests, query from MockTest collection
    if (session.testType === 'mocktest') {
      try {
        const mockQuestions = await MockTestModel.find({ _id: { $in: session.questions } }).lean();
        allQuestions.push(...mockQuestions);
      } catch (error) {
        console.error('Error querying MockTest collection:', error);
      }
    } else {
      // Try to find questions in all subject collections
      for (const [subject, Model] of Object.entries(allModels)) {
        try {
          const questions = await Model.find({ _id: { $in: session.questions } }).lean();
          allQuestions.push(...questions);
        } catch (error) {
          // Continue if collection doesn't exist or query fails
          console.error(`Error querying ${subject}:`, error);
        }
      }
    }
    
    const questionMap = new Map(allQuestions.map((q) => [q._id.toString(), q]));

    // Process answers and calculate score
    let correctCount = 0;
    let totalMarks = 0;
    const processedAnswers = answers.map((ans) => {
      // Ensure questionId is converted to string for comparison
      const questionIdStr = ans.questionId ? ans.questionId.toString() : null;
      const question = questionIdStr ? questionMap.get(questionIdStr) : null;
      
      // Calculate isCorrect - ensure it's always a boolean
      let isCorrect = false;
      if (question && ans.selectedOption && question.correctanswrs) {
        isCorrect = ans.selectedOption.trim() === question.correctanswrs.trim();
      }
      
      // For mock tests, calculate marks based on subject (check both 'subject' and 'sub' fields for compatibility)
      if (session.testType === 'mocktest' && isCorrect) {
        const subject = question?.subject || question?.sub;
        if (subject === 'Maths' || subject === 'Mathematics') {
          totalMarks += 2; // 2 marks for Maths
        } else if (subject === 'Physics' || subject === 'Chemistry') {
          totalMarks += 1; // 1 mark for Physics and Chemistry
        }
      }
      
      if (isCorrect) correctCount++;
      
      // Ensure questionId is properly formatted (convert string to ObjectId if needed)
      let questionIdToStore = ans.questionId;
      if (typeof questionIdToStore === 'string') {
        const mongoose = require('mongoose');
        questionIdToStore = mongoose.Types.ObjectId.isValid(questionIdToStore) 
          ? new mongoose.Types.ObjectId(questionIdToStore) 
          : questionIdToStore;
      }
      
      return {
        questionId: questionIdToStore,
        selectedOption: ans.selectedOption || '',
        isCorrect: Boolean(isCorrect), // Explicitly convert to boolean
        answeredAt: new Date(),
      };
    });

    // Update session
    session.answers = processedAnswers;
    // For mock tests, use totalMarks; for others, use correctCount
    session.score = session.testType === 'mocktest' ? totalMarks : correctCount;
    session.status = 'completed';
    session.completedAt = new Date();
    session.duration = Math.floor((session.completedAt - session.startedAt) / 1000);

    await session.save();

    // Prepare detailed results with questions and answers
    const detailedResults = session.questions.map((questionId) => {
      const questionIdStr = questionId ? questionId.toString() : null;
      const question = questionIdStr ? questionMap.get(questionIdStr) : null;
      const answer = processedAnswers.find((a) => {
        const aIdStr = a.questionId ? a.questionId.toString() : null;
        return aIdStr === questionIdStr;
      });
      
      return {
        questionId: questionId,
        question: question?.question || '',
        options: question?.options || [],
        correctAnswer: question?.correctanswrs || '',
        selectedOption: answer?.selectedOption || '',
        isCorrect: answer?.isCorrect || false,
        subject: question?.subject || question?.sub || session.subject,
        chapter: question?.chapter || session.chapter,
        year: question?.year || session.year,
      };
    });

    // For mock tests, use totalMarks (session.score), for others use correctCount
    const finalScore = session.testType === 'mocktest' ? session.score : correctCount;
    const wrongCount = session.testType === 'mocktest' 
      ? session.totalQuestions - correctCount // Still count wrong answers for mock tests
      : session.totalQuestions - correctCount;
    
    res.status(200).json({
      success: true,
      data: {
        sessionId: session._id,
        score: finalScore, // Use session.score for mock tests (totalMarks), correctCount for others
        total: session.totalQuestions,
        wrongCount: wrongCount,
        accuracy: session.totalQuestions > 0 ? (correctCount / session.totalQuestions * 100).toFixed(2) : 0,
        duration: session.duration,
        testType: session.testType,
        subject: session.subject,
        chapter: session.chapter,
        year: session.year,
        shift: session.shift,
        completedAt: session.completedAt,
        results: detailedResults,
      },
    });
  } catch (error) {
    console.error('Error submitting test session:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return next(createError(500, error.message || 'Failed to submit test session'));
  }
};

/**
 * Get user's test sessions
 * GET /api/mcq/tests/sessions
 */
const getUserTestSessions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { testType, status } = req.query;

    const filter = { user: userId };
    if (testType) filter.testType = testType;
    if (status) filter.status = status;

    const sessions = await TestSession.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('Error getting user test sessions:', error);
    return next(createError(500, 'Failed to fetch test sessions'));
  }
};

/**
 * Get detailed test report by session ID
 * GET /api/mcq/tests/reports/:sessionId
 */
const getTestReport = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;

    const session = await TestSession.findOne({
      _id: sessionId,
      user: userId,
      status: 'completed',
    }).lean();

    if (!session) {
      return next(createError(404, 'Test report not found'));
    }

    // Get questions to include in report
    const { getAllModels, getModelBySubject } = require('../models/Mcq');
    const allModels = getAllModels();
    const allQuestions = [];
    
    // For mock tests, query from MockTest collection
    if (session.testType === 'mocktest') {
      try {
        const mockQuestions = await MockTestModel.find({ _id: { $in: session.questions } }).lean();
        allQuestions.push(...mockQuestions);
        console.log(`Found ${mockQuestions.length} mock test questions for report`);
      } catch (error) {
        console.error('Error querying MockTest collection:', error);
      }
    } else {
      for (const [subject, Model] of Object.entries(allModels)) {
        try {
          const questions = await Model.find({ _id: { $in: session.questions } }).lean();
          allQuestions.push(...questions);
        } catch (error) {
          console.error(`Error querying ${subject}:`, error);
        }
      }
    }
    
    const questionMap = new Map(allQuestions.map((q) => [q._id.toString(), q]));
    console.log(`Total questions in map: ${questionMap.size}, Session questions: ${session.questions.length}`);

    // Prepare detailed results - ensure we have data for all questions
    const detailedResults = session.questions.map((questionId) => {
      const questionIdStr = questionId ? questionId.toString() : null;
      const question = questionIdStr ? questionMap.get(questionIdStr) : null;
      
      // Find matching answer - handle both ObjectId and string comparisons
      const answer = session.answers.find((a) => {
        if (!a.questionId) return false;
        const aIdStr = a.questionId.toString();
        return aIdStr === questionIdStr;
      });
      
      if (!question) {
        console.warn(`Question not found for ID: ${questionIdStr}`);
      }
      
      return {
        questionId: questionIdStr || questionId,
        question: question?.question || 'Question not found',
        options: question?.options || [],
        correctAnswer: question?.correctanswrs || '',
        selectedOption: answer?.selectedOption || '',
        isCorrect: answer?.isCorrect || false,
        subject: question?.subject || question?.sub || session.subject || '',
        chapter: question?.chapter || session.chapter || '',
        year: question?.year || session.year || '',
      };
    });

    // Calculate correct count for accuracy (for mock tests, score is marks, not count)
    const correctCount = session.answers.filter((a) => a.isCorrect).length;
    const wrongCount = session.totalQuestions - correctCount;
    const accuracy = session.totalQuestions > 0 
      ? ((correctCount / session.totalQuestions) * 100).toFixed(2) 
      : '0.00';

    res.status(200).json({
      success: true,
      data: {
        sessionId: session._id,
        score: session.score, // For mock tests this is total marks, for others it's correct count
        total: session.totalQuestions,
        wrongCount: wrongCount,
        accuracy: accuracy,
        duration: session.duration,
        testType: session.testType,
        subject: session.subject,
        chapter: session.chapter,
        year: session.year,
        shift: session.shift,
        mockTestNumber: session.mockTestNumber,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        results: detailedResults,
      },
    });
  } catch (error) {
    console.error('Error getting test report:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return next(createError(500, error.message || 'Failed to fetch test report'));
  }
};

/**
 * Get test reports by chapter/subject/year
 * GET /api/mcq/tests/reports
 */
const getTestReports = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { subject, chapter, year, testType } = req.query;

    const filter = { 
      user: userId,
      status: 'completed',
    };
    
    if (subject) filter.subject = subject;
    if (chapter) filter.chapter = chapter;
    if (year) filter.year = year;
    if (testType) filter.testType = testType;

    const sessions = await TestSession.find(filter)
      .sort({ completedAt: -1 })
      .limit(100)
      .select('_id score totalQuestions duration testType subject chapter year shift completedAt createdAt')
      .lean();

    res.status(200).json({
      success: true,
      data: sessions.map((session) => ({
        sessionId: session._id,
        score: session.score,
        total: session.totalQuestions,
        wrongCount: session.totalQuestions - session.score,
        accuracy: session.totalQuestions > 0 ? (session.score / session.totalQuestions * 100).toFixed(2) : 0,
        duration: session.duration,
        testType: session.testType,
        subject: session.subject,
        chapter: session.chapter,
        year: session.year,
        shift: session.shift,
        completedAt: session.completedAt,
        createdAt: session.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error getting test reports:', error);
    return next(createError(500, 'Failed to fetch test reports'));
  }
};

/**
 * Get recent activity (last 3 test sessions)
 * GET /api/mcq/tests/recent-activity
 */
const getRecentActivity = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const sessions = await TestSession.find({
      user: userId,
      status: 'completed',
    })
      .sort({ completedAt: -1 })
      .limit(3)
      .select('_id score totalQuestions testType subject chapter year completedAt')
      .lean();

    const SUBJECT_ICONS = {
      Chemistry: '🧪',
      Physics: '⚛️',
      Maths: '📐',
      Biology: '🧬',
    };

    const formatTimeAgo = (date) => {
      const now = new Date();
      const diffMs = now - new Date(date);
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) {
        return `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return new Date(date).toLocaleDateString();
      }
    };

    const getTestTitle = (session) => {
      if (session.testType === 'pyq') {
        return `${session.subject || 'MHT CET'} ${session.year || ''} ${session.shift ? `Shift ${session.shift}` : ''}`.trim();
      } else if (session.testType === 'chapter') {
        return `${session.subject || ''} ${session.chapter || 'Practice'}`.trim();
      } else if (session.testType === 'mocktest') {
        return `MockTest ${session.mockTestNumber || ''}`.trim();
      } else {
        return `${session.subject || ''} Mock Test`.trim();
      }
    };

    const activities = sessions.map((session) => ({
      id: session._id.toString(),
      title: getTestTitle(session),
      score: `${session.score}/${session.totalQuestions}`,
      time: formatTimeAgo(session.completedAt),
      icon: SUBJECT_ICONS[session.subject] || '📝',
      subject: session.subject,
      testType: session.testType,
    }));

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return next(createError(500, 'Failed to fetch recent activity'));
  }
};

/**
 * Get available mock tests
 * GET /api/mcq/mock-tests
 */
const getAvailableMockTests = async (req, res, next) => {
  try {
    console.log('getAvailableMockTests called', {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      path: req.path,
    });
    // Get distinct MockTest values from MockTest collection
    const distinctMockTests = await MockTestModel.distinct('MockTest');
    console.log('Found MockTest values:', distinctMockTests);
    
    // Also check sourceFile as fallback
    const distinctSourceFiles = await MockTestModel.distinct('sourceFile');
    console.log('Found sourceFile values:', distinctSourceFiles);
    
    const mockTests = [];
    const mockTestPattern = /^MockTest\s*(\d+)$/i;
    
    // Process MockTest field first
    for (const mocktestValue of distinctMockTests) {
      if (mocktestValue) {
        const match = String(mocktestValue).match(mockTestPattern);
        if (match) {
          const mockTestNumber = parseInt(match[1], 10);
          
          // Count questions for this mock test using MockTest field
          const questionCount = await MockTestModel.countDocuments({ MockTest: mocktestValue });
          
          // Count by subject (using 'subject' field from database)
          const physicsCount = await MockTestModel.countDocuments({ 
            MockTest: mocktestValue, 
            subject: 'Physics' 
          });
          const chemistryCount = await MockTestModel.countDocuments({ 
            MockTest: mocktestValue, 
            subject: 'Chemistry' 
          });
          const mathsCount = await MockTestModel.countDocuments({ 
            MockTest: mocktestValue, 
            $or: [
              { subject: 'Mathematics' },
              { subject: 'Maths' }
            ]
          });
          
          mockTests.push({
            mockTestNumber,
            name: `MockTest ${mockTestNumber}`,
            sourceFile: mocktestValue, // Keep for compatibility
            questionCount,
            physicsCount,
            chemistryCount,
            mathsCount,
          });
        }
      }
    }
    
    // Fallback: Process sourceFile if no Mocktest values found
    if (mockTests.length === 0) {
      const sourceFilePattern = /^mock(\d+)\.json$/i;
      for (const sourceFile of distinctSourceFiles) {
        if (sourceFile) {
          const match = sourceFile.match(sourceFilePattern);
          if (match) {
            const mockTestNumber = parseInt(match[1], 10);
            
            // Count questions for this mock test
            const questionCount = await MockTestModel.countDocuments({ sourceFile });
            
            // Count by subject (using 'subject' field from database)
            const physicsCount = await MockTestModel.countDocuments({ 
              sourceFile, 
              subject: 'Physics' 
            });
            const chemistryCount = await MockTestModel.countDocuments({ 
              sourceFile, 
              subject: 'Chemistry' 
            });
            const mathsCount = await MockTestModel.countDocuments({ 
              sourceFile, 
              $or: [
                { subject: 'Mathematics' },
                { subject: 'Maths' }
              ]
            });
            
            mockTests.push({
              mockTestNumber,
              name: `MockTest ${mockTestNumber}`,
              sourceFile,
              questionCount,
              physicsCount,
              chemistryCount,
              mathsCount,
            });
          }
        }
      }
    }
    
    // Sort by mock test number
    mockTests.sort((a, b) => a.mockTestNumber - b.mockTestNumber);
    
    res.status(200).json({
      success: true,
      data: mockTests,
    });
  } catch (error) {
    console.error('Error getting available mock tests:', error);
    return next(createError(500, 'Failed to fetch available mock tests'));
  }
};

/**
 * Get questions for a specific mock test
 * GET /api/mcq/mock-tests/:mockTestNumber/questions
 */
const getMockTestQuestions = async (req, res, next) => {
  try {
    const { mockTestNumber } = req.params;
    const mocktestValue = `MockTest${mockTestNumber}`;
    const sourceFile = `mock${mockTestNumber}.json`;
    
    // Try to get questions using MockTest field first, fallback to sourceFile
    let allQuestions = await MockTestModel.find({ MockTest: mocktestValue }).lean();
    
    if (allQuestions.length === 0) {
      // Fallback to sourceFile
      allQuestions = await MockTestModel.find({ sourceFile }).lean();
    }
    
    if (allQuestions.length === 0) {
      return next(createError(404, `Mock test ${mockTestNumber} not found`));
    }
    
    // Separate questions by subject (using 'subject' field from database)
    // Section 1: Physics and Chemistry (ALL Physics first, then ALL Chemistry)
    // Section 2: Mathematics
    const physicsQuestions = allQuestions
      .filter((q) => q.subject === 'Physics')
      .sort((a, b) => a._id.toString().localeCompare(b._id.toString())); // Sort by _id for consistent order
    const chemistryQuestions = allQuestions
      .filter((q) => q.subject === 'Chemistry')
      .sort((a, b) => a._id.toString().localeCompare(b._id.toString())); // Sort by _id for consistent order
    const mathsQuestions = allQuestions
      .filter((q) => q.subject === 'Mathematics' || q.subject === 'Maths')
      .sort((a, b) => a._id.toString().localeCompare(b._id.toString())); // Sort by _id for consistent order
    
    // Sort questions: Section 1 (ALL Physics first, then ALL Chemistry), then Section 2 (ALL Mathematics)
    const questions = [...physicsQuestions, ...chemistryQuestions, ...mathsQuestions];
    
    // Return question IDs in order
    const questionIds = questions.map((q) => q._id);
    
    res.status(200).json({
      success: true,
      data: {
        questions: questionIds,
        questionDetails: questions.map((q) => ({
          _id: q._id,
          subject: q.subject || q.sub, // Use 'subject' field, fallback to 'sub' for compatibility
        })),
      },
    });
  } catch (error) {
    console.error('Error getting mock test questions:', error);
    return next(createError(500, 'Failed to fetch mock test questions'));
  }
};

/**
 * Start a mock test session
 * POST /api/mcq/mock-tests/:mockTestNumber/start
 */
const startMockTestSession = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { mockTestNumber } = req.params;
    const mocktestValue = `MockTest${mockTestNumber}`;
    const sourceFile = `mock${mockTestNumber}.json`;
    
    // Try to get questions using MockTest field first, fallback to sourceFile
    let allQuestions = await MockTestModel.find({ MockTest: mocktestValue }).lean();
    
    if (allQuestions.length === 0) {
      // Fallback to sourceFile
      allQuestions = await MockTestModel.find({ sourceFile }).lean();
    }
    
    if (allQuestions.length === 0) {
      return next(createError(404, `Mock test ${mockTestNumber} not found`));
    }
    
    // Separate questions by subject (using 'subject' field from database)
    // Section 1: Physics and Chemistry (ALL Physics first, then ALL Chemistry)
    // Section 2: Mathematics
    const physicsQuestions = allQuestions
      .filter((q) => q.subject === 'Physics')
      .sort((a, b) => a._id.toString().localeCompare(b._id.toString())); // Sort by _id for consistent order
    const chemistryQuestions = allQuestions
      .filter((q) => q.subject === 'Chemistry')
      .sort((a, b) => a._id.toString().localeCompare(b._id.toString())); // Sort by _id for consistent order
    const mathsQuestions = allQuestions
      .filter((q) => q.subject === 'Mathematics' || q.subject === 'Maths')
      .sort((a, b) => a._id.toString().localeCompare(b._id.toString())); // Sort by _id for consistent order
    
    // Sort questions: Section 1 (ALL Physics first, then ALL Chemistry), then Section 2 (ALL Mathematics)
    const questions = [...physicsQuestions, ...chemistryQuestions, ...mathsQuestions];
    
    // Verify structure
    const physicsCount = physicsQuestions.length;
    const chemistryCount = chemistryQuestions.length;
    const mathsCount = mathsQuestions.length;
    
    if (physicsCount === 0 && chemistryCount === 0 && mathsCount === 0) {
      console.warn(`Mock test ${mockTestNumber} has no questions with valid 'subject' field. Found ${allQuestions.length} total questions.`);
    } else {
      console.log(`Mock test ${mockTestNumber} question distribution: Physics=${physicsCount}, Chemistry=${chemistryCount}, Mathematics=${mathsCount}`);
    }
    
    const questionIds = questions.map((q) => q._id);
    
    // Check for existing in-progress session
    const existingSession = await TestSession.findOne({
      user: userId,
      testType: 'mocktest',
      mockTestNumber: parseInt(mockTestNumber, 10),
      status: 'in-progress',
    });
    
    if (existingSession) {
      return res.status(200).json({
        success: true,
        data: {
          sessionId: existingSession._id,
          questions: questionIds,
          testType: 'mocktest',
          mockTestNumber: parseInt(mockTestNumber, 10),
        },
      });
    }
    
    // Create new test session
    const session = new TestSession({
      user: userId,
      testType: 'mocktest',
      mockTestNumber: parseInt(mockTestNumber, 10),
      questions: questionIds,
      questionModel: 'MockTest',
      totalQuestions: questionIds.length,
      status: 'in-progress',
      startedAt: new Date(),
      currentSection: 1, // Keep for backward compatibility
      // Note: section timing removed - using single 3-hour timer
    });
    
    await session.save();
    
    res.status(201).json({
      success: true,
      data: {
        sessionId: session._id,
        questions: questionIds,
        testType: 'mocktest',
        mockTestNumber: parseInt(mockTestNumber, 10),
      },
    });
  } catch (error) {
    console.error('Error starting mock test session:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return next(createError(500, error.message || 'Failed to start mock test session'));
  }
};

/**
 * Get mock test results by mockTestNumber
 * GET /api/mcq/mock-tests/:mockTestNumber/results
 */
const getMockTestResults = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { mockTestNumber } = req.params;

    // Find completed test sessions for this mock test
    const sessions = await TestSession.find({
      user: userId,
      testType: 'mocktest',
      mockTestNumber: parseInt(mockTestNumber, 10),
      status: 'completed',
    })
      .sort({ completedAt: -1 })
      .limit(1) // Get the most recent result
      .select('_id score totalQuestions duration completedAt')
      .lean();

    if (sessions.length === 0) {
      return res.status(200).json({
        success: true,
        data: null, // No results found
      });
    }

    const session = sessions[0];
    
    // Calculate marks (for mock tests, score is already total marks)
    const marks = session.score || 0;
    const totalQuestions = session.totalQuestions || 0;

    res.status(200).json({
      success: true,
      data: {
        mockTestNumber: parseInt(mockTestNumber, 10),
        marks,
        totalQuestions,
        correctCount: Math.round(marks), // Approximate correct count (marks might be fractional)
        completedAt: session.completedAt,
        sessionId: session._id,
      },
    });
  } catch (error) {
    console.error('Error getting mock test results:', error);
    return next(createError(500, error.message || 'Failed to fetch mock test results'));
  }
};

module.exports = {
  getAvailableTests,
  getDistinctYears,
  generateRandomTest,
  startTestSession,
  submitTestSession,
  getUserTestSessions,
  getTestReport,
  getTestReports,
  getRecentActivity,
  getAvailableMockTests,
  getMockTestQuestions,
  startMockTestSession,
  getMockTestResults,
};
