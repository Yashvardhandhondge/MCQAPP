const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  // Generate random number between 100000 and 999999
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hash OTP using bcrypt before storing in database
 * @param {string} otp - Plain text OTP
 * @returns {Promise<string>} Hashed OTP
 */
const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

/**
 * Verify OTP by comparing plain text with hashed version
 * @param {string} hashedOtp - Hashed OTP from database
 * @param {string} plainOtp - Plain text OTP from user
 * @returns {Promise<boolean>} True if OTP matches
 */
const verifyOTP = async (hashedOtp, plainOtp) => {
  return bcrypt.compare(plainOtp, hashedOtp);
};

/**
 * Calculate OTP expiry time (default 5 minutes)
 * @param {number} minutes - Minutes until expiry (default: 5)
 * @returns {Date} Expiry date
 */
const getOTPExpiry = (minutes = 5) => {
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || minutes;
  return new Date(Date.now() + expiryMinutes * 60 * 1000);
};

/**
 * Cleanup expired OTPs (can be called periodically)
 * Note: TTL index should handle this automatically, but this is a manual cleanup option
 * @param {Object} OtpModel - Mongoose OTP model
 * @returns {Promise<number>} Number of deleted OTPs
 */
const cleanupExpiredOTPs = async (OtpModel) => {
  try {
    const result = await OtpModel.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
    return 0;
  }
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  getOTPExpiry,
  cleanupExpiredOTPs,
};

