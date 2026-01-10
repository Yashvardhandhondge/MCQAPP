const createError = require('http-errors');
const AppUpdateInitiation = require('../models/AppUpdateInitiation');
const User = require('../Modals/UserModal');

/**
 * Record app update initiation (when user clicks "Update Now")
 * POST /api/mcq/app-update/initiate
 */
const initiateAppUpdate = async (req, res, next) => {
  try {
    const { requiredVersion, requiredVersionCode, currentVersion, currentVersionCode, updateUrl, playStoreUrl, deviceInfo } = req.body;

    if (!requiredVersion || !currentVersion) {
      return next(createError(400, 'requiredVersion and currentVersion are required'));
    }

    // Create update initiation record
    const updateInitiation = new AppUpdateInitiation({
      user: req.user._id,
      requiredVersion,
      requiredVersionCode: requiredVersionCode || 1,
      currentVersion,
      currentVersionCode: currentVersionCode || undefined,
      updateUrl: updateUrl || '',
      playStoreUrl: playStoreUrl || '',
      downloadStatus: 'initiated',
      deviceInfo: deviceInfo || {},
    });

    await updateInitiation.save();

    res.status(200).json({
      success: true,
      message: 'Update initiation recorded successfully',
      data: {
        initiationId: updateInitiation._id,
        downloadStatus: updateInitiation.downloadStatus,
        updateUrl: updateInitiation.updateUrl,
        playStoreUrl: updateInitiation.playStoreUrl,
      },
    });
  } catch (error) {
    console.error('Error initiating app update:', error);
    return next(createError(500, 'Failed to record update initiation'));
  }
};

/**
 * Update download status
 * PUT /api/mcq/app-update/status/:initiationId
 */
const updateDownloadStatus = async (req, res, next) => {
  try {
    const { initiationId } = req.params;
    const { downloadStatus } = req.body;

    if (!downloadStatus || !['downloading', 'downloaded', 'failed', 'installed'].includes(downloadStatus)) {
      return next(createError(400, 'Valid downloadStatus is required'));
    }

    const updateInitiation = await AppUpdateInitiation.findOne({
      _id: initiationId,
      user: req.user._id, // Ensure user can only update their own records
    });

    if (!updateInitiation) {
      return next(createError(404, 'Update initiation not found'));
    }

    updateInitiation.downloadStatus = downloadStatus;
    
    if (downloadStatus === 'downloaded') {
      updateInitiation.downloadedAt = new Date();
    } else if (downloadStatus === 'installed') {
      updateInitiation.installedAt = new Date();
    }

    await updateInitiation.save();

    res.status(200).json({
      success: true,
      message: 'Download status updated successfully',
      data: {
        initiationId: updateInitiation._id,
        downloadStatus: updateInitiation.downloadStatus,
      },
    });
  } catch (error) {
    console.error('Error updating download status:', error);
    return next(createError(500, 'Failed to update download status'));
  }
};

/**
 * Get user's update initiations (for tracking)
 * GET /api/mcq/app-update/my-updates
 */
const getMyUpdateInitiations = async (req, res, next) => {
  try {
    const initiations = await AppUpdateInitiation.find({
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      data: initiations,
    });
  } catch (error) {
    console.error('Error fetching update initiations:', error);
    return next(createError(500, 'Failed to fetch update initiations'));
  }
};

module.exports = {
  initiateAppUpdate,
  updateDownloadStatus,
  getMyUpdateInitiations,
};
