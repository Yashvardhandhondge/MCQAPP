const createError = require('http-errors');
const User = require('../Modals/UserModal');
const { signToken } = require('../utils/token');
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
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return next(createError(400, 'Full name, email and password are required'));
    }

    // Log current database and collection info
    console.log('Current database for user registration:', mongoose.connection.db.databaseName);
    console.log('User model collection:', User.collection.name);
    
    // Check if user exists with detailed logging
    const existingUser = await User.findOne({ email });
    console.log('Checking for existing user with email:', email);
    console.log('Existing user found:', existingUser ? 'YES' : 'NO');
    
    if (existingUser) {
      console.log('Found existing user ID:', existingUser._id);
      console.log('User database:', existingUser.db?.name || 'unknown');
      return next(createError(409, `User with email ${email} already exists in ${mongoose.connection.db.databaseName} database`));
    }

    const user = await User.create({ fullName, email, password });
    console.log('User created successfully in database:', mongoose.connection.db.databaseName);
    console.log('New user ID:', user._id);
    
    const response = buildAuthPayload(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      ...response,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt with:', { email, password: '***' });

    if (!email || !password) {
      return next(createError(400, 'Email and password are required'));
    }

    // Hardcoded Super Admin credentials
    const SUPER_ADMIN_EMAIL = 'yashclass@gmail.com';
    const SUPER_ADMIN_PASSWORD = '12345678';
    const SUPER_ADMIN_ID = '000000000000000000000001'; // Hardcoded ObjectId

    // Check if it's the hardcoded super admin
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && password === SUPER_ADMIN_PASSWORD) {
      console.log('Super admin login detected');
      
      // Create a virtual user object for super admin
      const superAdminUser = {
        _id: SUPER_ADMIN_ID,
        fullName: 'Super Admin',
        email: SUPER_ADMIN_EMAIL,
        role: 'admin',
        group: null,
        subscription: 'premium',
        savedQuestions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: function() {
          return {
            _id: this._id,
            fullName: this.fullName,
            email: this.email,
            role: this.role,
            group: this.group,
            subscription: this.subscription,
            savedQuestions: this.savedQuestions,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
          };
        }
      };

      const response = buildAuthPayload(superAdminUser);
      console.log('Super admin login successful');

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        ...response,
      });
    }

    // Normal user login - check database
    const user = await User.findOne({ email }).select('+password');
    console.log('User found in database:', user ? 'YES' : 'NO');

    if (!user) {
      console.log('No user found with email:', email);
      return next(createError(401, 'Invalid email or password'));
    }

    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      console.log('Password does not match for user:', email);
      return next(createError(401, 'Invalid email or password'));
    }

    // Remove password from user object
    user.password = undefined;
    
    // Create response payload
    const response = buildAuthPayload(user);
    console.log('Login successful:', response.user.fullName, 'User ID:', response.user._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      ...response,
    });
  } catch (error) {
    console.error('Login error:', error);
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
    const { group } = req.body;

    // Build update object - always upgrade to premium
    const updateData = { subscription: 'premium' };

    // If group is provided, validate and update it
    if (group) {
      const validGroups = ['PCM', 'PCB', 'PCMB'];
      if (!validGroups.includes(group)) {
        return next(createError(400, 'Invalid group. Must be one of: PCM, PCB, PCMB'));
      }
      updateData.group = group;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return next(createError(404, 'User not found'));
    }

    const response = buildAuthPayload(user);

    return res.status(200).json({
      success: true,
      message: group 
        ? `Subscription upgraded to premium and group updated to ${group} successfully`
        : 'Subscription upgraded to premium successfully',
      ...response,
    });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    return next(error);
  }
};

module.exports = {
  register,
  login,
  profile,
  updateGroup,
  upgradeSubscription,
};

