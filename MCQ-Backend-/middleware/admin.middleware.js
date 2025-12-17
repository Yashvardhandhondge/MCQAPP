const createError = require('http-errors');
const { authGuard } = require('./auth.middleware');

/**
 * Middleware to check if user is admin
 * Must be used after authGuard
 */
const adminGuard = (req, res, next) => {
  if (!req.user) {
    return next(createError(401, 'Authentication required'));
  }

  if (req.user.role !== 'admin') {
    return next(createError(403, 'Admin access required'));
  }

  return next();
};

/**
 * Combined middleware: first authenticate, then check admin role
 */
const adminAuthGuard = [authGuard, adminGuard];

module.exports = {
  adminGuard,
  adminAuthGuard,
};

