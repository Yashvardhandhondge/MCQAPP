const mongoose = require('mongoose');

const dailyQuestionViewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Question ID is required'],
      index: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD for easy daily queries
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient daily count queries
dailyQuestionViewSchema.index({ user: 1, date: 1 });

// Prevent duplicate views for the same question by the same user on the same day
dailyQuestionViewSchema.index({ user: 1, question: 1, date: 1 }, { unique: true });

// Method to get today's date string
dailyQuestionViewSchema.statics.getTodayDateString = function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

module.exports = mongoose.model('DailyQuestionView', dailyQuestionViewSchema);

