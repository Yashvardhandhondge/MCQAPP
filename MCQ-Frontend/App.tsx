import { DefaultTheme, NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState, useRef } from 'react';
import Constants from 'expo-constants';
import { AppState, AppStateStatus, Platform, Modal, StyleSheet, View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const UPDATE_INITIATED_KEY = '@update_initiated';
const UPDATE_VERSION_KEY = '@update_version';

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
import PyqMockTestSelectionScreen from './src/screens/PyqMockTestSelectionScreen';
import UpdateRequiredModal from './src/components/UpdateRequiredModal';
import { getAppVersion, isVersionOutdated } from './src/services/appVersion.service';
import { setUnauthorizedHandler } from './src/services/http';
import { initializeOneSignal, setNotificationOpenedHandler, registerDeviceWithBackend, setOneSignalUserId, removeOneSignalUserId } from './src/services/oneSignal.service';
import { colors, typography } from './src/theme';
import BannerImage from './assets/images/Banner.png';

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
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.popupContainer}>
          <TouchableOpacity activeOpacity={0.7} style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <Image source={BannerImage} style={styles.bannerImage} resizeMode="cover" />
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
        name="PyqMockTestSelection"
        component={PyqMockTestSelectionScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <AppStack.Screen
        name="PyqMockTestInstructions"
        component={require('./src/screens/PyqMockTestInstructionsScreen').default}
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

function AuthAwareRoot() {
  const { logout } = useAuth();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [logout]);

  return <RootNavigator />;
}

function AppWithVersionCheck() {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('A new version of the app is available. Please update to continue.');
  const [playStoreUrl, setPlayStoreUrl] = useState('');
  const [updateUrl, setUpdateUrl] = useState('');
  const [requiredVersion, setRequiredVersion] = useState('');
  const [requiredVersionCode, setRequiredVersionCode] = useState<number | undefined>(undefined);
  const [currentVersion, setCurrentVersion] = useState('');
  const [currentVersionCode, setCurrentVersionCode] = useState<number | undefined>(undefined);
  const appState = useRef(AppState.currentState);
  const navigationRef = useRef<NavigationContainerRef<AppStackParamList>>(null);

  const checkAppVersion = async () => {
    try {
      const currentVer = Constants.expoConfig?.version || '1.0.0';
      const currentVerCode = Platform.OS === 'android'
        ? Constants.expoConfig?.android?.versionCode
        : undefined;

      setCurrentVersion(currentVer);
      setCurrentVersionCode(currentVerCode);

      const versionResponse = await getAppVersion();

      if (versionResponse.success && versionResponse.data.isUpdateRequired) {
        const { requiredVersion: reqVersion, requiredVersionCode, updateMessage: msg, playStoreUrl: url, updateUrl: update } = versionResponse.data;

        const isOutdated = isVersionOutdated(currentVer, reqVersion, currentVerCode, requiredVersionCode);

        console.log('📦 [VERSION CHECK]', {
          currentVersion: currentVer,
          currentVersionCode: currentVerCode,
          requiredVersion: reqVersion,
          requiredVersionCode,
          isOutdated,
        });

        if (isOutdated) {
          setUpdateMessage(msg);
          setPlayStoreUrl(url || '');
          setUpdateUrl(update || '');
          setRequiredVersion(reqVersion);
          setRequiredVersionCode(requiredVersionCode);
          setShowUpdateModal(true);
        } else {
          setShowUpdateModal(false);
        }
      } else {
        setShowUpdateModal(false);
      }
    } catch (error) {
      console.error('❌ [VERSION CHECK] Failed to check app version:', error);
    }
  };

  useEffect(() => {
    try {
      initializeOneSignal();

      setNotificationOpenedHandler((notificationId?: string) => {
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

    const timer = setTimeout(() => {
      checkAppVersion();
    }, 1000);

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        checkAppVersion();
      }
      appState.current = nextAppState;
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return (
    <>
      <NavigationContainer theme={navigationTheme} ref={navigationRef}>
        <AuthProvider>
          <AuthAwareRoot />
        </AuthProvider>
      </NavigationContainer>
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
          // Keep modal visible; it will only disappear
          // when the app restarts with a matching version.
        }}
      />
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
    height: '75%',
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
    padding: 0,
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
  bannerImage: {
    width: '100%',
    height: '100%',
  },
});
