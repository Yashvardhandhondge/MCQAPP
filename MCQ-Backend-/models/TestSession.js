const mongoose = require('mongoose');

const testSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    testType: {
      type: String,
      enum: ['pyq', 'practice', 'chapter'],
      required: true,
    },
    year: {
      type: String,
      trim: true,
    },
    shift: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      enum: ['Chemistry', 'Physics', 'Maths', 'Biology'],
      trim: true,
    },
    chapter: {
      type: String,
      trim: true,
    },
    questions: [{
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'questionModel',
    }],
    questionModel: {
      type: String,
      enum: ['Chemistry', 'Physics', 'Maths', 'Biology'],
    },
    answers: [{
      questionId: mongoose.Schema.Types.ObjectId,
      selectedOption: String,
      isCorrect: Boolean,
      answeredAt: Date,
    }],
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'abandoned'],
      default: 'in-progress',
    },
    score: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
testSessionSchema.index({ user: 1, status: 1 });
testSessionSchema.index({ user: 1, testType: 1, year: 1, shift: 1 });
testSessionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('TestSession', testSessionSchema);




