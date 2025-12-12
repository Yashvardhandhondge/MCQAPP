import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import type { AppStackParamList, AuthStackParamList } from './src/navigation/types';
import ChapterDetailScreen from './src/screens/ChapterDetailScreen';
import ChaptersScreen from './src/screens/ChaptersScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import LoginScreen from './src/screens/LoginScreen';
import QuestionsScreen from './src/screens/QuestionsScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import StatsScreen from './src/screens/StatsScreen';
import TestsScreen from './src/screens/TestsScreen';
import CBTSimulatorScreen from './src/screens/CBTSimulatorScreen';
import TestResultsScreen from './src/screens/TestResultsScreen';
import PracticeByYearScreen from './src/screens/PracticeByYearScreen';
import GroupSelectionScreen from './src/screens/GroupSelectionScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PremiumPurchaseScreen from './src/screens/PremiumPurchaseScreen';
import BottomTabBar from './src/components/ui/BottomTabBar';
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
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 300,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
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
        animationDuration: 200,
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
        name="PremiumPurchase"
        component={PremiumPurchaseScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
    </AppStack.Navigator>
  );
}

function RootNavigator() {
  const { user } = useAuth();
  
  if (!user) {
    return <AuthStackNavigator />;
  }
  
  // Always show AppStackNavigator - it will handle group selection logic
  return <AppStackNavigator />;
}

export default function App() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </NavigationContainer>
  );
}
