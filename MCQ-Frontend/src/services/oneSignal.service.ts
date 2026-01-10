import Constants from 'expo-constants';
import { Platform, NativeModules } from 'react-native';
import { registerDevice } from './notification.service';
import OneSignalStub from './oneSignal.stub';

// Optional import - OneSignal requires native build and won't work in Expo Go
// Check execution environment more comprehensively
const executionEnvironment = Constants.executionEnvironment;
const isExpoGo = executionEnvironment === 'storeClient';
const isBareNative = executionEnvironment === 'bare' || executionEnvironment === 'standalone' || executionEnvironment === undefined;
const isWeb = Platform.OS === 'web';

// IMPORTANT: If you're getting "Unable to resolve react-native-onesignal" error:
// Option 1: Install the package first: npm install react-native-onesignal
// Option 2: Make sure native code is properly linked: npx expo prebuild --clean && npx expo run:android
// Option 3: Comment out the require below and use only the stub (OneSignal features won't work)

// Use a function to lazily load OneSignal
function getOneSignal(): any {
  console.log('🔍 [OneSignal] getOneSignal() called');
  console.log('🔍 [OneSignal] Platform.OS:', Platform.OS);
  console.log('🔍 [OneSignal] executionEnvironment:', executionEnvironment);
  console.log('🔍 [OneSignal] isExpoGo:', isExpoGo, 'isBareNative:', isBareNative, 'isWeb:', isWeb);
  
  // Check NativeModules to see if OneSignal native module exists
  try {
    const nativeModules = Object.keys(NativeModules);
    console.log('🔍 [OneSignal] Available native modules (first 20):', nativeModules.slice(0, 20));
    const hasOneSignalNative = nativeModules.some(name => 
      name.toLowerCase().includes('onesignal') || name.toLowerCase().includes('push')
    );
    console.log('🔍 [OneSignal] OneSignal-related native module found:', hasOneSignalNative);
  } catch (nmError) {
    console.log('⚠️ [OneSignal] Could not check NativeModules:', nmError);
  }
  
  // If in Expo Go or web, don't try to load OneSignal
  if (isExpoGo) {
    console.log('⚠️ [OneSignal] Skipping - Expo Go detected (executionEnvironment: storeClient)');
    console.log('💡 [OneSignal] OneSignal requires a native build. Use: npx expo run:android or EAS build');
    return OneSignalStub;
  }
  
  if (isWeb) {
    console.log('⚠️ [OneSignal] Skipping - Web platform detected');
    return OneSignalStub;
  }

  // Try to load the real OneSignal module (package should be installed)
  try {
    console.log('🔍 [OneSignal] Attempting to require react-native-onesignal...');
    console.log('🔍 [OneSignal] This should work if:');
    console.log('   1. Package is installed: npm install react-native-onesignal');
    console.log('   2. Native code is linked: npx expo prebuild --clean');
    console.log('   3. App is rebuilt: npx expo run:android');
    
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const OneSignalModule = require('react-native-onesignal');
    console.log('📦 [OneSignal] Module loaded! Type:', typeof OneSignalModule);
    console.log('📦 [OneSignal] Module keys:', OneSignalModule ? Object.keys(OneSignalModule).slice(0, 15) : 'null');
    console.log('📦 [OneSignal] Has default export:', !!OneSignalModule.default);
    console.log('📦 [OneSignal] Has named export "OneSignal":', !!OneSignalModule.OneSignal);
    
    // OneSignal SDK v5 uses a named export, not a default export
    // Structure: { OneSignal: { ... }, LogLevel: ..., OSNotification: ..., etc. }
    let OneSignalInstance = null;
    
    if (OneSignalModule.OneSignal) {
      // SDK v5: Use named export
      OneSignalInstance = OneSignalModule.OneSignal;
      console.log('📦 [OneSignal] Using SDK v5 named export: OneSignalModule.OneSignal');
    } else if (OneSignalModule.default) {
      // SDK v4 or older: Use default export
      OneSignalInstance = OneSignalModule.default;
      console.log('📦 [OneSignal] Using default export: OneSignalModule.default');
    } else {
      // Try the module itself
      OneSignalInstance = OneSignalModule;
      console.log('📦 [OneSignal] Using module directly');
    }
    
    console.log('📦 [OneSignal] Instance type:', typeof OneSignalInstance);
    console.log('📦 [OneSignal] Has setAppId?', typeof OneSignalInstance?.setAppId === 'function');
    
    if (OneSignalInstance) {
      const methods = Object.getOwnPropertyNames(OneSignalInstance).filter(name => 
        typeof OneSignalInstance[name] === 'function'
      );
      console.log('📦 [OneSignal] Available methods (first 15):', methods.slice(0, 15));
      
      // Also check for SDK v5 User and Notifications namespaces
      if (OneSignalInstance.User) {
        console.log('📦 [OneSignal] SDK v5 User namespace found:', !!OneSignalInstance.User);
      }
      if (OneSignalInstance.Notifications) {
        console.log('📦 [OneSignal] SDK v5 Notifications namespace found:', !!OneSignalInstance.Notifications);
      }
    }
    
    // Verify it's not the stub by checking if it has the expected methods
    // SDK v5 uses OneSignal.setAppId() or OneSignal.User.pushSubscription
    if (OneSignalInstance && (typeof OneSignalInstance.setAppId === 'function' || OneSignalInstance.User)) {
      console.log('✅ [OneSignal] Real OneSignal instance detected and ready!');
      if (typeof OneSignalInstance.setAppId === 'function') {
        console.log('✅ [OneSignal] Using SDK v4-style API (setAppId available)');
      } else if (OneSignalInstance.User) {
        console.log('✅ [OneSignal] Using SDK v5-style API (User namespace available)');
      }
      return OneSignalInstance;
    } else {
      console.warn('⚠️ [OneSignal] Module loaded but missing expected methods/namespaces.');
      console.warn('⚠️ [OneSignal] Expected: setAppId() function OR User namespace');
      console.warn('⚠️ [OneSignal] Got:', {
        hasSetAppId: typeof OneSignalInstance?.setAppId === 'function',
        hasUser: !!OneSignalInstance?.User,
        hasNotifications: !!OneSignalInstance?.Notifications,
      });
      console.warn('⚠️ [OneSignal] This indicates the JS module loaded but native code may not be linked.');
      console.warn('💡 [OneSignal] Solution:');
      console.warn('   1. Clean build: npx expo prebuild --clean');
      console.warn('   2. Rebuild: npx expo run:android');
      console.warn('   3. Or use EAS build: eas build --platform android');
      return OneSignalStub;
    }
  } catch (error: any) {
    // If module not available, return stub
    console.error('❌ [OneSignal] ERROR loading module:', error?.message || error);
    console.error('❌ [OneSignal] Error code:', error?.code);
    console.error('❌ [OneSignal] Error name:', error?.name);
    if (error?.stack) {
      const stackPreview = error.stack.substring(0, 500);
      console.error('❌ [OneSignal] Stack trace (first 500 chars):', stackPreview);
    }
    
    if (error?.code === 'MODULE_NOT_FOUND' || error?.message?.includes('Unable to resolve')) {
      console.error('💡 [OneSignal] SOLUTION: Module not found error detected.');
      console.error('   1. Install package: npm install react-native-onesignal');
      console.error('   2. Regenerate native code: npx expo prebuild --clean');
      console.error('   3. Rebuild app: npx expo run:android');
    } else if (error?.message?.includes('Native module') || error?.message?.includes('native code')) {
      console.error('💡 [OneSignal] SOLUTION: Native module linking issue.');
      console.error('   The JS package is installed but native code is not linked.');
      console.error('   1. Clean native code: npx expo prebuild --clean --platform android');
      console.error('   2. Rebuild: npx expo run:android');
      console.error('   3. Or rebuild with EAS: eas build --platform android');
    } else {
      console.error('💡 [OneSignal] SOLUTION: Unknown error. Try:');
      console.error('   1. Clean install: rm -rf node_modules && npm install');
      console.error('   2. Clean native: npx expo prebuild --clean');
      console.error('   3. Rebuild: npx expo run:android');
    }
    return OneSignalStub;
  }
}

