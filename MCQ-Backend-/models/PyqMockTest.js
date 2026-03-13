const mongoose = require('mongoose');

const PyqMockTestQuestionSchema = new mongoose.Schema(
  {
    Title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
    },
    options: {
      type: [String],
      required: [true, 'Options are required'],
      validate: {
        validator: function (options) {
          return Array.isArray(options) && options.length > 0;
        },
        message: 'At least one option is required',
      },
    },
    // Stored in DB as "correctAnswer" but we want to be able to
    // reuse existing logic that expects "correctanswrs" on the document.
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer is required'],
      trim: true,
      alias: 'correctanswrs',
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      enum: ['Chemistry', 'Physics', 'Maths', 'Biology'],
      trim: true,
    },
    chapter: {
      type: String,
      trim: true,
    },
    year: {
      // Some imports may use number, some string – allow both
      type: mongoose.Schema.Types.Mixed,
    },
    // Optional image flag – keep for completeness (yes/true = question has an image slot)
    AddImage: {
      type: String,
      alias: 'Add image',
    },
    // Legacy single-question image URL (Cloudinary) – kept for backward compatibility
    image: {
      type: String,
      trim: true,
    },
    // New: multiple question images (e.g. statement diagrams above/below text)
    questionImages: {
      type: [String],
      default: [],
    },
    // New: per-option images, index-aligned with `options` array (A,B,C,D...)
    optionImages: {
      type: [String],
      default: [],
    },
    // Set when this question has been added to chapter-based PYQ (admin feed-to-chapter)
    fedToChapter: {
      type: Boolean,
      default: false,
    },
    fedToChapterAt: {
      type: Date,
    },
    fedToChapterBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    collection: 'PYQ Mocktests',
  }
);

// Indexes for faster queries
PyqMockTestQuestionSchema.index({ Title: 1 });
PyqMockTestQuestionSchema.index({ year: 1 });
PyqMockTestQuestionSchema.index({ subject: 1 });
PyqMockTestQuestionSchema.index({ Title: 1, year: 1 });

const PyqMockTestModel = mongoose.model('PyqMockTest', PyqMockTestQuestionSchema, 'PYQ Mocktests');

module.exports = PyqMockTestModel;

