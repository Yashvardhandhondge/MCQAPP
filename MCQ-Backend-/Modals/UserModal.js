const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

// Phone number validation for Indian format (+91 followed by 10 digits)
const validateIndianPhone = (phone) => {
  const phoneRegex = /^\+91[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 64,
    },
    email: {
      type: String,
      required: false, // Made optional for OTP-based login
      unique: true,
      sparse: true, // Allows multiple null values
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          // Only validate if email is provided
          if (!v) return true;
          return validator.isEmail(v);
        },
        message: 'Please provide a valid email address',
      },
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: validateIndianPhone,
        message: 'Phone number must be in Indian format: +91 followed by 10 digits starting with 6-9',
      },
      index: true,
    },
    password: {
      type: String,
      required: false, // Made optional for OTP-based login
      minlength: 8,
      select: false,
      validate: {
        validator: function(v) {
          // Password is required if email is provided (email/password login)
          if (this.email && !v) return false;
          return true;
        },
        message: 'Password is required when email is provided',
      },
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    group: {
      type: String,
      enum: ['PCM', 'PCB', 'PCMB'],
      default: null,
    },
    subscription: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free',
    },
    savedQuestions: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    oneSignalPlayerId: {
      type: String,
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'users', // Explicitly set collection name
  }
);

userSchema.pre('save', async function hashPassword(next) {
  // Only hash password if it's modified and exists (for email/password login)
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Explicitly specify the collection name to ensure it uses 'users' in MCQ database
module.exports = mongoose.model('User', userSchema, 'users');

