const createError = require('http-errors');
const AppVersion = require('../models/AppVersion');

/**
 * Get app version configuration (public endpoint)
 * GET /api/mcq/app-version
 */
const getAppVersion = async (req, res, next) => {
  try {
    // Try to find existing version config
    let appVersion = await AppVersion.findOne().sort({ createdAt: -1 });

    // If no config exists, create a default one (only one should exist)
    if (!appVersion) {
      // Delete any existing ones first (cleanup)
      await AppVersion.deleteMany({});
      
      appVersion = new AppVersion({
        requiredVersion: '1.0.0',
        requiredVersionCode: 1,
        updateMessage: 'A new version of the app is available. Please update to continue.',
        isUpdateRequired: false,
        playStoreUrl: '',
        updateUrl: '',
      });
      await appVersion.save();
    }

    res.status(200).json({
      success: true,
      data: {
        requiredVersion: appVersion.requiredVersion,
        requiredVersionCode: appVersion.requiredVersionCode,
        updateMessage: appVersion.updateMessage,
        isUpdateRequired: appVersion.isUpdateRequired,
        playStoreUrl: appVersion.playStoreUrl || '',
        updateUrl: appVersion.updateUrl || '',
      },
    });
  } catch (error) {
    console.error('Error getting app version:', error);
    return next(createError(500, 'Failed to fetch app version configuration'));
  }
};

/**
 * Set app version requirement (admin only)
 * PUT /api/mcq/admin/app-version
 */
const setAppVersion = async (req, res, next) => {
  try {
    const { requiredVersion, requiredVersionCode, updateMessage, playStoreUrl, updateUrl } = req.body;

    if (!requiredVersion) {
      return next(createError(400, 'requiredVersion is required'));
    }

    let appVersion = await AppVersion.findOne();

    if (!appVersion) {
      appVersion = new AppVersion({
        requiredVersion,
        requiredVersionCode: requiredVersionCode || 1,
        updateMessage: updateMessage || 'A new version of the app is available. Please update to continue.',
        isUpdateRequired: true,
        playStoreUrl: playStoreUrl || '',
        updateUrl: updateUrl || '',
      });
    } else {
      appVersion.requiredVersion = requiredVersion;
      appVersion.requiredVersionCode = requiredVersionCode || appVersion.requiredVersionCode || 1;
      appVersion.updateMessage = updateMessage || appVersion.updateMessage;
      appVersion.isUpdateRequired = true;
      if (playStoreUrl !== undefined) {
        appVersion.playStoreUrl = playStoreUrl;
      }
      if (updateUrl !== undefined) {
        appVersion.updateUrl = updateUrl;
      }
    }

    await appVersion.save();

    res.status(200).json({
      success: true,
      message: 'App version requirement updated successfully',
      data: {
        requiredVersion: appVersion.requiredVersion,
        requiredVersionCode: appVersion.requiredVersionCode,
        updateMessage: appVersion.updateMessage,
        isUpdateRequired: appVersion.isUpdateRequired,
        playStoreUrl: appVersion.playStoreUrl || '',
        updateUrl: appVersion.updateUrl || '',
      },
    });
  } catch (error) {
    console.error('Error setting app version:', error);
    return next(createError(500, 'Failed to update app version configuration'));
  }
};

/**
 * Disable update requirement (admin only)
 * DELETE /api/mcq/admin/app-version
 */
const disableUpdateRequirement = async (req, res, next) => {
  try {
    let appVersion = await AppVersion.findOne();

    if (!appVersion) {
      return next(createError(404, 'App version configuration not found'));
    }

    appVersion.isUpdateRequired = false;
    await appVersion.save();

    res.status(200).json({
      success: true,
      message: 'Update requirement disabled successfully',
      data: {
        requiredVersion: appVersion.requiredVersion,
        requiredVersionCode: appVersion.requiredVersionCode,
        isUpdateRequired: appVersion.isUpdateRequired,
      },
    });
  } catch (error) {
    console.error('Error disabling update requirement:', error);
    return next(createError(500, 'Failed to disable update requirement'));
  }
};

module.exports = {
  getAppVersion,
  setAppVersion,
  disableUpdateRequirement,
};