// Initialize as null, will be loaded lazily when needed
let OneSignal: any = null;

const ONESIGNAL_APP_ID = Constants.expoConfig?.extra?.oneSignalAppId || 'YOUR_ONESIGNAL_APP_ID_HERE';

let isInitialized = false;
let subscriptionListenerAdded = false;
let autoRegisterCallback: (() => void) | null = null;

/**
 * Diagnostic function to check build environment
 */
function diagnoseBuildEnvironment(): void {
  console.log('🔬 [OneSignal] === BUILD ENVIRONMENT DIAGNOSTICS ===');
  console.log('🔬 [OneSignal] Platform.OS:', Platform.OS);
  console.log('🔬 [OneSignal] Constants.executionEnvironment:', executionEnvironment);
  console.log('🔬 [OneSignal] Constants.appOwnership:', Constants.appOwnership);
  console.log('🔬 [OneSignal] Constants.isDevice:', Constants.isDevice);
  console.log('🔬 [OneSignal] Constants.expoConfig?.name:', Constants.expoConfig?.name);
  console.log('🔬 [OneSignal] Constants.expoConfig?.slug:', Constants.expoConfig?.slug);
  
  // Check if we're in a development build vs Expo Go
  const appOwnership = Constants.appOwnership;
  // In a native/development build, appOwnership should not be null and executionEnvironment should not be 'storeClient'
  const isDevelopmentBuild = executionEnvironment !== 'storeClient' && appOwnership !== null;
  console.log('🔬 [OneSignal] Is Development/Native Build:', isDevelopmentBuild);
  
  // Check native modules
  try {
    const nativeModuleNames = Object.keys(NativeModules).sort();
    console.log('🔬 [OneSignal] Total native modules available:', nativeModuleNames.length);
    const pushModules = nativeModuleNames.filter(name => 
      name.toLowerCase().includes('push') || 
      name.toLowerCase().includes('notification') ||
      name.toLowerCase().includes('onesignal')
    );
    if (pushModules.length > 0) {
      console.log('🔬 [OneSignal] Push/Notification related modules:', pushModules);
    } else {
      console.log('🔬 [OneSignal] ⚠️ No push/notification native modules found');
    }
  } catch (e) {
    console.log('🔬 [OneSignal] Could not check native modules:', e);
  }
  
  console.log('🔬 [OneSignal] === END DIAGNOSTICS ===');
}

