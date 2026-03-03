import { DefaultTheme, NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState, useRef } from 'react';
import Constants from 'expo-constants';
import { AppState, AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ============================================
 * UPDATE FUNCTIONALITY TEMPORARILY DISABLED
 * Update facility commented out for launch.
 * Will be re-enabled after launch.
 * ============================================ */

// const UPDATE_INITIATED_KEY = '@update_initiated';
// const UPDATE_VERSION_KEY = '@update_version';

import { usePreventScreenCapture } from 'expo-screen-capture';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import type { AppStackParamList, AuthStackParamList } from './src/navigation/types';
import ChapterDetailScreen from './src/screens/ChapterDetailScreen';
import ChaptersScreen from './src/screens/ChaptersScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import OTPLoginScreen from './src/screens/OTPLoginScreen';
import QuestionsScreen from './src/screens/QuestionsScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import StatsScreen from './src/screens/StatsScreen';
import TestsScreen from './src/screens/TestsScreen';
import CBTSimulatorScreen from './src/screens/CBTSimulatorScreen';
import TestResultsScreen from './src/screens/TestResultsScreen';
import PracticeByYearScreen from './src/screens/PracticeByYearScreen';
import GroupSelectionScreen from './src/screens/GroupSelectionScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import PremiumPurchaseScreen from './src/screens/PremiumPurchaseScreen';
import SavedQuestionsScreen from './src/screens/SavedQuestionsScreen';
import SavedQuestionsChaptersScreen from './src/screens/SavedQuestionsChaptersScreen';
import SavedQuestionsListScreen from './src/screens/SavedQuestionsListScreen';
import MockTestSelectionScreen from './src/screens/MockTestSelectionScreen';
import MockTestLeaderboardSelectionScreen from './src/screens/MockTestLeaderboardSelectionScreen';
import MockTestLeaderboardScreen from './src/screens/MockTestLeaderboardScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import NotificationDetailScreen from './src/screens/NotificationDetailScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import BottomTabBar from './src/components/ui/BottomTabBar';
// React Native Code - Update Required Modal and version check service commented out
// import UpdateRequiredModal from './src/components/UpdateRequiredModal';
// import { getAppVersion, isVersionOutdated } from './src/services/appVersion.service';
import { initializeOneSignal, setNotificationOpenedHandler, registerDeviceWithBackend, setOneSignalUserId, removeOneSignalUserId } from './src/services/oneSignal.service';
import { colors, typography } from './src/theme';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
    text: colors.text,
    primary: colors.primary,
  },
};

const appStackScreenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: {
    color: colors.text,
    fontSize: typography.subtitle.fontSize,
    fontWeight: typography.subtitle.fontWeight,
  },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  
};

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator
      initialRouteName="OTPLogin"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 300,
      }}
    >
      <AuthStack.Screen name="OTPLogin" component={OTPLoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ClassLogin" component={require('./src/screens/ClassLoginScreen').default} />
    </AuthStack.Navigator>
  );
}

// Tab Navigator for main screens
function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        sceneStyle: {  paddingBottom: 0, marginBottom: 0 },
        tabBarStyle: { paddingTop: 0, marginTop: 0, height: 56 },
        tabBarItemStyle: { paddingVertical: 0 },
      }}
      
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Chapters" component={ChaptersScreen} />
      <Tab.Screen name="Tests" component={TestsScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
    </Tab.Navigator>
  );
}

