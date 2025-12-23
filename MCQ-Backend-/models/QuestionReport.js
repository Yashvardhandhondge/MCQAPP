const mongoose = require('mongoose');

const questionReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Question ID is required'],
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      enum: ['Chemistry', 'Physics', 'Maths', 'Biology'],
      trim: true,
      index: true,
    },
    chapter: {
      type: String,
      required: [true, 'Chapter is required'],
      trim: true,
      index: true,
    },
    reportType: {
      type: String,
      required: [true, 'Report type is required'],
      enum: ['wrong-question', 'wrong-options', 'invalid-question'],
      trim: true,
    },
    details: {
      type: String,
      required: [true, 'Report details are required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    adminNotes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
questionReportSchema.index({ subject: 1, chapter: 1, status: 1 });
questionReportSchema.index({ questionId: 1, status: 1 });
questionReportSchema.index({ status: 1, createdAt: -1 });

const QuestionReport = mongoose.model('QuestionReport', questionReportSchema);

module.exports = QuestionReport;








