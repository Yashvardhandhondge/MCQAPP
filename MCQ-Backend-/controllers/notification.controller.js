const createError = require('http-errors');
const User = require('../Modals/UserModal');
const Notification = require('../models/Notification');
const { sendNotificationToPlayers } = require('../utils/oneSignalService');

/**
 * Send notification to users (Admin only)
 * POST /api/mcq/admin/notifications/send
 */
const sendNotification = async (req, res, next) => {
  try {
    const { title, message, targetAudience, url } = req.body;

    // Validate required fields
    if (!title || !message || !targetAudience) {
      return next(createError(400, 'Title, message, and target audience are required'));
    }

    // Validate target audience
    if (!['premium', 'non-premium', 'all'].includes(targetAudience)) {
      return next(createError(400, 'Invalid target audience. Must be: premium, non-premium, or all'));
    }

    // Build query based on target audience
    let userQuery = {};
    if (targetAudience === 'premium') {
      userQuery = { subscription: 'premium' };
    } else if (targetAudience === 'non-premium') {
      userQuery = { subscription: 'free' };
    }
    // For 'all', userQuery remains empty

    // Get total count of users matching the criteria
    const totalUsersCount = await User.countDocuments(userQuery);

    // Debug: Log the query being used
    const queryForUsers = {
      ...userQuery,
      oneSignalPlayerId: { $exists: true, $ne: null, $ne: '' },
    };
    console.log('📊 [NOTIFICATION] Query for users with devices:', JSON.stringify(queryForUsers, null, 2));

    // Get all users matching the criteria who have player IDs
    const users = await User.find(queryForUsers).select('_id oneSignalPlayerId subscription fullName email');

    console.log('📊 [NOTIFICATION] Found users with registered devices:', users.length);
    console.log('📊 [NOTIFICATION] Users found:', users.map(u => ({
      id: u._id,
      name: u.fullName,
      subscription: u.subscription,
      hasPlayerId: !!u.oneSignalPlayerId,
      playerIdLength: u.oneSignalPlayerId ? u.oneSignalPlayerId.length : 0,
    })));

    if (users.length === 0) {
      // Also check if there are any users with player IDs at all (for debugging)
      const allUsersWithDevices = await User.countDocuments({
        oneSignalPlayerId: { $exists: true, $ne: null, $ne: '' },
      });
      console.log('⚠️ [NOTIFICATION] No users found with devices matching criteria');
      console.log('⚠️ [NOTIFICATION] Total users with devices (any subscription):', allUsersWithDevices);
      
      return res.status(200).json({
        success: true,
        message: totalUsersCount > 0 
          ? `No users with registered devices found. Found ${totalUsersCount} ${targetAudience === 'all' ? 'total' : targetAudience} user(s), but none have registered their devices yet. Users need to open the app after logging in to register their device. (Total users with devices: ${allUsersWithDevices})`
          : `No ${targetAudience === 'all' ? '' : targetAudience + ' '}users found`,
        data: {
          notificationId: null,
          sentToCount: 0,
          totalUsersInAudience: totalUsersCount,
          usersWithRegisteredDevices: 0,
          totalUsersWithDevices: allUsersWithDevices, // Added for debugging
        },
      });
    }

    // Extract player IDs and filter out any empty/null values
    const playerIds = users
      .map((user) => user.oneSignalPlayerId)
      .filter((id) => id && typeof id === 'string' && id.trim().length > 0);
    
    console.log('📊 [NOTIFICATION] Extracted player IDs:', playerIds.length);
    console.log('📊 [NOTIFICATION] Player IDs (first 3):', playerIds.slice(0, 3));

    if (playerIds.length === 0) {
      console.error('❌ [NOTIFICATION] No valid player IDs found after filtering');
      console.error('❌ [NOTIFICATION] Original user player IDs:', users.map(u => ({
        userId: u._id,
        playerId: u.oneSignalPlayerId,
        playerIdType: typeof u.oneSignalPlayerId,
        playerIdLength: u.oneSignalPlayerId ? u.oneSignalPlayerId.length : 0,
      })));
      
      return res.status(200).json({
        success: true,
        message: 'No valid player IDs found (all were empty or invalid)',
        data: {
          notificationId: null,
          sentToCount: 0,
          usersFound: users.length,
        },
      });
    }

    // Create notification record in database first (to get the ID)
    const notification = await Notification.create({
      title,
      message,
      targetAudience,
      url: url || null,
      sentBy: req.user._id,
      sentTo: users.map((user) => user._id),
      readBy: [],
    });

    // Send notification via OneSignal with the notification ID for deep linking
    let oneSignalResponse = null;
    try {
      console.log('📤 [NOTIFICATION] Sending notification to OneSignal with', playerIds.length, 'player IDs');
      oneSignalResponse = await sendNotificationToPlayers(playerIds, title, message, {
        notificationId: notification._id.toString(),
        type: 'admin_notification',
      });
      console.log('✅ [NOTIFICATION] OneSignal API response:', JSON.stringify(oneSignalResponse, null, 2));
    } catch (oneSignalError) {
      console.error('❌ [NOTIFICATION] OneSignal error:', oneSignalError);
      console.error('❌ [NOTIFICATION] Error details:', {
        message: oneSignalError.message,
        stack: oneSignalError.stack,
        playerIdsCount: playerIds.length,
      });
      // If OneSignal fails, we still have the notification in DB, so we'll return it
      // but mark it as failed in the response
      return res.status(201).json({
        success: false,
        message: `Notification saved but failed to send via OneSignal: ${oneSignalError.message}`,
        data: {
          notificationId: notification._id,
          sentToCount: 0,
          oneSignalError: oneSignalError.message,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: `Notification sent successfully to ${playerIds.length} user(s)${totalUsersCount > playerIds.length ? ` out of ${totalUsersCount} ${targetAudience === 'all' ? 'total' : targetAudience} user(s) in target audience` : ''}`,
      data: {
        notificationId: notification._id,
        sentToCount: playerIds.length,
        totalUsersInAudience: totalUsersCount,
        usersWithRegisteredDevices: playerIds.length,
        oneSignalResponse,
      },
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return next(createError(500, 'Failed to send notification'));
  }
};

/**
 * Get user notifications
 * GET /api/mcq/notifications
 */
const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get all notifications where user is in sentTo array
    const notifications = await Notification.find({
      sentTo: userId,
    })
      .populate('sentBy', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    // Add read status to each notification
    const notificationsWithReadStatus = notifications.map((notification) => ({
      ...notification,
      isRead: notification.readBy.some((readUserId) => readUserId.toString() === userId.toString()),
    }));

    // Get unread count
    const unreadCount = notificationsWithReadStatus.filter((n) => !n.isRead).length;

    res.status(200).json({
      success: true,
      data: {
        notifications: notificationsWithReadStatus,
        unreadCount,
        totalCount: notificationsWithReadStatus.length,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return next(createError(500, 'Failed to fetch notifications'));
  }
};

/**
 * Mark notification as read
 * PUT /api/mcq/notifications/:id/read
 */
const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find notification and verify user received it
    const notification = await Notification.findById(id);

    if (!notification) {
      return next(createError(404, 'Notification not found'));
    }

    // Check if user is in sentTo array
    const userReceived = notification.sentTo.some((sentUserId) => sentUserId.toString() === userId.toString());

    if (!userReceived) {
      return next(createError(403, 'You did not receive this notification'));
    }

    // Add user to readBy array if not already present
    if (!notification.readBy.some((readUserId) => readUserId.toString() === userId.toString())) {
      notification.readBy.push(userId);
      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: {
        notificationId: notification._id,
      },
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return next(createError(500, 'Failed to mark notification as read'));
  }
};

/**
 * Register device with OneSignal player ID
 * POST /api/mcq/notifications/register-device
 */
const registerDevice = async (req, res, next) => {
  try {
    const { playerId } = req.body;

    if (!playerId) {
      return next(createError(400, 'Player ID is required'));
    }

    const userId = req.user._id;
    
    console.log('📱 [DEVICE REGISTRATION] Registering device:', {
      userId: userId.toString(),
      playerId: playerId.substring(0, 20) + '...',
      playerIdLength: playerId.length,
    });

    // Update user's player ID
    const user = await User.findByIdAndUpdate(
      userId,
      { oneSignalPlayerId: playerId.trim() }, // Trim whitespace just in case
      { new: true }
    );

    if (!user) {
      console.error('❌ [DEVICE REGISTRATION] User not found:', userId);
      return next(createError(404, 'User not found'));
    }

    // Verify the player ID was saved
    const savedPlayerId = user.oneSignalPlayerId;
    console.log('✅ [DEVICE REGISTRATION] Device registered successfully:', {
      userId: user._id.toString(),
      savedPlayerId: savedPlayerId ? savedPlayerId.substring(0, 20) + '...' : 'null',
      savedPlayerIdLength: savedPlayerId ? savedPlayerId.length : 0,
      userSubscription: user.subscription,
      userGroup: user.group,
    });

    res.status(200).json({
      success: true,
      message: 'Device registered successfully',
      data: {
        userId: user._id,
        playerId: user.oneSignalPlayerId,
      },
    });
  } catch (error) {
    console.error('❌ [DEVICE REGISTRATION] Error registering device:', error);
    return next(createError(500, 'Failed to register device'));
  }
};

/**
 * Get device registration stats (Admin only)
 * GET /api/mcq/admin/notifications/device-stats
 */
const getDeviceRegistrationStats = async (req, res, next) => {
  try {
    // Get total users
    const totalUsers = await User.countDocuments();
    
    // Get users with registered devices
    const usersWithDevices = await User.countDocuments({
      oneSignalPlayerId: { $exists: true, $ne: null },
    });
    
    // Get breakdown by subscription
    const premiumWithDevices = await User.countDocuments({
      subscription: 'premium',
      oneSignalPlayerId: { $exists: true, $ne: null },
    });
    
    const freeWithDevices = await User.countDocuments({
      subscription: 'free',
      oneSignalPlayerId: { $exists: true, $ne: null },
    });
    
    const premiumTotal = await User.countDocuments({ subscription: 'premium' });
    const freeTotal = await User.countDocuments({ subscription: 'free' });
    
    // Get list of users without devices (for debugging)
    const usersWithoutDevices = await User.find({
      $or: [
        { oneSignalPlayerId: { $exists: false } },
        { oneSignalPlayerId: null },
      ],
    })
      .select('_id fullName email phoneNumber subscription createdAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        usersWithDevices,
        usersWithoutDevices: totalUsers - usersWithDevices,
        bySubscription: {
          premium: {
            total: premiumTotal,
            withDevices: premiumWithDevices,
            withoutDevices: premiumTotal - premiumWithDevices,
          },
          free: {
            total: freeTotal,
            withDevices: freeWithDevices,
            withoutDevices: freeTotal - freeWithDevices,
          },
        },
        recentUsersWithoutDevices: usersWithoutDevices,
      },
    });
  } catch (error) {
    console.error('Error fetching device registration stats:', error);
    return next(createError(500, 'Failed to fetch device registration statistics'));
  }
};

/**
 * Get notification statistics (Admin only)
 * GET /api/mcq/admin/notifications/stats
 */
const getNotificationStats = async (req, res, next) => {
  try {
    // Get total notifications sent
    const totalNotifications = await Notification.countDocuments();

    // Get notifications by target audience
    const byAudience = await Notification.aggregate([
      {
        $group: {
          _id: '$targetAudience',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent notifications (last 10)
    const recentNotifications = await Notification.find()
      .populate('sentBy', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title targetAudience createdAt sentTo readBy')
      .lean();

    // Calculate read rates for recent notifications
    const notificationsWithStats = recentNotifications.map((notification) => ({
      ...notification,
      sentToCount: notification.sentTo.length,
      readByCount: notification.readBy.length,
      readRate: notification.sentTo.length > 0 
        ? ((notification.readBy.length / notification.sentTo.length) * 100).toFixed(2)
        : 0,
    }));

    // Get users with registered devices
    const usersWithDevices = await User.countDocuments({
      oneSignalPlayerId: { $exists: true, $ne: null },
    });

    const premiumWithDevices = await User.countDocuments({
      subscription: 'premium',
      oneSignalPlayerId: { $exists: true, $ne: null },
    });

    const freeWithDevices = await User.countDocuments({
      subscription: 'free',
      oneSignalPlayerId: { $exists: true, $ne: null },
    });

    res.status(200).json({
      success: true,
      data: {
        totalNotifications,
        byAudience: byAudience.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentNotifications: notificationsWithStats,
        deviceStats: {
          totalWithDevices: usersWithDevices,
          premiumWithDevices,
          freeWithDevices,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return next(createError(500, 'Failed to fetch notification statistics'));
  }
};

/**
 * Get all notifications (Admin only)
 * GET /api/mcq/admin/notifications
 */
const getAllNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find()
      .populate('sentBy', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    // Add stats to each notification
    const notificationsWithStats = notifications.map((notification) => ({
      ...notification,
      sentToCount: notification.sentTo.length,
      readByCount: notification.readBy.length,
      readRate: notification.sentTo.length > 0 
        ? ((notification.readBy.length / notification.sentTo.length) * 100).toFixed(2)
        : 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        notifications: notificationsWithStats,
        totalCount: notificationsWithStats.length,
      },
    });
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    return next(createError(500, 'Failed to fetch notifications'));
  }
};

/**
 * Update notification (Admin only)
 * PUT /api/mcq/admin/notifications/:id
 */
const updateNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, message, url, targetAudience } = req.body;

    // Find the notification
    const notification = await Notification.findById(id);
    if (!notification) {
      return next(createError(404, 'Notification not found'));
    }

    // Validate required fields if provided
    if (title !== undefined && !title.trim()) {
      return next(createError(400, 'Title cannot be empty'));
    }
    if (message !== undefined && !message.trim()) {
      return next(createError(400, 'Message cannot be empty'));
    }
    if (targetAudience !== undefined && !['premium', 'non-premium', 'all'].includes(targetAudience)) {
      return next(createError(400, 'Invalid target audience. Must be: premium, non-premium, or all'));
    }

    // Update fields
    if (title !== undefined) notification.title = title.trim();
    if (message !== undefined) notification.message = message.trim();
    if (url !== undefined) notification.url = url.trim() || null;
    if (targetAudience !== undefined) notification.targetAudience = targetAudience;

    await notification.save();

    // Populate sentBy before returning
    await notification.populate('sentBy', 'fullName email');

    res.status(200).json({
      success: true,
      message: 'Notification updated successfully',
      data: {
        notification,
      },
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return next(createError(500, 'Failed to update notification'));
  }
};

/**
 * Delete notification (Admin only)
 * DELETE /api/mcq/admin/notifications/:id
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);
    if (!notification) {
      return next(createError(404, 'Notification not found'));
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      data: {
        notificationId: id,
      },
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return next(createError(500, 'Failed to delete notification'));
  }
};

module.exports = {
  sendNotification,
  getUserNotifications,
  markNotificationAsRead,
  registerDevice,
  getNotificationStats,
  getDeviceRegistrationStats,
  getAllNotifications,
  updateNotification,
  deleteNotification,
};
