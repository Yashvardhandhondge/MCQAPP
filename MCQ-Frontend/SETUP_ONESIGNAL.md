# OneSignal Setup Instructions

## Problem Identified
OneSignal is **not being autolinked** by Expo, which is why it's not working in your native build.

## Solution: Install OneSignal Expo Plugin

### Step 1: Install the Plugin
```bash
cd /Users/adityasudhakarchawale/Desktop/MCQAPP/MCQ-Frontend
npx expo install onesignal-expo-plugin
```

### Step 2: Regenerate Native Code
After installing the plugin, you need to regenerate the native code so OneSignal gets properly linked:

```bash
# Clean and regenerate native code with OneSignal plugin
npx expo prebuild --clean --platform android

# OR if you want to regenerate both platforms:
npx expo prebuild --clean
```

### Step 3: Rebuild the App
```bash
npx expo run:android
```

## What Changed

1. ✅ Added `onesignal-expo-plugin` to `app.json` plugins array
2. ✅ OneSignal App ID is already configured: `7a811e86-9a98-4206-abbf-46d38aceb027`
3. ✅ Enhanced logging in `oneSignal.service.ts` to help debug

## Why This Is Needed

- `react-native-onesignal` requires native code to be linked
- Expo's autolinking doesn't automatically detect OneSignal
- The `onesignal-expo-plugin` handles:
  - Native code linking
  - Android/iOS configuration
  - Proper integration with Expo's build system

## After Setup

Once you complete these steps:
1. The native code will be regenerated with OneSignal properly linked
2. The app will rebuild with OneSignal support
3. You should see logs like `✅ [OneSignal] Real OneSignal instance detected` instead of the stub messages
4. OneSignal features will work in your native build

## Troubleshooting

If you still see issues after following these steps:

1. **Clear all caches:**
   ```bash
   rm -rf android/app/.cxx android/app/build android/.gradle
   npx expo start --clear
   ```

2. **Check the logs** - The enhanced logging will show exactly what's happening:
   - Look for `🔍 [OneSignal]` logs
   - Check if `NativeModules.OneSignal` is available

3. **Verify plugin installation:**
   ```bash
   npm list onesignal-expo-plugin
   ```
