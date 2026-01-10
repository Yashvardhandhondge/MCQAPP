# OneSignal Device Registration - Rebuild Instructions

## Problem
OneSignal native module is not loading. The logs show "Stub detected" which means the native code isn't properly linked.

## Solution Steps

### Option 1: Quick Fix (Clear Cache & Reload)
```bash
cd /Users/adityasudhakarchawale/Desktop/MCQAPP/MCQ-Frontend

# Clear Metro bundler cache
npx expo start --clear

# Then reload the app on your device (shake device -> "Reload" or press 'r' in terminal)
```

### Option 2: Full Rebuild (Recommended)
```bash
cd /Users/adityasudhakarchawale/Desktop/MCQAPP/MCQ-Frontend

# 1. Ensure OneSignal package is installed
npm install react-native-onesignal

# 2. Clean and regenerate native code (this links OneSignal properly)
npx expo prebuild --clean --platform android

# 3. Rebuild the app
npx expo run:android
```

### Option 3: EAS Build (For Production)
```bash
cd /Users/adityasudhakarchawale/Desktop/MCQAPP/MCQ-Frontend

# Build with EAS
eas build --platform android --profile development

# Then install the generated APK on your device
```

## What to Look For After Rebuild

After rebuilding, check your console logs. You should see:

✅ **Success indicators:**
- `🔬 [OneSignal] === BUILD ENVIRONMENT DIAGNOSTICS ===`
- `✅ [OneSignal] Real OneSignal instance detected and ready!`
- `✅ [OneSignal] Initialized successfully`
- `✅ [DEVICE REGISTRATION] Device registered successfully with backend`

❌ **If you still see errors:**
- Look for `❌ [OneSignal] ERROR loading module:` - this will show the actual error
- Check the diagnostic output for missing native modules
- Verify `onesignal-expo-plugin` is in `app.json` plugins array (it is)

## Debugging

The new code includes extensive diagnostics. When the app starts, you'll see:
- Execution environment details
- Available native modules
- OneSignal module loading attempts
- Detailed error messages with solutions

## Current Status

- ✅ Code updated with proper OneSignal SDK v5 methods
- ✅ Diagnostic logging added
- ✅ Auto-registration on subscription change
- ✅ Enhanced error handling
- ⚠️ **NATIVE MODULE NEEDS REBUILD** - The native code must be regenerated and app rebuilt

## Next Steps

1. Try Option 1 first (clear cache and reload)
2. If that doesn't work, do Option 2 (full rebuild)
3. Check console logs for the diagnostic output
4. Look for the actual error message when OneSignal tries to load
5. Share the full diagnostic logs if issues persist
