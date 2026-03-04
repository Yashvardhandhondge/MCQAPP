const createError = require('http-errors');
const User = require('../Modals/UserModal');
const Otp = require('../models/Otp');
const { signToken } = require('../utils/token');
const { generateOTP, hashOTP, verifyOTP: compareOTP, getOTPExpiry } = require('../utils/otpManager');
const { sendOTP: sendOTPSMS } = require('../utils/smsService');
const mongoose = require('mongoose');

const buildAuthPayload = (user) => {
  // Ensure we have a proper user object
  if (!user) {
    throw new Error('User object is required to build auth payload');
  }

  const safeUser = user.toJSON ? user.toJSON() : user;
  const token = signToken({ id: user._id, role: user.role });

  console.log('Building auth payload for user:', {
    id: safeUser._id,
    fullName: safeUser.fullName,
    email: safeUser.email,
    role: safeUser.role
  });

  return { user: safeUser, token };
};

const register = async (req, res, next) => {
  try {
    const { fullName, email, phoneNumber } = req.body;

    if (!fullName || !email || !phoneNumber) {
      return next(createError(400, 'Full name, email and phone number are required'));
    }

    // Validate phone number format (Indian format: +91XXXXXXXXXX)
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return next(createError(400, 'Invalid phone number format. Must be in Indian format: +91 followed by 10 digits starting with 6-9'));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(createError(400, 'Invalid email format'));
    }

    // Log current database and collection info
    const dbName = mongoose.connection.db ? mongoose.connection.db.databaseName : 'MCQ';
    console.log('Current database for user registration:', dbName);
    console.log('User model collection:', User.collection.name);
    
    // Check if user exists with email or phone number
    const existingUserByEmail = await User.findOne({ email });
    const existingUserByPhone = await User.findOne({ phoneNumber });
    
    console.log('Checking for existing user with email:', email);
    console.log('Existing user by email found:', existingUserByEmail ? 'YES' : 'NO');
    console.log('Checking for existing user with phone:', phoneNumber);
    console.log('Existing user by phone found:', existingUserByPhone ? 'YES' : 'NO');
    
    if (existingUserByEmail) {
      console.log('Found existing user ID:', existingUserByEmail._id);
      return next(createError(409, `User with email ${email} already exists`));
    }

    if (existingUserByPhone) {
      console.log('Found existing user ID:', existingUserByPhone._id);
      return next(createError(409, 'You already registered through this number, please login or use another number'));
    }

    // Create user without password (OTP-based authentication only)
    const user = await User.create({ fullName, email, phoneNumber });
    console.log('User created successfully in database:', dbName);
    console.log('New user ID:', user._id);
    
    const response = buildAuthPayload(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Please login with OTP to continue.',
      ...response,
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.email) {
        return next(createError(409, 'Email already exists'));
      }
      if (error.keyPattern && error.keyPattern.phoneNumber) {
        return next(createError(409, 'Phone number already exists'));
      }
    }
    
    return next(error);
  }
};


const profile = (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

const updateGroup = async (req, res, next) => {
  try {
    const { group } = req.body;

    if (!group) {
      return next(createError(400, 'Group is required'));
    }

    const validGroups = ['PCM', 'PCB', 'PCMB'];
    if (!validGroups.includes(group)) {
      return next(createError(400, 'Invalid group. Must be one of: PCM, PCB, PCMB'));
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { group },
      { new: true, runValidators: true }
    );

    if (!user) {
      return next(createError(404, 'User not found'));
    }

    const response = buildAuthPayload(user);

    return res.status(200).json({
      success: true,
      message: 'Group updated successfully',
      ...response,
    });
  } catch (error) {
    console.error('Update group error:', error);
    return next(error);
  }
};

const upgradeSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(createError(404, 'User not found'));
    }

    user.subscription = 'premium';
    if (!user.premiumActivatedAt) {
      user.premiumActivatedAt = new Date();
    }
    await user.save();


    const response = buildAuthPayload(user);

    return res.status(200).json({
      success: true,
      message: 'Subscription upgraded to premium successfully',
      ...response,
    });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    return next(error);
  }
};

