import { DefaultTheme, NavigationContainer, NavigationContainerRef, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState, useRef } from 'react';
import Constants from 'expo-constants';
import { AppState, AppStateStatus, Platform, Modal, StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

/* ============================================
 * UPDATE FUNCTIONALITY TEMPORARILY DISABLED
 * Update facility commented out for launch.
 * Will be re-enabled after launch.
 * ============================================ */

// const UPDATE_INITIATED_KEY = '@update_initiated';
// const UPDATE_VERSION_KEY = '@update_version';

import { usePreventScreenCapture } from 'expo-screen-capture';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import type { AppStackParamList, AuthStackParamList, TabParamList } from './src/navigation/types';
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

const UPGRADE_POPUP_KEY_PREFIX = '@mcq_free_upgrade_popup_shown_';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

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

type AppStackNavigation = NativeStackNavigationProp<AppStackParamList>;

interface FreeUserUpgradePopupProps {
  visible: boolean;
  onClose: () => void;
}

function FreeUserUpgradePopup({ visible, onClose }: FreeUserUpgradePopupProps) {
  const navigation = useNavigation<AppStackNavigation>();

  const handleUpgrade = () => {
    onClose();
    navigation.navigate('PremiumPurchase');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.popupContainer}>
          <ScrollView contentContainerStyle={styles.popupScroll} bounces={false}>


            <Text style={styles.popupTitle}>
              <Text style={{ color: '#0EA5E9' }}>Welcome to </Text>
              <Text style={{ color: '#0EA5E9' }}>MHT CET 2026: </Text>
              <Text style={{ color: '#F97316' }}>PYQ & Mock Tests</Text>
            </Text>

            <View style={styles.featureCard}>
              <View style={styles.featureHeader}>
                <Text style={styles.featureTag}>20+ YEARS OF PYQs</Text>
              </View>
              <Text style={styles.featureBody}>
                Access 10,000+ chapter-wise PYQs (2004–2025). Your gold mine for exam mastery.
              </Text>
            </View>

            <View style={styles.featureCardPurple}>
              <View style={styles.featureHeader}>
                <Text style={styles.featureTag}>YOUR PERSONAL AI TUTOR</Text>
              </View>
              <Text style={styles.featureBody}>
                Get instant, step-by-step AI solutions for every question. Clarity, 24×7.
              </Text>
            </View>

            <View style={styles.featureCardBlue}>
              <View style={styles.featureHeader}>
                <Text style={styles.featureTag}>FULL-LENGTH MOCK TESTS</Text>
              </View>
              <Text style={styles.featureBody}>
                10 exam-like simulators. Track speed, accuracy, and rank against thousands.
              </Text>
            </View>

            <TouchableOpacity activeOpacity={0.9} style={styles.primaryCta} onPress={handleUpgrade}>
              <Text style={styles.primaryCtaText}>LET&apos;S GET THE TOP PERCENTILE!</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} onPress={onClose}>
              <Text style={styles.secondaryCtaText}>Maybe Later</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

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
        sceneStyle: { paddingBottom: 0, marginBottom: 0 },
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
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const popupShownRef = useRef(false);

  useEffect(() => {
    if (!user || user.subscription === 'premium') {
      setShowUpgradePopup(false);
      return;
    }

    if (!popupShownRef.current) {
      setShowUpgradePopup(true);
      popupShownRef.current = true;
    }
  }, [user]);

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
      <FreeUserUpgradePopup
        visible={showUpgradePopup}
        onClose={() => setShowUpgradePopup(false)}
      />
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  popupContainer: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  popupScroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  popupTitle: {
    ...typography.h3,
    textAlign: 'center',
    color: colors.text,
    fontWeight: '800',
    marginBottom: 20,
    fontSize: 20,
  },
  featureCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#F97316',
  },
  featureCardPurple: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#4F46E5',
  },
  featureCardBlue: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#0EA5E9',
  },
  featureHeader: {
    marginBottom: 6,
  },
  featureTag: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.8,
    fontSize: 11,
  },
  featureBody: {
    ...typography.body,
    color: '#FFF7ED',
    fontSize: 13,
    lineHeight: 18,
  },
  primaryCta: {
    borderRadius: 999,
    backgroundColor: '#F97316',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryCtaText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.7,
  },
  secondaryCtaText: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.text,
    fontSize: 13,
    marginTop: 4,
  },
});
