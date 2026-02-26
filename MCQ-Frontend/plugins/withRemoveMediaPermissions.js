/**
 * Blocks READ_MEDIA_IMAGES and READ_MEDIA_VIDEO on Android so the app complies with
 * Google Play's photo/video permissions policy. We use the system photo picker for
 * profile picture selection (one-time use) and do not need broad media access.
 * @see https://support.google.com/googleplay/android-developer/answer/14115180
 */
const { AndroidConfig } = require('@expo/config-plugins');

const MEDIA_PERMISSIONS_TO_BLOCK = [
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
];

module.exports = function withRemoveMediaPermissions(config) {
  return AndroidConfig.Permissions.withBlockedPermissions(config, MEDIA_PERMISSIONS_TO_BLOCK);
};