/**
 * Send OTP to phone number
 * POST /api/auth/send-otp
 * Body: { phoneNumber: string }
 */
const sendOTP = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;

    // Validate phone number format (Indian format: +91XXXXXXXXXX)
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      return next(createError(400, 'Invalid phone number format. Must be in Indian format: +91 followed by 10 digits starting with 6-9'));
    }

    // Dummy numbers for Play Store review / internal testing
    // All of these will use the fixed OTP "123456" and will not send real SMS
    const DUMMY_OTP = '123456';
    const DUMMY_PHONE_NUMBERS = [
      '+918010140175', // Original Play Store review number
      '+919579050152', // Test number 1
      '+917020781343', // Test number 2
      // Add more dummy numbers here as needed for testing
    ];
    const isDummyNumber = DUMMY_PHONE_NUMBERS.includes(phoneNumber);

    // For dummy number, skip user existence check (allow for Play Store review)
    // For real numbers, check if user exists before sending OTP (login requires existing account)
    if (!isDummyNumber) {
      const existingUser = await User.findOne({ phoneNumber });
      if (!existingUser) {
        return next(createError(404, 'No account found with this phone number. Please sign up first.'));
      }
    }

    // Delete any existing OTPs for this phone number
    await Otp.deleteMany({ phoneNumber });

    let plainOtp, hashedOtp;

    if (isDummyNumber) {
      // For dummy numbers, use fixed OTP
      plainOtp = DUMMY_OTP;
      hashedOtp = await hashOTP(DUMMY_OTP);
      console.log(`[OTP] Using dummy OTP for testing number: ${phoneNumber}`);
    } else {
      // Generate new OTP for real numbers
      plainOtp = generateOTP();
      hashedOtp = await hashOTP(plainOtp);
    }

    const expiresAt = getOTPExpiry();

    // Store OTP in database
    const otpRecord = await Otp.create({
      phoneNumber,
      otp: hashedOtp,
      expiresAt,
      attempts: 0,
    });

    console.log(`[OTP] Generated OTP for ${phoneNumber}, expires at ${expiresAt}`);

    // Skip SMS for dummy number (Play Store review)
    if (isDummyNumber) {
      console.log(`[OTP] Skipping SMS for dummy number (Play Store review): ${phoneNumber}`);
      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully to your phone number',
        expiresIn: 300, // 5 minutes in seconds
      });
    }

    // Send OTP via SMS for real numbers
    const smsResult = await sendOTPSMS(phoneNumber, plainOtp);

    if (!smsResult.success) {
      // Delete OTP record if SMS failed
      await Otp.findByIdAndDelete(otpRecord._id);
      console.error(`[OTP] SMS sending failed for ${phoneNumber}:`, smsResult.error);
      return next(createError(500, smsResult.error || 'Failed to send OTP. Please try again.'));
    }

    console.log(`[OTP] OTP sent successfully to ${phoneNumber}`);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your phone number',
      expiresIn: 300, // 5 minutes in seconds
    });
  } catch (error) {
    console.error('[OTP] Send OTP error:', error);
    
    // Handle duplicate key error (shouldn't happen with deleteMany, but just in case)
    if (error.code === 11000) {
      return next(createError(409, 'OTP already exists for this number. Please wait before requesting a new one.'));
    }
    
    return next(createError(500, 'Failed to send OTP. Please try again.'));
  }
};

/**
 * Verify OTP and login/register user
 * POST /api/auth/verify-otp
 * Body: { phoneNumber: string, otp: string }
 */
