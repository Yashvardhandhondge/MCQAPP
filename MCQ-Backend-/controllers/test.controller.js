const createError = require('http-errors');
const { getAllModels, getModelBySubject } = require('../models/Mcq');
const TestSession = require('../models/TestSession');
const UserAttempt = require('../models/UserAttempt');

/**
 * Helper function to check if a chapter is locked for a non-premium user
 * Non-premium users can only access the first 3 chapters (index 0-2) of each subject
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

  // Get all chapters for the subject, sorted alphabetically
  const allChapters = await Model.distinct('chapter');
  const sortedChapters = allChapters.sort((a, b) => a.localeCompare(b));

  // Find the index of the requested chapter
  const chapterIndex = sortedChapters.findIndex((ch) => ch === chapter);

  // If chapter not found, consider it locked (shouldn't happen, but safety check)
  if (chapterIndex === -1) {
    return true;
  }

  // Non-premium users can only access first 3 chapters (index 0, 1, 2)
  return chapterIndex >= 3;
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
    const count = Math.max(10, Math.min(50, parseInt(questionCount) || 25));

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

    // Get questions to verify answers - handle multiple subjects for random tests
    const { getAllModels, getModelBySubject } = require('../models/Mcq');
    const allModels = getAllModels();
    const allQuestions = [];
    
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
    
    const questionMap = new Map(allQuestions.map((q) => [q._id.toString(), q]));

    // Process answers and calculate score
    let correctCount = 0;
    const processedAnswers = answers.map((ans) => {
      const question = questionMap.get(ans.questionId.toString());
      const isCorrect = question && ans.selectedOption.trim() === question.correctanswrs.trim();
      if (isCorrect) correctCount++;
      
      return {
        questionId: ans.questionId,
        selectedOption: ans.selectedOption,
        isCorrect,
        answeredAt: new Date(),
      };
    });

    // Update session
    session.answers = processedAnswers;
    session.score = correctCount;
    session.status = 'completed';
    session.completedAt = new Date();
    session.duration = Math.floor((session.completedAt - session.startedAt) / 1000);

    await session.save();

    // Prepare detailed results with questions and answers
    const detailedResults = session.questions.map((questionId) => {
      const question = questionMap.get(questionId.toString());
      const answer = processedAnswers.find((a) => a.questionId.toString() === questionId.toString());
      
      return {
        questionId: questionId,
        question: question?.question || '',
        options: question?.options || [],
        correctAnswer: question?.correctanswrs || '',
        selectedOption: answer?.selectedOption || '',
        isCorrect: answer?.isCorrect || false,
        subject: question?.subject || session.subject,
        chapter: question?.chapter || session.chapter,
        year: question?.year || session.year,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        sessionId: session._id,
        score: correctCount,
        total: session.totalQuestions,
        wrongCount: session.totalQuestions - correctCount,
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
    return next(createError(500, 'Failed to submit test session'));
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
    
    for (const [subject, Model] of Object.entries(allModels)) {
      try {
        const questions = await Model.find({ _id: { $in: session.questions } }).lean();
        allQuestions.push(...questions);
      } catch (error) {
        console.error(`Error querying ${subject}:`, error);
      }
    }
    
    const questionMap = new Map(allQuestions.map((q) => [q._id.toString(), q]));

    // Prepare detailed results
    const detailedResults = session.questions.map((questionId) => {
      const question = questionMap.get(questionId.toString());
      const answer = session.answers.find((a) => a.questionId.toString() === questionId.toString());
      
      return {
        questionId: questionId,
        question: question?.question || '',
        options: question?.options || [],
        correctAnswer: question?.correctanswrs || '',
        selectedOption: answer?.selectedOption || '',
        isCorrect: answer?.isCorrect || false,
        subject: question?.subject || session.subject,
        chapter: question?.chapter || session.chapter,
        year: question?.year || session.year,
      };
    });

    res.status(200).json({
      success: true,
      data: {
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
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        results: detailedResults,
      },
    });
  } catch (error) {
    console.error('Error getting test report:', error);
    return next(createError(500, 'Failed to fetch test report'));
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

module.exports = {
  getAvailableTests,
  getDistinctYears,
  generateRandomTest,
  startTestSession,
  submitTestSession,
  getUserTestSessions,
  getTestReport,
  getTestReports,
};