// Main App Stack Navigator - wraps tabs and handles detail screens
function AppStackNavigator() {
  const { user } = useAuth();
  
  return (
    <AppStack.Navigator
      initialRouteName={user?.group ? 'MainTabs' : 'GroupSelection'}
      screenOptions={{
        ...appStackScreenOptions,
        animation: 'fade',
        animationDuration: 400,
      }}
    >
      {/* Group Selection Screen - shown if user hasn't selected a group */}
      <AppStack.Screen
        name="GroupSelection"
        component={GroupSelectionScreen}
        options={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 300,
        }}
      />
      
      {/* Main tabs */}
      <AppStack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{
          
          headerShown: false,
          animation: 'fade',
          animationDuration: 400,
          
        }}
      />
      
      {/* Detail screens */}
      <AppStack.Screen
        name="ChapterDetail"
        component={ChapterDetailScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <AppStack.Screen
        name="PracticeByYear"
        component={PracticeByYearScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <AppStack.Screen
        name="Questions"
        component={QuestionsScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <AppStack.Screen
        name="CBT"
        component={CBTSimulatorScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <AppStack.Screen
        name="TestResults"
        component={TestResultsScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <AppStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <AppStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <AppStack.Screen
        name="PremiumPurchase"
        component={PremiumPurchaseScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <AppStack.Screen
        name="SavedQuestions"
        component={SavedQuestionsScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <AppStack.Screen
        name="SavedQuestionsChapters"
        component={SavedQuestionsChaptersScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <AppStack.Screen
        name="SavedQuestionsList"
        component={SavedQuestionsListScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <AppStack.Screen
        name="MockTestSelection"
        component={MockTestSelectionScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <AppStack.Screen
        name="MockTestLeaderboardSelection"
        component={MockTestLeaderboardSelectionScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <AppStack.Screen
        name="MockTestLeaderboard"
        component={MockTestLeaderboardScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <AppStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <AppStack.Screen
        name="NotificationDetail"
        component={NotificationDetailScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <AppStack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
    </AppStack.Navigator>
  );
}

// Prevents screenshots and screen recording when mounted (e.g. chapters, mock tests).
// Keeps app content from being captured and leaked.
function ScreenCaptureBlocker() {
  usePreventScreenCapture();
  return null;
}

function RootNavigator() {
  const { user, initializing } = useAuth();
  
  // Show loading screen while checking AsyncStorage for auth state
  if (initializing) {
    return null; // Or you can return a loading component here
  }
  
  if (!user) {
    return <AuthStackNavigator />;
  }
  
  // Block screenshots/recording app-wide for authenticated users (chapters, mock tests, etc.)
  return (
    <>
      <ScreenCaptureBlocker />
      <AppStackNavigator />
    </>
  );
}

function AppWithVersionCheck() {
  // React Native Code - Update functionality state variables commented out
  /* COMMENTED OUT UPDATE FUNCTIONALITY - START
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('A new version of the app is available. Please update to continue.');
  const [playStoreUrl, setPlayStoreUrl] = useState('');
  const [updateUrl, setUpdateUrl] = useState('');
  const [requiredVersion, setRequiredVersion] = useState('');
  const [requiredVersionCode, setRequiredVersionCode] = useState<number | undefined>(undefined);
  const [currentVersion, setCurrentVersion] = useState('');
  const [currentVersionCode, setCurrentVersionCode] = useState<number | undefined>(undefined);
  */
  const appState = useRef(AppState.currentState);
  const navigationRef = useRef<NavigationContainerRef<AppStackParamList>>(null);

  // React Native Code - checkAppVersion function with API calls commented out
  /* COMMENTED OUT - Version check functionality
  const checkAppVersion = async () => {
    try {
      // Get current app version from expo-constants
      const currentVer = Constants.expoConfig?.version || '1.0.0';
      const currentVerCode = Platform.OS === 'android' 
        ? Constants.expoConfig?.android?.versionCode 
        : undefined;
      
      setCurrentVersion(currentVer);
      setCurrentVersionCode(currentVerCode);
      
      console.log('📱 [VERSION CHECK] Current app version:', currentVer);

      // Check if user has already initiated update for a specific version
      const updateInitiated = await AsyncStorage.getItem(UPDATE_INITIATED_KEY);
      const lastUpdateVersion = await AsyncStorage.getItem(UPDATE_VERSION_KEY);
      
      // Fetch required version from backend
      const versionResponse = await getAppVersion();
      
      if (versionResponse.success && versionResponse.data.isUpdateRequired) {
        const { requiredVersion: reqVersion, requiredVersionCode, updateMessage: msg, playStoreUrl: url, updateUrl: update } = versionResponse.data;
        
        // Get current versionCode for Android
        const currentVersionCode = Platform.OS === 'android' 
          ? Constants.expoConfig?.android?.versionCode 
          : undefined;
        
        console.log('📱 [VERSION CHECK] Required version:', reqVersion);
        console.log('📱 [VERSION CHECK] Required versionCode:', requiredVersionCode);
        console.log('📱 [VERSION CHECK] Current versionCode:', currentVersionCode);
        console.log('📱 [VERSION CHECK] Update required:', versionResponse.data.isUpdateRequired);
        console.log('📱 [VERSION CHECK] Update URL:', update);
        console.log('📱 [VERSION CHECK] Play Store URL:', url);
        console.log('📱 [VERSION CHECK] Update already initiated:', updateInitiated);
        console.log('📱 [VERSION CHECK] Last update version:', lastUpdateVersion);

        // Check if current version is outdated (using both version string and versionCode)
        if (isVersionOutdated(currentVer, reqVersion, currentVerCode, requiredVersionCode)) {
          // Only show modal if:
          // 1. Update was not initiated yet, OR
          // 2. A new version requirement was set (different from the one user already initiated)
          if (!updateInitiated || lastUpdateVersion !== reqVersion) {
            console.log('⚠️ [VERSION CHECK] App version is outdated. Showing update modal.');
            setUpdateMessage(msg);
            setPlayStoreUrl(url || '');
            setUpdateUrl(update || '');
            setRequiredVersion(reqVersion);
            setRequiredVersionCode(requiredVersionCode);
            setShowUpdateModal(true);
          } else {
            console.log('ℹ️ [VERSION CHECK] Update already initiated for this version. Modal not shown.');
            setShowUpdateModal(false);
          }
        } else {
          console.log('✅ [VERSION CHECK] App version is up to date.');
          // Clear update initiated flag if version is now up to date
          await AsyncStorage.removeItem(UPDATE_INITIATED_KEY);
          await AsyncStorage.removeItem(UPDATE_VERSION_KEY);
          setShowUpdateModal(false);
        }
      } else {
        // No update required, clear flags and hide modal
        await AsyncStorage.removeItem(UPDATE_INITIATED_KEY);
        await AsyncStorage.removeItem(UPDATE_VERSION_KEY);
        setShowUpdateModal(false);
      }
    } catch (error) {
      console.error('❌ [VERSION CHECK] Failed to check app version:', error);
      // Don't block app usage if version check fails, but keep modal if already shown
    }
  };
  COMMENTED OUT - Version check functionality - END */

  useEffect(() => {
    // Initialize OneSignal when app starts
    try {
      initializeOneSignal();
      
      // Set up notification opened handler for navigation
      setNotificationOpenedHandler((notificationId?: string) => {
        // Use a small delay to ensure navigation is ready
        setTimeout(() => {
          if (notificationId && navigationRef.current?.isReady()) {
            navigationRef.current.navigate('NotificationDetail', { notificationId });
          } else if (navigationRef.current?.isReady()) {
            navigationRef.current.navigate('Notifications');
          }
        }, 500);
      });
    } catch (error) {
      console.error('Failed to initialize OneSignal:', error);
    }

    // React Native Code - Version check calls commented out
    /* COMMENTED OUT - Version check on app start
    // Check version after a short delay to ensure app is initialized
    const timer = setTimeout(() => {
      checkAppVersion();
    }, 1000);

    // Listen for app state changes to recheck version when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('📱 [VERSION CHECK] App has come to the foreground, rechecking version...');
        // Recheck version when app comes to foreground
        // This ensures that if user updates the app and reopens, the check will run again
        checkAppVersion();
      }

      appState.current = nextAppState;
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
    */
  }, []);

  return (
    <>
      <NavigationContainer theme={navigationTheme} ref={navigationRef}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </NavigationContainer>
      {/* React Native Code - UpdateRequiredModal component commented out
      <UpdateRequiredModal
        visible={showUpdateModal}
        updateMessage={updateMessage}
        playStoreUrl={playStoreUrl}
        updateUrl={updateUrl}
        requiredVersion={requiredVersion}
        requiredVersionCode={requiredVersionCode}
        currentVersion={currentVersion}
        currentVersionCode={currentVersionCode}
        onUpdate={() => {
          // Close the modal when update button is clicked
          setShowUpdateModal(false);
        }}
      />
      */}
    </>
  );
}

export default function App() {
  return <AppWithVersionCheck />;
}
