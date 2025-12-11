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

