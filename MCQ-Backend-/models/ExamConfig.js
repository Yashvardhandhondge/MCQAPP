const mongoose = require('mongoose');

const examConfigSchema = new mongoose.Schema(
  {
    examName: {
      type: String,
      default: 'MHT CET',
      trim: true,
    },
    targetYear: {
      type: String,
      required: true,
      trim: true,
    },
    examDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Only one active config at a time
examConfigSchema.index({ isActive: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('ExamConfig', examConfigSchema);




