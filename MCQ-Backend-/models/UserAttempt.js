const mongoose = require('mongoose');

const userAttemptSchema = new mongoose.Schema(
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
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      enum: ['Chemistry', 'Physics', 'Maths', 'Biology'],
      trim: true,
    },
    chapter: {
      type: String,
      required: [true, 'Chapter is required'],
      trim: true,
    },
    year: {
      type: String,
      trim: true,
    },
    selectedOption: {
      type: String,
      required: [true, 'Selected option is required'],
      trim: true,
    },
    isCorrect: {
      type: Boolean,
      required: [true, 'Correctness status is required'],
    },
    answeredAt: {
      type: Date,
      default: Date.now,
    },
    sourceFile: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient stats queries
userAttemptSchema.index({ user: 1, subject: 1, chapter: 1 });

// Index for user-specific queries (chronological order)
userAttemptSchema.index({ user: 1, answeredAt: -1 });

// Index for user stats queries (isCorrect filtering)
userAttemptSchema.index({ user: 1, isCorrect: 1 });

// Index for leaderboard queries (date-based filtering)
userAttemptSchema.index({ answeredAt: -1, isCorrect: 1 });

// Index for subject-based queries
userAttemptSchema.index({ subject: 1, isCorrect: 1 });

// Prevent duplicate attempts for the same question by the same user
// (Optional: remove this if you want to allow multiple attempts)
userAttemptSchema.index({ user: 1, question: 1 }, { unique: true });

module.exports = mongoose.model('UserAttempt', userAttemptSchema);