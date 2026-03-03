const mongoose = require('mongoose');

const classStudentSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: false,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isActivated: {
      type: Boolean,
      default: false,
    },
    activatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'class_students',
  }
);

classStudentSchema.index({ class: 1, phoneNumber: 1 }, { unique: true });

module.exports = mongoose.model('ClassStudent', classStudentSchema, 'class_students');

