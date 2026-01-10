const express = require('express');
const { authGuard } = require('../middleware/auth.middleware');
const { adminAuthGuard } = require('../middleware/admin.middleware');
const {
  sendNotification,
  getUserNotifications,
  markNotificationAsRead,
  registerDevice,
  getNotificationStats,
} = require('../controllers/notification.controller');

const router = express.Router();

/**
 * User endpoints (authenticated users)
 */
router.use(authGuard);

/**
 * @route   GET /api/mcq/notifications
 * @desc    Get user's notifications
 * @access  Private (requires authentication)
 */
router.get('/', getUserNotifications);

/**
 * @route   PUT /api/mcq/notifications/:id/read
 * @desc    Mark notification as read
 * @param   {string} id - Notification ID
 * @access  Private (requires authentication)
 */
router.put('/:id/read', markNotificationAsRead);

/**
 * @route   POST /api/mcq/notifications/register-device
 * @desc    Register OneSignal player ID for device
 * @body    {string} playerId - OneSignal player ID
 * @access  Private (requires authentication)
 */
router.post('/register-device', registerDevice);

module.exports = router;
