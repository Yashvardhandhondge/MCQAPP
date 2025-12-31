const mongoose = require('mongoose');

const MockTestQuestionSchema = new mongoose.Schema(
  {
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
          return options && options.length > 0;
        },
        message: 'At least one option is required',
      },
    },
    correctanswrs: {
      type: String,
      required: [true, 'Correct answer is required'],
      trim: true,
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
      type: String,
      trim: true,
    },
    sourceFile: {
      type: String,
      trim: true,
      required: [true, 'Source file is required'],
    },
    MockTest: {
      type: String,
      trim: true,
    },
    solution: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'MockTest', // Use MockTest collection
  }
);

// Create indexes for better query performance
MockTestQuestionSchema.index({ sourceFile: 1 });
MockTestQuestionSchema.index({ subject: 1 });
MockTestQuestionSchema.index({ MockTest: 1 });
MockTestQuestionSchema.index({ sourceFile: 1, subject: 1 });
MockTestQuestionSchema.index({ MockTest: 1, subject: 1 });

// Create model for MockTest collection
const MockTestModel = mongoose.model('MockTest', MockTestQuestionSchema, 'MockTest');

module.exports = MockTestModel;