const verifyOTP = async (req, res, next) => {
  try {
    const { phoneNumber, otp } = req.body;

    // Validate inputs
    if (!phoneNumber || !otp) {
      return next(createError(400, 'Phone number and OTP are required'));
    }

    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return next(createError(400, 'Invalid phone number format'));
    }

    if (!/^\d{6}$/.test(otp)) {
      return next(createError(400, 'OTP must be 6 digits'));
    }

    // Dummy numbers for Play Store review / internal testing
    const DUMMY_OTP = '123456';
    const DUMMY_PHONE_NUMBERS = [
      '+918010140175', // Original Play Store review number
      '+919579050152', // Test number 1
      '+917020781343', // Test number 2
    ];
    const isDummyNumber = DUMMY_PHONE_NUMBERS.includes(phoneNumber);

    // For dummy number, bypass OTP verification if correct OTP is provided
    if (isDummyNumber && otp === DUMMY_OTP) {
      console.log(`[OTP] Dummy number OTP verification bypassed for Play Store review: ${phoneNumber}`);
      
      // Find existing user or create one if doesn't exist (for Play Store review)
      let user = await User.findOne({ phoneNumber });
      
      if (!user) {
        // Create a dummy user for Play Store review
        user = await User.create({
          fullName: 'Test User',
          email: `test_${Date.now()}@example.com`,
          phoneNumber,
        });
        console.log(`[OTP] Created dummy test user for number: ${phoneNumber}, id: ${user._id}`);
      }

      // Delete any existing OTP records for this number
      await Otp.deleteMany({ phoneNumber });

      // Build auth payload and return
      const response = buildAuthPayload(user);

      console.log(`[OTP] Dummy OTP verification successful for ${phoneNumber}`);

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        ...response,
      });
    }

    // For real numbers, proceed with normal OTP verification
    // Find the most recent OTP for this phone number
    const otpRecord = await Otp.findOne({ phoneNumber }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return next(createError(400, 'No OTP found for this phone number. Please request a new OTP.'));
    }

    // Check if OTP has expired
    if (otpRecord.expiresAt < new Date()) {
      return next(createError(400, 'OTP has expired. Please request a new OTP.'));
    }

    // Verify OTP
    const isValid = await compareOTP(otpRecord.otp, otp);

    if (!isValid) {
      console.log(`[OTP] Invalid OTP attempt for ${phoneNumber}`);
      return next(createError(400, 'Invalid OTP. Please try again or request a new OTP.'));
    }

    // OTP is valid - find existing user (no auto-create)
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return next(createError(404, 'No account found with this phone number. Please sign up first.'));
    }

    console.log(`[OTP] User logged in via OTP: ${user._id} (${phoneNumber})`);

    // Delete OTP after successful verification
    await Otp.findByIdAndDelete(otpRecord._id);

    // Build auth payload and return
    const response = buildAuthPayload(user);

    console.log(`[OTP] OTP verification successful for ${phoneNumber}`);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      ...response,
    });
  } catch (error) {
    console.error('[OTP] Verify OTP error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      // Check which field caused the duplicate
      if (error.keyPattern && error.keyPattern.phoneNumber) {
        return next(createError(409, 'Phone number already exists'));
      } else if (error.keyPattern && error.keyPattern.email) {
        return next(createError(409, 'Account creation failed due to email conflict. Please try again.'));
      }
      return next(createError(409, 'Account creation failed. Please try again.'));
    }
    
    return next(createError(500, 'Failed to verify OTP. Please try again.'));
  }
};

/**
 * Login with email and password
 * POST /api/auth/login
 * Body: { email: string, password: string }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return next(createError(400, 'Email and password are required'));
    }

    // Find user by email and include password (since select: false in schema)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(createError(401, 'Invalid email or password'));
    }

    // Check if user has a password (admin users with email/password login)
    if (!user.password) {
      return next(createError(401, 'Invalid email or password'));
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return next(createError(401, 'Invalid email or password'));
    }

    console.log(`[Login] User logged in via email/password: ${user._id} (${email}), role: ${user.role}`);

    // Build auth payload and return
    const response = buildAuthPayload(user);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      ...response,
    });
  } catch (error) {
    console.error('[Login] Login error:', error);
    return next(createError(500, 'Failed to login. Please try again.'));
  }
};

module.exports = {
  register,
  profile,
  updateGroup,
  upgradeSubscription,
  sendOTP,
  verifyOTP,
  login,
};

