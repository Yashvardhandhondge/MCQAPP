const mongoose = require('mongoose');

const McqQuestionSchema = new mongoose.Schema(
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
      required: [true, 'Chapter is required'],
      trim: true,
    },
    year: {
      type: String,
      required: [true, 'Year is required'],
      trim: true,
    },
    sourceFile: {
      type: String,
      trim: true,
    },
    solution: {
      type: String,
      trim: true,
    },
    // PYQ migrated from PYQ Mocktests: paper/shift title (e.g. "19th April (Shift - I)")
    shift: {
      type: String,
      trim: true,
    },
    // Legacy single-question image URL (for future use; migrated from PYQ AddImage)
    addImage: {
      type: String,
      trim: true,
    },
    // New: multiple question images (mirrors PYQ questionImages)
    questionImages: {
      type: [String],
      default: [],
    },
    // New: per-option images, index-aligned with `options`
    optionImages: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: function() {
      return this.subject; // This will make it use subject-specific collections
    },
  }
);

// Create indexes for better query performance
McqQuestionSchema.index({ subject: 1 });
McqQuestionSchema.index({ subject: 1, chapter: 1 });
McqQuestionSchema.index({ subject: 1, chapter: 1, year: 1 });

// Create models for each subject collection
const ChemistryModel = mongoose.model('Chemistry', McqQuestionSchema, 'Chemistry');
const PhysicsModel = mongoose.model('Physics', McqQuestionSchema, 'Physics');
const MathsModel = mongoose.model('Maths', McqQuestionSchema, 'Maths');
const BiologyModel = mongoose.model('Biology', McqQuestionSchema, 'Biology');

// Helper function to get the correct model based on subject
const getModelBySubject = (subject) => {
  switch (subject) {
    case 'Chemistry':
      return ChemistryModel;
    case 'Physics':
      return PhysicsModel;
    case 'Maths':
      return MathsModel;
    case 'Biology':
      return BiologyModel;
    default:
      throw new Error(`Invalid subject: ${subject}`);
  }
};

// Helper function to get all models
const getAllModels = () => ({
  Chemistry: ChemistryModel,
  Physics: PhysicsModel,
  Maths: MathsModel,
  Biology: BiologyModel,
});

module.exports = {
  McqQuestionSchema,
  ChemistryModel,
  PhysicsModel,
  MathsModel,
  BiologyModel,
  getModelBySubject,
  getAllModels,
};