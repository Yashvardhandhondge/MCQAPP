const mongoose = require('mongoose');

const appUpdateInitiationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    requiredVersion: {
      type: String,
      required: true,
      trim: true,
    },
    requiredVersionCode: {
      type: Number,
      required: true,
    },
    currentVersion: {
      type: String,
      required: true,
      trim: true,
    },
    currentVersionCode: {
      type: Number,
    },
    updateUrl: {
      type: String,
      trim: true,
    },
    playStoreUrl: {
      type: String,
      trim: true,
    },
    downloadStatus: {
      type: String,
      enum: ['initiated', 'downloading', 'downloaded', 'failed', 'installed'],
      default: 'initiated',
      index: true,
    },
    downloadedAt: {
      type: Date,
    },
    installedAt: {
      type: Date,
    },
    deviceInfo: {
      platform: String,
      osVersion: String,
      deviceModel: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
appUpdateInitiationSchema.index({ user: 1, requiredVersion: 1 });
appUpdateInitiationSchema.index({ user: 1, downloadStatus: 1 });
appUpdateInitiationSchema.index({ downloadStatus: 1, createdAt: -1 });

module.exports = mongoose.model('AppUpdateInitiation', appUpdateInitiationSchema);
