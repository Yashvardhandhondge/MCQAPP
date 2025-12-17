const createError = require('http-errors');
const { verifyToken } = require('../utils/token');
const User = require('../Modals/UserModal');

const getTokenFromRequest = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }

  if (req.cookies?.token) {
    return req.cookies.token;
  }

  return null;
};

const authGuard = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return next(createError(401, 'Authentication required'));
    }

    const decoded = verifyToken(token);
    
    // Check if it's the hardcoded super admin
    const SUPER_ADMIN_ID = '000000000000000000000001';
    if (decoded.id === SUPER_ADMIN_ID) {
      // Create virtual super admin user object
      req.user = {
        _id: SUPER_ADMIN_ID,
        fullName: 'Super Admin',
        email: 'yashclass@gmail.com',
        role: 'admin',
        group: null,
        subscription: 'premium',
        savedQuestions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return next();
    }

    // Normal user - check database
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(createError(401, 'User no longer exists'));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(createError(401, 'Invalid or expired token'));
  }
};

module.exports = {
  authGuard,
};