/**
 * Initialize OneSignal SDK
 * Call this when app starts
 */
export function initializeOneSignal(): void {
  console.log('🚀 [OneSignal] initializeOneSignal() called');
  
  // Run diagnostics first
  diagnoseBuildEnvironment();
  
  // Lazy load OneSignal when first needed
  if (!OneSignal) {
    console.log('🚀 [OneSignal] OneSignal is null, calling getOneSignal()...');
    OneSignal = getOneSignal();
    console.log('🚀 [OneSignal] getOneSignal() returned:', OneSignal ? 'object' : 'null', 'Is stub?', OneSignal === OneSignalStub);
  } else {
    console.log('🚀 [OneSignal] OneSignal already loaded');
  }

  // Check if we got the stub (which means real OneSignal is not available)
  if (OneSignal === OneSignalStub) {
    console.log('');
    console.log('⚠️ [OneSignal] ═══ ONE SIGNAL NOT AVAILABLE ═══');
    console.log('⚠️ [OneSignal] Stub detected - Real OneSignal SDK is not loaded');
    console.log('⚠️ [OneSignal]');
    console.log('⚠️ [OneSignal] Possible reasons:');
    console.log('   1. Running in Expo Go (use development build instead)');
    console.log('   2. Native code not properly linked');
    console.log('   3. react-native-onesignal package not installed');
    console.log('   4. App not rebuilt after installing OneSignal');
    console.log('⚠️ [OneSignal]');
    console.log('⚠️ [OneSignal] REQUIRED STEPS TO FIX:');
    console.log('   1. cd MCQ-Frontend');
    console.log('   2. npm install react-native-onesignal (if not installed)');
    console.log('   3. npx expo prebuild --clean --platform android');
    console.log('   4. npx expo run:android');
    console.log('⚠️ [OneSignal] OR use EAS build:');
    console.log('   1. eas build --platform android --profile development');
    console.log('   2. Install the generated APK');
    console.log('⚠️ [OneSignal] ════════════════════════════════════');
    console.log('');
    return;
  }

  if (isInitialized) {
    console.log('ℹ️ [OneSignal] Already initialized');
    return;
  }

  try {
    // Try to initialize OneSignal - Support both SDK v4 and v5 APIs
    let initialized = false;
    
    // Method 1: Try SDK v5 initialize() method (with options object)
    if (typeof OneSignal.initialize === 'function') {
      try {
        console.log('🔧 [OneSignal] Attempting SDK v5 initialize() with App ID:', ONESIGNAL_APP_ID);
        // SDK v5 might use: OneSignal.initialize({appId: 'xxx'}) or OneSignal.initialize('xxx')
        try {
          OneSignal.initialize({ appId: ONESIGNAL_APP_ID });
          initialized = true;
          console.log('✅ [OneSignal] SDK v5 initialized with options object');
        } catch (e) {
          // Try with string directly
          OneSignal.initialize(ONESIGNAL_APP_ID);
          initialized = true;
          console.log('✅ [OneSignal] SDK v5 initialized with string');
        }
      } catch (initError: any) {
        console.log('⚠️ [OneSignal] initialize() failed, trying setAppId():', initError?.message);
      }
    }
    
    // Method 2: Try SDK v4/v5 setAppId() method (backwards compatible)
    if (!initialized && typeof OneSignal.setAppId === 'function') {
      try {
        console.log('🔧 [OneSignal] Attempting setAppId() with App ID:', ONESIGNAL_APP_ID);
        OneSignal.setAppId(ONESIGNAL_APP_ID);
        initialized = true;
        console.log('✅ [OneSignal] Initialized using setAppId()');
      } catch (setAppIdError: any) {
        console.error('❌ [OneSignal] setAppId() failed:', setAppIdError?.message);
      }
    }
    
    if (!initialized) {
      console.error('❌ [OneSignal] Failed to initialize - neither initialize() nor setAppId() worked');
      console.error('❌ [OneSignal] Available methods:', Object.getOwnPropertyNames(OneSignal)
        .filter(name => typeof OneSignal[name] === 'function')
        .slice(0, 20));
      console.error('❌ [OneSignal] Available properties:', Object.getOwnPropertyNames(OneSignal)
        .filter(name => typeof OneSignal[name] !== 'function')
        .slice(0, 20));
      
      // Don't throw - continue anyway, maybe the SDK initializes itself
      console.warn('⚠️ [OneSignal] Continuing without explicit initialization - SDK might auto-initialize');
      initialized = true; // Mark as initialized to allow other operations
    }
    
    // Verify initialization by checking if App ID was set
    if (initialized) {
      console.log('✅ [OneSignal] Initialization attempt completed');
      // In SDK v5, we can't easily verify if App ID was set, so we'll just continue
    }
    
    // Request permission for push notifications
    // Try SDK v5 API first, then fall back to SDK v4
    if (OneSignal.Notifications && typeof OneSignal.Notifications.requestPermission === 'function') {
      // SDK v5: Use Notifications.requestPermission()
      console.log('📱 [OneSignal] Requesting permissions using SDK v5 API');
      OneSignal.Notifications.requestPermission(true).then((permission: boolean) => {
        console.log('📱 [OneSignal] Permission request result:', permission);
        if (permission) {
          console.log('✅ [OneSignal] User granted push notification permissions');
        } else {
          console.log('❌ [OneSignal] User denied push notification permissions');
        }
      }).catch((error: any) => {
        console.error('❌ [OneSignal] Error requesting permissions:', error);
      });
    } else if (typeof OneSignal.promptForPushNotificationsWithUserResponse === 'function') {
      // SDK v4: Use promptForPushNotificationsWithUserResponse()
      console.log('📱 [OneSignal] Requesting permissions using SDK v4 API');
      OneSignal.promptForPushNotificationsWithUserResponse((response: boolean) => {
        console.log('📱 [OneSignal] Permission prompt response:', response);
        if (response) {
          console.log('✅ [OneSignal] User granted push notification permissions');
        } else {
          console.log('❌ [OneSignal] User denied push notification permissions');
        }
      });
    } else {
      console.warn('⚠️ [OneSignal] No permission request method available - permissions may need to be requested manually');
    }

    // Set up subscription change listener to auto-register when subscription becomes available
    if (!subscriptionListenerAdded) {
      try {
        // SDK v5: Listen for push subscription changes
        if (OneSignal.User?.pushSubscription?.addEventListener) {
          OneSignal.User.pushSubscription.addEventListener('change', async (event: any) => {
            console.log('🔄 [OneSignal] Push subscription changed event received');
            console.log('🔄 [OneSignal] Event object:', event ? Object.keys(event) : 'null');
            
            // In SDK v5, the subscription might be in event.current, event, or we need to access it directly
            let subscriptionId: string | null = null;
            
            try {
              // In SDK v5, subscription change event might not directly provide the ID
              // We need to use async methods to get it
              console.log('🔄 [OneSignal] Subscription change event received, fetching ID using async method...');
              
              // Use async method to get subscription ID
              const pushSubscription = OneSignal.User?.pushSubscription;
              if (pushSubscription) {
                let subscriptionId: string | null = null;
                
                // Try getIdAsync() first
                if (typeof pushSubscription.getIdAsync === 'function') {
                  try {
                    subscriptionId = await pushSubscription.getIdAsync();
                    console.log('✅ [OneSignal] Got subscription ID from getIdAsync() in change event:', subscriptionId);
                  } catch (asyncError: any) {
                    console.log('⚠️ [OneSignal] getIdAsync() failed in change event:', asyncError?.message);
                  }
                }
                
                // Try alternative method if first one didn't work
                if (!subscriptionId && typeof pushSubscription.getPushSubscriptionId === 'function') {
                  try {
                    subscriptionId = await Promise.resolve(pushSubscription.getPushSubscriptionId());
                    console.log('✅ [OneSignal] Got subscription ID from getPushSubscriptionId() in change event:', subscriptionId);
                  } catch (altError: any) {
                    console.log('⚠️ [OneSignal] getPushSubscriptionId() failed in change event:', altError?.message);
                  }
                }
                
                if (subscriptionId && subscriptionId.length > 0) {
                  console.log('✅ [OneSignal] Subscription ID available after change:', subscriptionId);
                  // Auto-register if we have a callback set
                  if (autoRegisterCallback) {
                    console.log('🔄 [OneSignal] Auto-registering device due to subscription change...');
                    autoRegisterCallback();
                  }
                } else {
                  console.log('⚠️ [OneSignal] Subscription changed but ID still not available via async methods. Waiting...');
                  // Wait a bit and try using getPlayerId() which will use async methods
                  setTimeout(async () => {
                    const playerId = await getPlayerId();
                    if (playerId && autoRegisterCallback) {
                      console.log('✅ [OneSignal] Subscription ID became available after delay:', playerId);
                      autoRegisterCallback();
                    }
                  }, 1000);
                }
              } else {
                console.log('⚠️ [OneSignal] PushSubscription not available in change event handler');
              }
            } catch (error: any) {
              console.error('❌ [OneSignal] Error handling subscription change:', error?.message || error);
            }
          });
          subscriptionListenerAdded = true;
          console.log('✅ [OneSignal] Push subscription change listener added');
          
          // Check if subscription is already available (in case subscription was ready before listener was added)
          setTimeout(async () => {
            try {
              const currentSubscription = OneSignal.User?.pushSubscription;
              console.log('🔍 [OneSignal] Checking initial subscription state...');
              
              if (currentSubscription) {
                // Use async method to get ID
                let subscriptionId: string | null = null;
                
                if (typeof currentSubscription.getIdAsync === 'function') {
                  try {
                    subscriptionId = await currentSubscription.getIdAsync();
                    console.log('✅ [OneSignal] Initial subscription ID from getIdAsync():', subscriptionId);
                  } catch (error: any) {
                    console.log('⚠️ [OneSignal] getIdAsync() failed for initial check:', error?.message);
                  }
                }
                
                if (subscriptionId && subscriptionId.length > 0 && autoRegisterCallback) {
                  console.log('✅ [OneSignal] Subscription already available, triggering auto-register...');
                  autoRegisterCallback();
                } else {
                  console.log('⏳ [OneSignal] Subscription not yet available, will wait for change event');
                }
              } else {
                console.log('⏳ [OneSignal] PushSubscription not available yet');
              }
            } catch (error: any) {
              console.error('❌ [OneSignal] Error checking initial subscription:', error?.message || error);
            }
          }, 1000);
        } else if (OneSignal.Notifications?.addEventListener) {
          // Alternative: Listen for notification permission changes
          OneSignal.Notifications.addEventListener('permissionChanged', async (event: any) => {
            console.log('🔄 [OneSignal] Permission changed:', event);
            // Check for subscription ID after permission change
            setTimeout(async () => {
              const playerId = await getPlayerId();
              if (playerId && autoRegisterCallback) {
                console.log('🔄 [OneSignal] Auto-registering device after permission change...');
                autoRegisterCallback();
              }
            }, 1000);
          });
          subscriptionListenerAdded = true;
          console.log('✅ [OneSignal] Permission change listener added');
        }
      } catch (listenerError: any) {
        console.warn('⚠️ [OneSignal] Could not add subscription listener:', listenerError?.message || listenerError);
        // Continue anyway - we can still try to get player ID manually
      }
    }

    // Set up notification handlers - Support both SDK v4 and v5
    if (OneSignal.Notifications && typeof OneSignal.Notifications.addEventListener === 'function') {
      // SDK v5: Use Notifications.addEventListener
      console.log('📬 [OneSignal] Setting up SDK v5 notification handlers');
      OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
        console.log('📬 [OneSignal] Notification will show in foreground (SDK v5):', event);
        // Event already contains the notification
        const notification = event.notification;
        console.log('📬 [OneSignal] Notification details:', notification);
        // Call preventDefault() to prevent showing, or do nothing to show it
        // event.preventDefault(); // Uncomment to prevent showing
      });
    } else if (typeof OneSignal.setNotificationWillShowInForegroundHandler === 'function') {
      // SDK v4: Use setNotificationWillShowInForegroundHandler
      console.log('📬 [OneSignal] Setting up SDK v4 notification handlers');
      OneSignal.setNotificationWillShowInForegroundHandler((notificationReceivedEvent: any) => {
        console.log('📬 [OneSignal] Notification will show in foreground (SDK v4):', notificationReceivedEvent);
        const notification = notificationReceivedEvent.getNotification();
        console.log('📬 [OneSignal] Notification details:', notification);
        // Complete with notification means it will show
        notificationReceivedEvent.complete(notification);
      });
    } else {
      console.warn('⚠️ [OneSignal] Could not set up foreground notification handler - method not found');
    }

    // Note: Notification opened handler is set separately via setNotificationOpenedHandler
    // to allow custom navigation handling

    isInitialized = true;
    console.log('✅ [OneSignal] Initialized successfully');
    
    // Check if subscription is already available (user might have granted permission before)
    // Also poll for subscription ID periodically as it might take time to generate
    let pollCount = 0;
    const maxPolls = 10; // Poll for up to 20 seconds (10 * 2s)
    
    const pollForSubscription = async () => {
      pollCount++;
      try {
        // Try to get player ID using async methods
        const playerId = await getPlayerId();
        
        if (playerId && playerId.length > 0) {
          console.log(`✅ [OneSignal] Subscription ID available after ${pollCount * 2}s:`, playerId);
          if (autoRegisterCallback) {
            console.log('🔄 [OneSignal] Auto-registering device (subscription available)...');
            autoRegisterCallback();
          }
          return true; // Found it, stop polling
        } else {
          // Also try direct async call as fallback
          const pushSubscription = OneSignal.User?.pushSubscription;
          if (pushSubscription && typeof pushSubscription.getIdAsync === 'function') {
            try {
              const directId = await pushSubscription.getIdAsync();
              if (directId && directId.length > 0) {
                console.log(`✅ [OneSignal] Got subscription ID via direct getIdAsync() after ${pollCount * 2}s:`, directId);
                if (autoRegisterCallback) {
                  autoRegisterCallback();
                }
                return true;
              }
            } catch (directError: any) {
              // Ignore and continue with normal polling
            }
          }
          
          if (pollCount < maxPolls) {
            console.log(`⏳ [OneSignal] Subscription ID not yet available (poll ${pollCount}/${maxPolls}). Will check again in 2s...`);
            setTimeout(pollForSubscription, 2000);
          } else {
            console.log('⚠️ [OneSignal] Subscription ID still not available after', maxPolls * 2, 'seconds');
            console.log('⚠️ [OneSignal] Will wait for subscription change event instead');
          }
          return false;
        }
      } catch (error: any) {
        console.error('❌ [OneSignal] Error polling for subscription:', error?.message || error);
        if (pollCount < maxPolls) {
          setTimeout(pollForSubscription, 2000);
        }
        return false;
      }
    };
    
    // Start polling after a short delay
    setTimeout(pollForSubscription, 2000);
  } catch (error: any) {
    console.error('❌ [OneSignal] Failed to initialize OneSignal:', error?.message || error);
    isInitialized = false;
  }
}

