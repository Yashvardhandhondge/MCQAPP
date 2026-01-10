const mongoose = require('mongoose');

const appVersionSchema = new mongoose.Schema(
  {
    requiredVersion: {
      type: String,
      required: true,
      trim: true,
    },
    requiredVersionCode: {
      type: Number,
      required: true,
      default: 1,
    },
    updateMessage: {
      type: String,
      default: 'A new version of the app is available. Please update to continue.',
      trim: true,
    },
    isUpdateRequired: {
      type: Boolean,
      default: false,
    },
    playStoreUrl: {
      type: String,
      default: '',
      trim: true,
    },
    updateUrl: {
      type: String,
      default: '',
      trim: true,
      // Can be APK download URL or OTA update endpoint
    },
  },
  {
    timestamps: true,
  }
);

// Note: Only one version config should exist at a time
// The controller handles ensuring only one document exists

module.exports = mongoose.model('AppVersion', appVersionSchema);
