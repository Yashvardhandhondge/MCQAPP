const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      index: true,
    },
    otp: {
      type: String,
      required: true, // This will store the hashed OTP
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
      expires: 0, // TTL index - documents will be deleted after expiresAt
    },
    attempts: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'otps',
  }
);

// Compound index for faster lookups
otpSchema.index({ phoneNumber: 1, expiresAt: 1 });

// TTL index to auto-delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema, 'otps');

