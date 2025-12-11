const createError = require('http-errors');
const ExamConfig = require('../models/ExamConfig');

/**
 * Get exam configuration
 * GET /api/mcq/config
 */
const getExamConfig = async (req, res, next) => {
  try {
    let config = await ExamConfig.findOne({ isActive: true });

    // If no config exists, create a default one
    if (!config) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth(); // 0-11
      const currentDate = new Date().getDate();
      
      // Determine target year: if we're past Feb 13, target next year; otherwise current year
      let targetYear = currentYear;
      if (currentMonth > 1 || (currentMonth === 1 && currentDate > 13)) {
        targetYear = currentYear + 1;
      }
      
      config = new ExamConfig({
        examName: 'MHT CET',
        targetYear: targetYear.toString(),
        examDate: new Date(targetYear, 1, 13), // Feb 13 (month is 0-indexed, so 1 = February)
        isActive: true,
      });
      await config.save();
    }

    // Calculate days until exam
    const now = new Date();
    const examDate = new Date(config.examDate);
    const daysUntilExam = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));

    res.status(200).json({
      success: true,
      data: {
        examName: config.examName,
        targetYear: config.targetYear,
        examDate: config.examDate,
        daysUntilExam: Math.max(0, daysUntilExam),
      },
    });
  } catch (error) {
    console.error('Error getting exam config:', error);
    return next(createError(500, 'Failed to fetch exam configuration'));
  }
};

/**
 * Update exam configuration (admin only - for future use)
 * PUT /api/mcq/config
 */
const updateExamConfig = async (req, res, next) => {
  try {
    // Check if user is admin (for future implementation)
    // if (req.user.role !== 'admin') {
    //   return next(createError(403, 'Admin access required'));
    // }

    const { examName, targetYear, examDate } = req.body;

    let config = await ExamConfig.findOne({ isActive: true });

    if (!config) {
      config = new ExamConfig({ isActive: true });
    }

    if (examName) config.examName = examName;
    if (targetYear) config.targetYear = targetYear;
    if (examDate) config.examDate = new Date(examDate);

    await config.save();

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error updating exam config:', error);
    return next(createError(500, 'Failed to update exam configuration'));
  }
};

module.exports = {
  getExamConfig,
  updateExamConfig,
};




