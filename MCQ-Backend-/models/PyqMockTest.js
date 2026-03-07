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
    // Uploaded image URL (Cloudinary) – set when admin adds image for this question
    image: {
      type: String,
      trim: true,
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

