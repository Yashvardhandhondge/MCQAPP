# OneSignal SDK v5 Fix Summary

## Issues Fixed

### 1. ✅ Module Loading
- Fixed to use named export `OneSignalModule.OneSignal` instead of default export
- SDK v5 uses a named export structure

### 2. ✅ setExternalUserId Error
- **Fixed**: Updated to use SDK v5 API methods:
  - `OneSignal.User.addAlias()` or `OneSignal.User.login()` (SDK v5)
  - Falls back to `OneSignal.setExternalUserId()` (SDK v4)
  
### 3. ✅ Subscription ID Access
- Enhanced logging to debug subscription object structure
- Added polling mechanism to check for subscription ID periodically
- Improved subscription change event handler to access ID from multiple locations

### 4. ✅ Initialization
- Added support for both `initialize()` and `setAppId()` methods
- Better error handling and logging

## Current Issue

**Subscription ID is `undefined` even after permission is granted**

The logs show:
- ✅ Permission granted: `✅ [OneSignal] User granted push notification permissions`
- ❌ Subscription ID: `undefined` in subscription change events
- ❌ All methods fail to get player ID

## Possible Causes

1. **SDK v5 API Structure**: The subscription ID might be accessed differently in SDK v5
2. **Timing Issue**: Subscription ID might take time to generate after permission is granted
3. **Native Code Linking**: Native module might not be fully linked (though permission works)

## Next Steps to Debug

1. **Check the actual SDK v5 API**:
   ```bash
   # In your app, after reload, check the console for:
   # - What methods are available on OneSignal.User.pushSubscription
   # - What the subscription object structure actually is
   ```

2. **Verify Native Code is Linked**:
   ```bash
   cd MCQ-Frontend
   npx expo prebuild --clean --platform android
   npx expo run:android
   ```

3. **Check OneSignal Documentation**:
   - Visit: https://documentation.onesignal.com/docs/react-native-sdk-setup
   - Check if SDK v5 has a different API for getting subscription ID

## What to Look For in Logs

After reloading the app, look for these logs:

✅ **Good signs:**
- `✅ [OneSignal] Initialized using setAppId()` or similar
- `✅ [OneSignal] User granted push notification permissions`
- `🔍 [OneSignal] PushSubscription object exists:` with detailed structure

❌ **Issues:**
- `id: undefined` in subscription object
- `❌ [OneSignal] All methods failed to get player ID`

## Manual Test

After the app reloads with the new code:
1. Grant notification permission when prompted
2. Wait 5-10 seconds
3. Check console logs for subscription ID
4. Try clicking "Register Device" button in Profile screen

## Expected Behavior

1. App initializes OneSignal ✅ (should work now)
2. Permission prompt appears ✅ (already working)
3. Permission granted ✅ (already working)
4. Subscription ID becomes available ⏳ (needs investigation)
5. Auto-register with backend ✅ (will work once ID is available)

## If Still Not Working

The issue might be that react-native-onesignal v5.2.16 has a different API structure than we're expecting. We may need to:
1. Check the actual SDK v5 documentation for the correct API
2. Try a different version of the SDK
3. Use the SDK's native methods directly if available