/**
 * Get the current user's OneSignal player ID (device ID / subscription ID)
 * @returns Promise<string | null> - Player ID or null if not available
 */
export async function getPlayerId(): Promise<string | null> {
  // Lazy load OneSignal when first needed
  if (!OneSignal) {
    OneSignal = getOneSignal();
  }

  // Check if we got the stub
  if (OneSignal === OneSignalStub) {
    console.log('⚠️ [OneSignal] Stub detected - OneSignal not available, cannot get player ID');
    return null;
  }

  try {
    // Check if OneSignal is initialized
    if (!isInitialized) {
      console.log('⚠️ [OneSignal] Not initialized yet, cannot get player ID');
      return null;
    }
    
    console.log('🔍 [OneSignal] Attempting to get player ID...');
    
    // Method 1: Try OneSignal.User.pushSubscription async methods (SDK v5)
    try {
      if (OneSignal.User?.pushSubscription) {
        const pushSubscription = OneSignal.User.pushSubscription;
        console.log('🔍 [OneSignal] PushSubscription object exists, checking available methods...');
        
        // SDK v5 uses async methods: getIdAsync() or getPushSubscriptionId()
        if (typeof pushSubscription.getIdAsync === 'function') {
          try {
            console.log('🔍 [OneSignal] Using getIdAsync() method...');
            const subscriptionId = await pushSubscription.getIdAsync();
            if (subscriptionId && typeof subscriptionId === 'string' && subscriptionId.length > 0) {
              console.log('✅ [OneSignal] Got subscription ID from getIdAsync():', subscriptionId);
              return subscriptionId;
            } else {
              console.log('⚠️ [OneSignal] getIdAsync() returned empty/null:', subscriptionId);
            }
          } catch (asyncError: any) {
            console.log('⚠️ [OneSignal] getIdAsync() failed:', asyncError?.message || asyncError);
          }
        }
        
        // Try alternative async method
        if (typeof pushSubscription.getPushSubscriptionId === 'function') {
          try {
            console.log('🔍 [OneSignal] Using getPushSubscriptionId() method...');
            const subscriptionId = await Promise.resolve(pushSubscription.getPushSubscriptionId());
            if (subscriptionId && typeof subscriptionId === 'string' && subscriptionId.length > 0) {
              console.log('✅ [OneSignal] Got subscription ID from getPushSubscriptionId():', subscriptionId);
              return subscriptionId;
            }
          } catch (altError: any) {
            console.log('⚠️ [OneSignal] getPushSubscriptionId() failed:', altError?.message || altError);
          }
        }
        
        // Fallback: Try direct property access (might work in some cases)
        const directId = (pushSubscription as any).id || (pushSubscription as any).subscriptionId;
        if (directId && typeof directId === 'string' && directId.length > 0) {
          console.log('✅ [OneSignal] Got subscription ID from direct property access:', directId);
          return directId;
        }
        
        console.log('⚠️ [OneSignal] PushSubscription exists but async methods returned no ID');
      } else {
        console.log('⚠️ [OneSignal] User.pushSubscription not available:', {
          hasUser: !!OneSignal.User,
          hasPushSubscription: !!OneSignal.User?.pushSubscription,
        });
      }
    } catch (error: any) {
      console.log('⚠️ [OneSignal] Error accessing User.pushSubscription:', error?.message || error);
    }
    
    // Method 2: Try getDeviceState() which should return userId (subscription ID)
    try {
      let deviceState: any = null;
      
      // Try as async function first
      if (typeof OneSignal.getDeviceState === 'function') {
        const result = OneSignal.getDeviceState();
        deviceState = await Promise.resolve(result);
      }
      
      if (deviceState) {
        // In SDK v5, the subscription ID is typically in userId field
        const subscriptionId = deviceState.userId || deviceState.pushSubscriptionId || deviceState.id;
        if (subscriptionId) {
          console.log('✅ [OneSignal] Got subscription ID from getDeviceState:', subscriptionId);
          return subscriptionId;
        }
        console.log('⚠️ [OneSignal] getDeviceState returned but no userId found. State:', JSON.stringify(deviceState).substring(0, 200));
      }
    } catch (deviceStateError: any) {
      console.log('⚠️ [OneSignal] getDeviceState failed:', deviceStateError?.message || deviceStateError);
    }
    
    // Method 3: Try getUserId() if available (older SDK versions)
    try {
      if (typeof OneSignal.getUserId === 'function') {
        const userId = await Promise.resolve(OneSignal.getUserId());
        if (userId) {
          console.log('✅ [OneSignal] Got user ID from getUserId():', userId);
          return userId;
        }
      }
    } catch (getUserIdError: any) {
      console.log('⚠️ [OneSignal] getUserId() failed:', getUserIdError?.message || getUserIdError);
    }
    
    // Method 4: Try accessing pushSubscription directly if available
    try {
      if (OneSignal.pushSubscription?.id) {
        const subscriptionId = OneSignal.pushSubscription.id;
        console.log('✅ [OneSignal] Got subscription ID from pushSubscription.id:', subscriptionId);
        return subscriptionId;
      }
    } catch (error) {
      console.log('⚠️ [OneSignal] pushSubscription.id not available:', error);
    }
    
    console.log('❌ [OneSignal] All methods failed to get player ID. OneSignal may not be fully initialized or subscription not ready yet.');
    return null;
  } catch (error: any) {
    console.error('❌ [OneSignal] Failed to get OneSignal player ID:', error?.message || error);
    return null;
  }
}

