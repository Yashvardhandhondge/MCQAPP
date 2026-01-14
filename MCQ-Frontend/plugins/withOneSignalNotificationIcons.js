const { withAndroidManifest } = require("@expo/config-plugins");

function upsertMetaData(app, name, valueOrResource, isResource = false) {
  app["meta-data"] = app["meta-data"] ?? [];
  const metaData = app["meta-data"];
  const existing = metaData.find((m) => m?.$?.["android:name"] === name);

  const entry = {
    $: {
      "android:name": name,
      ...(isResource
        ? { "android:resource": valueOrResource }
        : { "android:value": valueOrResource }),
    },
  };

  if (existing) Object.assign(existing, entry);
  else metaData.push(entry);
}

/**
 * Ensures OneSignal uses our default small/large notification icons.
 * Docs: https://documentation.onesignal.com/docs/customize-notification-icons
 */
module.exports = function withOneSignalNotificationIcons(config) {
  return withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application?.[0];
    if (!app) return config;

    upsertMetaData(
      app,
      "com.onesignal.NotificationIcon",
      "@drawable/ic_stat_onesignal_default",
      true
    );
    upsertMetaData(
      app,
      "com.onesignal.NotificationLargeIcon",
      "@drawable/ic_onesignal_large_icon_default",
      true
    );

    return config;
  });
};

