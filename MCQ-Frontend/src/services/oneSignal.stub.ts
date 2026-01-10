// Stub module for OneSignal when not available (e.g., in Expo Go or when package not installed)
// This prevents Metro bundler from trying to resolve react-native-onesignal at build time

export default {
  setAppId: () => {
    console.log('OneSignal stub: setAppId called (OneSignal not available)');
  },
  promptForPushNotificationsWithUserResponse: () => {
    console.log('OneSignal stub: promptForPushNotificationsWithUserResponse called (OneSignal not available)');
  },
  setNotificationWillShowInForegroundHandler: () => {
    console.log('OneSignal stub: setNotificationWillShowInForegroundHandler called (OneSignal not available)');
  },
  getDeviceState: () => null,
  getUserId: () => null,
  setExternalUserId: () => {
    console.log('OneSignal stub: setExternalUserId called (OneSignal not available)');
  },
  removeExternalUserId: () => {
    console.log('OneSignal stub: removeExternalUserId called (OneSignal not available)');
  },
  setNotificationOpenedHandler: () => {
    console.log('OneSignal stub: setNotificationOpenedHandler called (OneSignal not available)');
  },
  User: {
    pushSubscription: {
      id: null,
      token: null,
      optedIn: false,
      addEventListener: () => {
        console.log('OneSignal stub: pushSubscription.addEventListener called (OneSignal not available)');
      },
    },
  },
  Notifications: {
    addEventListener: () => {
      console.log('OneSignal stub: Notifications.addEventListener called (OneSignal not available)');
    },
  },
  pushSubscription: {
    id: null,
    token: null,
  },
};