/**
 * Register device with backend
 * Call this after user logs in
 * Will retry up to 5 times if OneSignal isn't ready yet
 * Also sets up auto-registration when subscription becomes available
 */
export async function registerDeviceWithBackend(retryCount = 0): Promise<boolean> {
  const maxRetries = 5;
  const retryDelay = 3000; // 3 seconds - increased to give OneSignal more time

  try {
    // Ensure OneSignal is initialized
    if (!OneSignal) {
      OneSignal = getOneSignal();
    }

    if (OneSignal === OneSignalStub) {
      console.log('⚠️ [DEVICE REGISTRATION] OneSignal not available - requires native build');
      return false;
    }

    if (!isInitialized) {
      if (retryCount < maxRetries) {
        console.log(`⏳ [DEVICE REGISTRATION] OneSignal not initialized yet. Retrying in ${retryDelay}ms... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return registerDeviceWithBackend(retryCount + 1);
      }
      console.log('❌ [DEVICE REGISTRATION] OneSignal not initialized after retries');
      return false;
    }

    // Set up auto-register callback for when subscription becomes available
    if (!autoRegisterCallback) {
      autoRegisterCallback = async () => {
        try {
          const playerId = await getPlayerId();
          if (playerId) {
            console.log('🔄 [DEVICE REGISTRATION] Auto-registering device with player ID:', playerId);
            const success = await registerDevice(playerId);
            if (success) {
              console.log('✅ [DEVICE REGISTRATION] Auto-registration successful');
            } else {
              console.log('⚠️ [DEVICE REGISTRATION] Auto-registration failed');
            }
          }
        } catch (error) {
          console.error('❌ [DEVICE REGISTRATION] Auto-registration error:', error);
        }
      };
      console.log('✅ [DEVICE REGISTRATION] Auto-register callback set up');
    }

    // Try to get player ID
    const playerId = await getPlayerId();
    
    if (!playerId) {
      if (retryCount < maxRetries) {
        console.log(`⏳ [DEVICE REGISTRATION] No player ID available yet. Subscription may not be ready. Retrying in ${retryDelay}ms... (${retryCount + 1}/${maxRetries})`);
        console.log(`ℹ️ [DEVICE REGISTRATION] Device will auto-register when subscription becomes available via listener`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return registerDeviceWithBackend(retryCount + 1);
      }
      console.log('⚠️ [DEVICE REGISTRATION] No player ID available after retries.');
      console.log('ℹ️ [DEVICE REGISTRATION] Device will auto-register when subscription becomes available (if listener is active)');
      // Don't return false - the listener will handle it when subscription is ready
      return false;
    }

    console.log('📝 [DEVICE REGISTRATION] Registering device with backend, player ID:', playerId);
    const success = await registerDevice(playerId);
    
    if (success) {
      console.log('✅ [DEVICE REGISTRATION] Device registered successfully with backend');
      // Clear auto-register callback after successful registration
      autoRegisterCallback = null;
    } else {
      console.log('⚠️ [DEVICE REGISTRATION] Failed to register device with backend. API call returned false.');
      // Keep callback active to retry later
    }
    
    return success;
  } catch (error: any) {
    console.error('❌ [DEVICE REGISTRATION] Error registering device with backend:', error?.message || error);
    
    if (retryCount < maxRetries) {
      const shouldRetry = error instanceof Error && (
        error.message.includes('not initialized') ||
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.message.includes('Failed to fetch')
      );
      
      if (shouldRetry) {
        console.log(`🔄 [DEVICE REGISTRATION] Retrying device registration... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return registerDeviceWithBackend(retryCount + 1);
      }
    }
    
    return false;
  }
}

/**
 * Set user ID for OneSignal (for targeting)
 * @param userId - User ID from backend
 */
export function setOneSignalUserId(userId: string): void {
  // Lazy load OneSignal when first needed
  if (!OneSignal) {
    OneSignal = getOneSignal();
  }

  // Check if we got the stub
  if (OneSignal === OneSignalStub) {
    console.log('OneSignal not available - cannot set user ID');
    return;
  }

  try {
    // SDK v5: Use login() method instead of setExternalUserId()
    // Try SDK v5 API first
    if (OneSignal.User && typeof OneSignal.User.addAlias === 'function') {
      // SDK v5: Add alias for user identification
      OneSignal.User.addAlias('userId', userId);
      console.log('✅ [OneSignal] User alias added (SDK v5):', userId);
    } else if (OneSignal.User && typeof OneSignal.login === 'function') {
      // SDK v5: Login with external user ID
      OneSignal.login(userId);
      console.log('✅ [OneSignal] User logged in (SDK v5):', userId);
    } else if (typeof OneSignal.setExternalUserId === 'function') {
      // SDK v4: Use setExternalUserId()
      OneSignal.setExternalUserId(userId);
      console.log('✅ [OneSignal] External user ID set (SDK v4):', userId);
    } else {
      console.warn('⚠️ [OneSignal] No method found to set user ID. Available methods:', 
        Object.getOwnPropertyNames(OneSignal).filter(name => typeof OneSignal[name] === 'function').slice(0, 10));
      console.warn('⚠️ [OneSignal] SDK v5 might use: User.addAlias() or User.login()');
    }
  } catch (error: any) {
    console.error('❌ [OneSignal] Failed to set OneSignal user ID:', error?.message || error);
  }
}

/**
 * Remove user ID from OneSignal (on logout)
 */
export function removeOneSignalUserId(): void {
  // Lazy load OneSignal when first needed
  if (!OneSignal) {
    OneSignal = getOneSignal();
  }

  // Check if we got the stub
  if (OneSignal === OneSignalStub) {
    console.log('OneSignal not available - cannot remove user ID');
    return;
  }

  try {
    // SDK v5: Use logout() method instead of removeExternalUserId()
    if (OneSignal.User && typeof OneSignal.User.logout === 'function') {
      // SDK v5: Logout user
      OneSignal.User.logout();
      console.log('✅ [OneSignal] User logged out (SDK v5)');
    } else if (typeof OneSignal.removeExternalUserId === 'function') {
      // SDK v4: Use removeExternalUserId()
      OneSignal.removeExternalUserId();
      console.log('✅ [OneSignal] External user ID removed (SDK v4)');
    } else {
      console.warn('⚠️ [OneSignal] No method found to remove user ID');
    }
  } catch (error: any) {
    console.error('❌ [OneSignal] Failed to remove OneSignal user ID:', error?.message || error);
  }
}

/**
 * Set up notification opened handler for navigation
 * @param navigationHandler - Function to handle navigation when notification is opened
 */
export function setNotificationOpenedHandler(
  navigationHandler: (notificationId?: string) => void
): void {
  // Lazy load OneSignal when first needed
  if (!OneSignal) {
    OneSignal = getOneSignal();
  }

  // Check if we got the stub
  if (OneSignal === OneSignalStub) {
    console.log('OneSignal not available - cannot set notification opened handler');
    return;
  }

  try {
    OneSignal.setNotificationOpenedHandler((notification: any) => {
      console.log('OneSignal: notification opened:', notification);
      const additionalData = notification.notification.additionalData;
      const notificationId = additionalData?.notificationId || null;
      navigationHandler(notificationId || undefined);
    });
  } catch (error) {
    console.error('Failed to set notification opened handler:', error);
  }
}
