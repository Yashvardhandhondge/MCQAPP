import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import type { AppStackParamList } from '../navigation/types';
import { getDashboard, getUserStats, getExamConfig, getStudyStreak, getTimeSeriesAnalytics, generateRandomTest, getRecentActivity, getUserRank } from '../services/mcq.service';
import { getNotifications } from '../services/notification.service';
import type { DashboardData, SubjectSummary, UserStatsData } from '../types/mcq';
import { colors, radius, shadow, spacing, typography } from '../theme';
import GradientButton from '../components/ui/GradientButton';
import ModernCard from '../components/ui/ModernCard';
import ProgressBar from '../components/ui/ProgressBar';
import StatCard from '../components/ui/StatCard';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';

const SUBJECT_ICONS: Record<string, string> = {
  Chemistry: '🧪',
  Physics: '⚛️',
  Maths: '➗',
  Biology: '🧬',
};

const SUBJECT_COLORS: Record<string, string[]> = {
  Chemistry: ['#8B5CF6', '#7C3AED'],
  Physics: ['#6366F1', '#4F46E5'],
  Maths: ['#10B981', '#059669'],
  Biology: ['#F59E0B', '#D97706'],
};

const formatDateToYMD = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const normalizeActivityDates = (dates: string[]) =>
  (dates || [])
    .map((date) => {
      if (typeof date === 'string') {
        const dateOnly = date.split('T')[0].split(' ')[0];
        if (dateOnly.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateOnly;
        }
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
          return formatDateToYMD(parsed);
        }
      }
      return null;
    })
    .filter((normalizedDate): normalizedDate is string => normalizedDate !== null);

const computeCurrentStreakFromActivities = (dates: string[]) => {
  if (!dates || dates.length === 0) return 0;

  const activitySet = new Set(dates);
  const today = new Date();
  const todayKey = formatDateToYMD(today);
  const cursor = new Date(today);

  if (!activitySet.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (true) {
    const key = formatDateToYMD(cursor);
    if (!activitySet.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();
  const isPremium = user?.subscription === 'premium';
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [examConfig, setExamConfig] = useState<{
    daysUntilExam: number;
    targetYear: string;
    examName: string;
  } | null>(null);
  const [studyStreak, setStudyStreak] = useState<{
    streak: number;
    maxStreak: number;
    todayProgress: number;
    activityDates: string[];
  }>({ streak: 0, maxStreak: 0, todayProgress: 0, activityDates: [] });
  const [timeSeriesData, setTimeSeriesData] = useState<any>(null);
  const [loadingTimeSeries, setLoadingTimeSeries] = useState(false);
  const [generatingMockTest, setGeneratingMockTest] = useState(false);
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    title: string;
    score: string;
    time: string;
    icon: string;
  }>>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  const normalizedActivityDates = useMemo(
    () => normalizeActivityDates(studyStreak.activityDates),
    [studyStreak.activityDates]
  );

  const activityDatesSet = useMemo(() => new Set(normalizedActivityDates), [normalizedActivityDates]);

  const computedCurrentStreak = useMemo(
    () => computeCurrentStreakFromActivities(normalizedActivityDates),
    [normalizedActivityDates]
  );

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardResponse, statsResponse, configResponse, streakResponse, timeSeriesResponse, activityResponse, rankResponse] = await Promise.allSettled([
        getDashboard(),
        getUserStats(),
        getExamConfig(),
        getStudyStreak(),
        getTimeSeriesAnalytics({ period: '7d', groupBy: 'day' }),
        getRecentActivity(),
        getUserRank('all-time'),
      ]);

      if (dashboardResponse.status === 'fulfilled') {
        setDashboardData(dashboardResponse.value.data);
      }

      if (statsResponse.status === 'fulfilled') {
        setStats(statsResponse.value.data);
      }

      if (configResponse.status === 'fulfilled') {
        const config = configResponse.value.data;
        setExamConfig({
          daysUntilExam: config.daysUntilExam,
          targetYear: config.targetYear,
          examName: config.examName,
        });
      } else {
        setExamConfig({
          daysUntilExam: 120,
          targetYear: '2026',
          examName: 'MHT CET',
        });
      }

      if (streakResponse.status === 'fulfilled') {
        const streakData = streakResponse.value.data;
        setStudyStreak({
          streak: streakData.studyStreak,
          maxStreak: streakData.maxStreak || 0,
          todayProgress: streakData.todayProgress,
          activityDates: streakData.activityDates || [],
        });
      }

      if (timeSeriesResponse.status === 'fulfilled') {
        setTimeSeriesData(timeSeriesResponse.value.data);
      }

      if (activityResponse.status === 'fulfilled') {
        setRecentActivity(activityResponse.value.data);
      }

      if (rankResponse.status === 'fulfilled') {
        setUserRank(rankResponse.value.data.rank);
      }

      // Fetch unread notification count (non-blocking)
      try {
        const notificationsResponse = await getNotifications();
        if (notificationsResponse.success) {
          setUnreadCount(notificationsResponse.data.unreadCount);
        }
      } catch (notificationError) {
        // Silently fail - notifications are not critical for dashboard
        console.log('Failed to fetch notification count:', notificationError);
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Failed to load dashboard';
      setError(message);
      setDashboardData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const totalQuestions = dashboardData?.totalQuestions ?? 0;
  const totalAttempts = stats?.overall.totalAttempts ?? 0;
  const sortedSubjects = useMemo(() => {
    if (!dashboardData) return [] as SubjectSummary[];
    return [...dashboardData.subjects].sort((a, b) => b.questionCount - a.questionCount);
  }, [dashboardData]);

  const accuracyPercent = useMemo(() => {
    if (!stats?.overall) return 0;
    return Math.max(0, Math.min(100, Math.round(stats.overall.accuracy)));
  }, [stats]);

  const daysUntilExam = examConfig?.daysUntilExam ?? 120;
  const targetYear = examConfig?.targetYear ?? '2026';
  const examName = examConfig?.examName ?? 'MHT CET';

  // Study streak and today's progress from backend
  const currentStreak = Math.max(computedCurrentStreak, studyStreak.streak || 0);
  const dailyGoal = 50;
  const todayProgress = studyStreak.todayProgress;
  const goalProgress = Math.min(100, (todayProgress / dailyGoal) * 100);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleStartMockTest = async () => {
    if (!isPremium) {
      const { getTestCount, canTakeTest } = await import('../utils/testTracking');
      const testCount = await getTestCount();
      if (!canTakeTest(false, testCount)) {
        Alert.alert(
          'Test Limit Reached',
          'You have reached the limit of 3 free tests. Upgrade to premium for unlimited tests.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Upgrade Now',
              onPress: () => navigation.navigate('PremiumPurchase'),
            },
          ]
        );
        return;
      }
    }

    setGeneratingMockTest(true);
    setError(null);
    try {
      const response = await generateRandomTest(25);
      if (!isPremium) {
        const { incrementTestCount } = await import('../utils/testTracking');
        await incrementTestCount();
      }
      navigation.navigate('CBT', {
        testId: response.data.sessionId,
        questions: response.data.questions,
      });
    } catch (err) {
      console.error('Failed to generate mock test:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate mock test');
    } finally {
      setGeneratingMockTest(false);
    }
  };

  return (
    <SafeAreaView  edges={['top']} style={styles.safeArea}>
      <View style={styles.backgroundGradient}>
        {/* Sticky Header - Enhanced */}
        <View style={styles.stickyHeader}>
          <LinearGradient
            colors={['#FFFFFF', '#F9FAFB']}
            style={styles.stickyHeaderGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeftSection}>
                <View style={styles.greetingBadge}>
                  <Ionicons 
                    name={getGreeting().includes('Morning') ? 'sunny' : getGreeting().includes('Afternoon') ? 'partly-sunny' : 'moon'} 
                    size={14} 
                    color="#6366F1" 
                  />
                  <Text style={styles.greetingTime}>{getGreeting().toUpperCase()}</Text>
                </View>
                <View style={styles.headerNameRow}>
                  <Text style={styles.greetingName}>
                    {user?.fullName?.split(' ')[0] || 'Student'}
                  </Text>
                  <Text style={styles.greetingEmoji}>👋</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.rankCard}
                  onPress={() => (navigation as any).getParent()?.navigate('MainTabs', { screen: 'Leaderboard' })}
                  activeOpacity={0.7}
                >
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Notifications')} 
                  style={styles.notificationButton} 
                  activeOpacity={0.7}
                >
                  <View style={styles.notificationButtonWrapper}>
                    <View style={styles.notificationButtonContainer}>
                      <LinearGradient colors={colors.gradientPrimary as [string, string]} style={styles.notificationGradient}>
                        <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
                      </LinearGradient>
                    </View>
                    {unreadCount > 0 && (
                      <View style={styles.notificationBadge}>
                        <Text style={styles.notificationBadgeText}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileButton} activeOpacity={0.7}>
                  <LinearGradient colors={colors.gradientPrimary as [string, string]} style={styles.profileGradient}>
                    <Ionicons name="person" size={18} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >

            {/* Free Plan Info Card - Only for Non-Premium Users */}
            {!isPremium && (
              <View style={styles.freePlanCard}>
                {/* Left: Free benefits */}
                <View style={styles.freePlanLeft}>
                  <View style={styles.freePlanBadgeRow}>
                    <View style={styles.freePlanBadge}>
                      <Ionicons name="gift" size={12} color="#10B981" />
                      <Text style={styles.freePlanBadgeText}>FREE PLAN</Text>
                    </View>
                  </View>
                  <Text style={styles.freePlanTitle}>What you get free</Text>
                  <View style={styles.freePlanBenefitRow}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.freePlanBenefitText}>25 questions / day</Text>
                  </View>
                  <View style={styles.freePlanBenefitRow}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.freePlanBenefitText}>3 chapters free per subject</Text>
                  </View>
                  <View style={styles.freePlanBenefitRow}>
                    <Ionicons name="swap-horizontal" size={14} color="#6366F1" />
                    <Text style={styles.freePlanBenefitText}>Switch PCM/PCB/PCMB in Profile</Text>
                  </View>
                </View>

                {/* Right: Upgrade CTA */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('PremiumPurchase')}
                  activeOpacity={0.85}
                  style={styles.freePlanUpgradeButton}
                >
                  <LinearGradient
                    colors={['#667EEA', '#764BA2'] as [string, string]}
                    style={styles.freePlanUpgradeGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  >
                    <Text style={styles.freePlanUpgradePrice}>₹99</Text>
                    <Text style={styles.freePlanUpgradeLabel}>All Access</Text>
                    <Text style={styles.freePlanUpgradeHint}>one-time</Text>
                    <Ionicons name="arrow-forward-circle" size={20} color="rgba(255,255,255,0.9)" style={{ marginTop: 6 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Compact Exam Countdown + Quick Stats */}
            <View style={styles.compactStatsGrid}>
              <View style={styles.examCountdownCard}>
                <LinearGradient
                  colors={colors.gradientPrimary as [string, string]}
                  style={styles.examCountdownGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.examCountdownContent}>
                    <View style={styles.examCountdownHeader}>
                      <Ionicons name="calendar" size={14} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.examCountdownLabel}>{examName} {targetYear}</Text>
                    </View>
                    <Text style={styles.examCountdownDays}>{daysUntilExam}</Text>
                    <Text style={styles.examCountdownSubtext}>days to go</Text>
                  </View>
                </LinearGradient>
              </View>
              
              <View style={styles.streakCard}>
                <LinearGradient
                  colors={colors.gradientOrange as [string, string]}
                  style={styles.streakGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="flame" size={24} color="#FFFFFF" />
                  <Text style={styles.streakCardValue}>{currentStreak}</Text>
                  <Text style={styles.streakCardLabel}>Day Streak</Text>
                  <Text style={styles.streakCardHint}>Study daily to maintain!</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Performance Metrics - Flowing Layout */}
            <View style={styles.performanceMetricsCard}>
              <View style={styles.metricsHeader}>
                <Text style={styles.metricsTitle}>Your Performance</Text>
                <Text style={styles.metricsSubtitle}>Track your progress and improve</Text>
              </View>
              <View style={styles.metricsGrid}>
                <TouchableOpacity
                  style={styles.metricCard}
                  onPress={() => (navigation as any).getParent()?.navigate('MainTabs', { screen: 'Chapters' })}
                  activeOpacity={0.7}
                >
                  <LinearGradient colors={colors.gradientPrimary as [string, string]} style={styles.metricIconContainer}>
                    <Ionicons name="stats-chart" size={22} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.metricContent}>
                    <Text style={styles.metricValue}>{stats?.overall.totalAttempts ?? 0}</Text>
                    <Text style={styles.metricLabel} numberOfLines={2}>Total Attempts</Text>
                    <Text style={styles.metricHint} numberOfLines={2}>Tap to practice subjects</Text>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.metricCard}>
                  <LinearGradient colors={['#8B5CF6', '#EC4899'] as [string, string]} style={styles.metricIconContainer}>
                    <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.metricContent}>
                    <Text style={styles.metricValue}>{accuracyPercent}%</Text>
                    <Text style={styles.metricLabel} numberOfLines={2}>Accuracy</Text>
                    <Text style={styles.metricHint} numberOfLines={2}>Keep practicing!</Text>
                  </View>
                </View>
                
                <View style={styles.metricCard}>
                  <LinearGradient colors={colors.gradientAccent as [string, string]} style={styles.metricIconContainer}>
                    <Text style={styles.metricEmoji}>✅</Text>
                  </LinearGradient>
                  <View style={styles.metricContent}>
                    <Text style={styles.metricValue}>{stats?.overall.totalCorrect ?? 0}</Text>
                    <Text style={styles.metricLabel} numberOfLines={2}>Correct Answers</Text>
                    <Text style={styles.metricHint} numberOfLines={2}>Great job!</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.metricCard}
                  onPress={() => (navigation as any).getParent()?.navigate('MainTabs', { screen: 'Leaderboard' })}
                  activeOpacity={0.7}
                >
                  <LinearGradient colors={colors.gradientOrange as [string, string]} style={styles.metricIconContainer}>
                    <Ionicons name="trophy" size={22} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.metricContent}>
                    <Text style={styles.metricValue}>#{userRank || '--'}</Text>
                    <Text style={styles.metricLabel} numberOfLines={2}>Your Rank</Text>
                    <Text style={styles.metricHint} numberOfLines={2}>Tap to see leaderboard</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Today's Goal - Enhanced */}
            <View style={styles.todaysGoalCard}>
              <View style={styles.todaysGoalHeader}>
                <View style={styles.todaysGoalHeaderLeft}>
                  <Text style={styles.todaysGoalTitle}>Today's Goal</Text>
                  <Text style={styles.todaysGoalSubtitle}>
                    {todayProgress} of {dailyGoal} questions completed
                  </Text>
                  <Text style={styles.todaysGoalDescription} numberOfLines={2}>
                    Complete {dailyGoal} questions daily to build a strong study habit
                  </Text>
                </View>
                <View style={styles.todaysGoalPercentage}>
                  <Text style={styles.todaysGoalPercentText}>{Math.round(goalProgress)}%</Text>
                </View>
              </View>
              
              <View style={styles.todaysGoalProgressContainer}>
                <LinearGradient
                  colors={colors.gradientPrimary as [string, string]}
                  style={[styles.todaysGoalProgressBar, { width: `${goalProgress}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>

              <View style={styles.todaysGoalFooter}>
                <View style={styles.todaysGoalMotivation}>
                  <Ionicons name="flash" size={16} color={colors.primary} />
                  <Text style={styles.todaysGoalMotivationText}>
                    {goalProgress >= 100
                      ? '🎉 Amazing! Goal achieved!'
                      : goalProgress >= 50
                      ? '💪 Keep the momentum!'
                      : '🚀 Start strong! Every question counts!'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.todaysGoalButton}
                onPress={() => (navigation as any).getParent()?.navigate('MainTabs', { screen: 'Chapters' })}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={colors.gradientPrimary as [string, string]}
                  style={styles.todaysGoalButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.todaysGoalButtonText}>Start Practice</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Recent Activity */}
            {recentActivity.length > 0 ? (
              <View style={styles.recentActivitySection}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <Text style={styles.sectionSubtitle}>Your latest test attempts</Text>
                  </View>
                  <TouchableOpacity onPress={() => (navigation as any).getParent()?.navigate('MainTabs', { screen: 'Tests' })}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.recentActivityList}>
                  {recentActivity.map((activity) => (
                    <TouchableOpacity
                      key={activity.id}
                      style={styles.recentActivityItem}
                      activeOpacity={0.7}
                      onPress={() => (navigation as any).getParent()?.navigate('MainTabs', { screen: 'Tests' })}
                    >
                      <Text style={styles.recentActivityIcon}>{activity.icon}</Text>
                      <View style={styles.recentActivityContent}>
                        <Text style={styles.recentActivityTitle}>{activity.title}</Text>
                        <Text style={styles.recentActivityTime}>{activity.time}</Text>
                      </View>
                      <View style={styles.recentActivityScore}>
                        <Text style={styles.recentActivityScoreText}>{activity.score}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.emptyActivityCard}>
                <Ionicons name="document-text" size={48} color={colors.textMuted} />
                <Text style={styles.emptyActivityTitle}>No Recent Activity</Text>
                <Text style={styles.emptyActivityText}>
                  Start practicing to see your test history here
                </Text>
                <TouchableOpacity
                  style={styles.emptyActivityButton}
                  onPress={handleStartMockTest}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={colors.gradientPrimary as [string, string]}
                    style={styles.emptyActivityButtonGradient}
                  >
                    <Text style={styles.emptyActivityButtonText}>Start Your First Test</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Study Calendar */}
            <ModernCard variant="elevated" padding="lg" style={styles.performanceCard}>
              <View style={styles.cardHeader}>
                <View style={styles.calendarHeader}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                  <Text style={styles.cardTitle}>
                    {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </Text>
                </View>
              </View>
              <View style={styles.calendarContainer}>
                {/* Days of week */}
                <View style={styles.weekDaysRow}>
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                    <Text key={day} style={styles.weekDay}>
                      {day}
                    </Text>
                  ))}
                </View>
                {/* Calendar grid */}
                <View style={styles.calendarGrid}>
                  {(() => {
                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const currentYear = now.getFullYear();
                    const firstDay = new Date(currentYear, currentMonth, 1);
                    const lastDay = new Date(currentYear, currentMonth + 1, 0);
                    const daysInMonth = lastDay.getDate();
                    const startingDayOfWeek = firstDay.getDay();
                    const todayStr = formatDateToYMD(now);
                    
                    // Debug: Log activity dates for troubleshooting (can be removed later)
                    // console.log('Activity dates:', Array.from(activityDatesSet));
                    // console.log('Current month:', currentYear, currentMonth + 1);

                    const days = [];
                    
                    // Empty cells for days before the first day of the month
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
                    }

                    // Days of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      const dateStr = formatDateToYMD(new Date(currentYear, currentMonth, day));
                      // Create date objects at midnight for accurate comparison
                      const dayDate = new Date(currentYear, currentMonth, day, 0, 0, 0, 0);
                      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                      
                      const isToday = dateStr === todayStr;
                      // Check if this date has activity - ensure exact string match
                      const hasActivity = activityDatesSet.has(dateStr);
                      const isPast = dayDate < todayDate;
                      // Only show missed emoji for past days without activity (not today or future)
                      const isMissed = isPast && !hasActivity && !isToday;

                      days.push(
                        <View key={day} style={styles.calendarDay}>
                          <View
                            style={[
                              styles.calendarDayContent,
                              isToday && styles.calendarDayToday,
                            ]}
                          >
                            {hasActivity ? (
                              <View style={styles.activeDayBadge}>
                                <Text style={styles.activeDayEmoji}>🔥</Text>
                              </View>
                            ) : isMissed ? (
                              <View style={styles.missedDayBadge}>
                                <Text style={styles.missedDayEmoji}>😭</Text>
                              </View>
                            ) : (
                              <Text style={styles.calendarDayNumber}>{day}</Text>
                            )}
                          </View>
                        </View>
                      );
                    }

                    return days;
                  })()}
                </View>
              </View>
              {/* Streak indicators */}
              <View style={styles.streakRow}>
                <View style={styles.streakItem}>
                  <View style={styles.streakItemHeader}>
                    <Ionicons name="flame" size={18} color="#F59E0B" />
                    <Text style={styles.streakLabel}>Current</Text>
                  </View>
                  <Text style={styles.streakValue}>{currentStreak}</Text>
                </View>
                <View style={styles.streakDivider} />
                <View style={styles.streakItem}>
                  <View style={styles.streakItemHeader}>
                    <Ionicons name="star" size={18} color="#F59E0B" />
                    <Text style={styles.streakLabel}>Best</Text>
                  </View>
                  <Text style={styles.streakValue}>{studyStreak.maxStreak}</Text>
                </View>
              </View>
            </ModernCard>

            {/* First-Time User Guide - Solve Questions by Subject */}
            {totalAttempts === 0 && (
              <TouchableOpacity
                style={styles.subjectGuideCard}
                onPress={() => (navigation as any).getParent()?.navigate('MainTabs', { screen: 'Chapters' })}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={colors.gradientPrimary as [string, string]}
                  style={styles.subjectGuideGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.subjectGuideContent}>
                    <View style={styles.subjectGuideLeft}>
                      <View style={styles.subjectGuideIconContainer}>
                        <Ionicons name="book" size={32} color="#FFFFFF" />
                      </View>
                      <View style={styles.subjectGuideTextContainer}>
                        <Text style={styles.subjectGuideTitle}>Solve Questions by Subject</Text>
                        <Text style={styles.subjectGuideDescription}>
                          Practice chapter-wise questions from Chemistry, Physics, Maths, and Biology
                        </Text>
                      </View>
                    </View>
                    <View style={styles.subjectGuideRight}>
                      <Ionicons name="arrow-forward-circle" size={32} color="#FFFFFF" />
                    </View>
                  </View>
                  <View style={styles.subjectGuideFeatures}>
                    <View style={styles.subjectGuideFeatureItem}>
                      <Ionicons name="checkmark-circle" size={16} color="rgba(255, 255, 255, 0.9)" />
                      <Text style={styles.subjectGuideFeatureText}>Chapter-wise practice</Text>
                    </View>
                    <View style={styles.subjectGuideFeatureItem}>
                      <Ionicons name="checkmark-circle" size={16} color="rgba(255, 255, 255, 0.9)" />
                      <Text style={styles.subjectGuideFeatureText}>Track your progress</Text>
                    </View>
                    <View style={styles.subjectGuideFeatureItem}>
                      <Ionicons name="checkmark-circle" size={16} color="rgba(255, 255, 255, 0.9)" />
                      <Text style={styles.subjectGuideFeatureText}>All subjects available</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Weekly Performance Trend */}
            {/* {timeSeriesData && timeSeriesData.timeSeries.length > 0 && (
              <ModernCard variant="elevated" padding="lg" style={styles.performanceCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.chartHeader}>
                    <Ionicons name="trending-up" size={20} color={colors.primary} />
                    <Text style={styles.cardTitle}>Weekly Performance Trend</Text>
                  </View>
                </View>
                <LineChart
                  data={timeSeriesData.timeSeries.map((item: any) => Math.min(100, Math.max(0, item.accuracy)))}
                  labels={timeSeriesData.timeSeries.map((item: any) => {
                    const date = new Date(item.date);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  })}
                  yAxisSuffix="%"
                  color={colors.primary}
                  height={200}
                />
                <View style={styles.trendInsight}>
                  <Ionicons name="bulb" size={16} color={colors.warning} />
                  <Text style={styles.trendInsightText}>
                    {timeSeriesData.timeSeries.length > 1
                      ? `Your accuracy has been ${timeSeriesData.timeSeries[timeSeriesData.timeSeries.length - 1].accuracy > timeSeriesData.timeSeries[0].accuracy ? 'improving' : 'fluctuating'} over the past week`
                      : 'Keep practicing to see your trends!'}
                  </Text>
                </View>
              </ModernCard>
            )} */}

            {/* Subject Performance Comparison */}
            {/* {stats && stats.perSubject.length > 0 && (
              <ModernCard variant="elevated" padding="lg" style={styles.performanceCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.chartHeader}>
                    <Ionicons name="bar-chart" size={20} color={colors.primary} />
                    <Text style={styles.cardTitle}>Subject Performance</Text>
                  </View>
                </View>
                <View style={styles.chartNote}>
                  <Text style={styles.chartNoteText}>
                    Accuracy percentage across all subjects
                  </Text>
                </View>
                <BarChart
                  data={stats.perSubject.map((item) => Math.min(100, Math.max(0, Math.round(item.accuracy))))}
                  labels={stats.perSubject.map((item) => {
                    // Better label formatting
                    if (item.subject === 'Chemistry') return 'Chem';
                    if (item.subject === 'Physics') return 'Phys';
                    if (item.subject === 'Maths') return 'Math';
                    if (item.subject === 'Biology') return 'Bio';
                    return item.subject.substring(0, 4);
                  })}
                  yAxisSuffix="%"
                  color={colors.primary}
                  height={200}
                />
              </ModernCard>
            )} */}

            {/* Subject Performance */}
            {stats && stats.perSubject.length > 0 && (
              <View style={styles.subjectPerformanceSection}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Subject Performance</Text>
                    <Text style={styles.sectionSubtitle}>Your accuracy across different subjects</Text>
                  </View>
                </View>
                
                <View style={styles.subjectPerformanceList}>
                  {stats.perSubject.map((item) => {
                    const subjectGradient = SUBJECT_COLORS[item.subject] || colors.gradientPrimary;
                    const progressPercent = item.totalAttempts > 0 
                      ? (item.correctAttempts / item.totalAttempts) * 100 
                      : 0;
                    
                    return (
                      <TouchableOpacity
                        key={item.subject}
                        style={styles.subjectPerformanceCard}
                        activeOpacity={0.7}
                        onPress={() =>
                          (navigation as any).getParent()?.navigate('MainTabs', {
                            screen: 'Chapters',
                            params: { subject: item.subject },
                          })
                        }
                      >
                        <View style={styles.subjectPerformanceHeader}>
                          <View style={styles.subjectPerformanceInfo}>
                            <Text style={styles.subjectPerformanceIcon}>
                              {SUBJECT_ICONS[item.subject] ?? '📘'}
                            </Text>
                            <View>
                              <Text style={styles.subjectPerformanceName}>{item.subject}</Text>
                              <Text style={styles.subjectPerformanceMeta}>
                                {item.correctAttempts}/{item.totalAttempts} correct answers
                              </Text>
                            </View>
                          </View>
                          <View style={styles.subjectPerformanceScore}>
                            <Text style={styles.subjectPerformanceScoreText}>
                              {Math.round(item.accuracy)}%
                            </Text>
                            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                          </View>
                        </View>
                        
                        <View style={styles.subjectPerformanceProgressContainer}>
                          <LinearGradient
                            colors={subjectGradient as [string, string]}
                            style={[styles.subjectPerformanceProgressBar, { width: `${progressPercent}%` }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                          />
                        </View>
                        <Text style={styles.subjectPerformanceHint}>Tap to practice {item.subject}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {loading && !dashboardData ? (
              <View style={styles.stateCard}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={styles.stateText}>Loading dashboard...</Text>
              </View>
            ) : error ? (
              <View style={styles.stateCard}>
                <Ionicons name="alert-circle" size={48} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              sortedSubjects.map((subject, index) => {
                const ratio = totalQuestions > 0 ? subject.questionCount / totalQuestions : 0;
                const gradientColors = SUBJECT_COLORS[subject.name] || colors.gradientPrimary;

                return (
                  <TouchableOpacity
                    key={subject.name}
                    onPress={() =>
                      (navigation as any).getParent()?.navigate('MainTabs', {
                        screen: 'Chapters',
                        params: { subject: subject.name },
                      })
                    }
                    activeOpacity={0.9}
                  >
                    
                  </TouchableOpacity>
                );
              })
            )}

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3E8FF',
  },
  backgroundGradient: {
    flex: 1,
    backgroundColor: '#F3E8FF',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  stickyHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...shadow.sm,
  },
  stickyHeaderGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeftSection: {
    flex: 1,
  },
  greetingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  greetingTime: {
    ...typography.caption,
    color: '#6366F1',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 10,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  greetingName: {
    ...typography.h2,
    color: '#111827',
    fontWeight: '700',
    fontSize: 24,
    letterSpacing: -0.5,
  },
  greetingEmoji: {
    fontSize: 24,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rankCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },
  rankCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rankCardContent: {
    alignItems: 'flex-start',
  },
  rankLabel: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rankValue: {
    ...typography.subtitle,
    color: '#6366F1',
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 18,
  },
  notificationButton: {
    marginRight: spacing.sm,
  },
  notificationButtonWrapper: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  notificationButtonContainer: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.lg,
  },
  notificationGradient: {
    width: 44,
    height: 44,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    zIndex: 10,
    ...shadow.md,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 13,
    includeFontPadding: false,
  },
  profileButton: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.lg,
  },
  profileGradient: {
    width: 44,
    height: 44,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactStatsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  examCountdownCard: {
    flex: 2,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.lg,
  },
  examCountdownGradient: {
    padding: spacing.xl,
    position: 'relative',
  },
  examCountdownContent: {
    position: 'relative',
    zIndex: 10,
  },
  examCountdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  examCountdownLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  examCountdownDays: {
    ...typography.display,
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: '800',
    lineHeight: 56,
    marginBottom: spacing.xs,
    letterSpacing: -1,
  },
  examCountdownSubtext: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  streakCard: {
    flex: 1,
    borderRadius: radius.xl + 4,
    overflow: 'hidden',
    ...shadow.lg,
  },
  streakGradient: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  streakCardValue: {
    ...typography.h1,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  streakCardLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
  },
  performanceMetricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadow.sm,
  },
  metricsHeader: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  metricsTitle: {
    ...typography.h3,
    color: '#111827',
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 18,
  },
  metricsSubtitle: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm + 2,
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    paddingVertical: spacing.lg + 4,
    paddingHorizontal: spacing.md,
    flex: 1,
    minWidth: '47%',
    minHeight: 160,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  metricIconContainer: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    ...shadow.sm,
  },
  metricEmoji: {
    fontSize: 26,
  },
  metricContent: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.xs,
    minHeight: 80,
    justifyContent: 'flex-start',
  },
  metricValue: {
    ...typography.h2,
    color: '#111827',
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 28,
  },
  metricLabel: {
    ...typography.caption,
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
    lineHeight: 18,
    width: '100%',
  },
  todaysGoalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadow.sm,
    overflow: 'hidden',
  },
  todaysGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  todaysGoalHeaderLeft: {
    flex: 1,
    minWidth: 0,
  },
  todaysGoalTitle: {
    ...typography.h3,
    color: '#111827',
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 18,
  },
  todaysGoalSubtitle: {
    ...typography.body,
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  todaysGoalDescription: {
    ...typography.caption,
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  todaysGoalPercentage: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xs,
    flexShrink: 0,
  },
  todaysGoalPercentText: {
    ...typography.display,
    fontSize: 32,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: -0.5,
  },
  todaysGoalProgressContainer: {
    height: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  todaysGoalProgressBar: {
    height: '100%',
    borderRadius: radius.full,
  },
  todaysGoalFooter: {
    marginBottom: spacing.md,
  },
  todaysGoalMotivation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  todaysGoalMotivationText: {
    ...typography.body,
    color: '#6366F1',
    fontWeight: '500',
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  todaysGoalButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.md,
    marginTop: spacing.sm,
  },
  todaysGoalButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
  },
  todaysGoalButtonText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: '#111827',
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 18,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  viewAllText: {
    ...typography.subtitle,
    color: '#6366F1',
    fontWeight: '600',
    fontSize: 13,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  quickActionPill: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.md,
    minWidth: 0,
  },
  quickActionPillGradient: {
    paddingVertical: spacing.lg + 6,
    paddingHorizontal: spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 125,
  },
  quickActionPillEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm - 2,
  },
  quickActionPillText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.2,
    marginBottom: spacing.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  performanceCard: {
    marginBottom: spacing.lg,
    borderRadius: radius.xl + 2,
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metricBox: {
    flex: 1,
    backgroundColor: colors.authInputBg,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  emptyText: {
    ...typography.body,
    color: colors.authTextMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginTop: spacing.md,
  },
  chip: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  chipGradient: {
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  chipIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  chipLabel: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  chipValue: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  chipMeta: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  subjectProgressCard: {
    marginBottom: spacing.lg,
    borderRadius: radius.xl + 2,
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  stateCard: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadow.md,
  },
  stateText: {
    ...typography.body,
    color: colors.authTextMuted,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  retryButtonText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  subjectCard: {
    marginBottom: spacing.md,
    borderRadius: radius.xl + 2,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  subjectIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    ...typography.title,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subjectMeta: {
    ...typography.caption,
    color: colors.authTextMuted,
  },
  subjectProgressContainer: {
    height: 6,
    backgroundColor: colors.authBorder,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  subjectProgressBar: {
    height: '100%',
    borderRadius: radius.full,
  },
  bottomSpacing: {
    height: spacing.xxl,
  },
  trendInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
  },
  trendInsightText: {
    ...typography.caption,
    color: colors.authText,
    flex: 1,
    lineHeight: 18,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chartNote: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chartNoteText: {
    ...typography.caption,
    color: colors.authTextMuted,
    fontSize: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  calendarContainer: {
    marginTop: spacing.md,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  weekDay: {
    ...typography.caption,
    color: colors.authTextMuted,
    fontWeight: '600',
    fontSize: 11,
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  calendarDay: {
    width: '13.5%',
    aspectRatio: 1,
    marginBottom: spacing.xs,
    marginRight: '0.5%',
  },
  calendarDayContent: {
    flex: 1,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.authInputBg,
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  calendarDayNumber: {
    ...typography.caption,
    color: colors.authText,
    fontWeight: '600',
    fontSize: 13,
  },
  activeDayBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDayEmoji: {
    fontSize: 18,
  },
  missedDayBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.authInputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  missedDayEmoji: {
    fontSize: 18,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
  },
  streakItem: {
    alignItems: 'center',
    flex: 1,
  },
  streakItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  streakLabel: {
    ...typography.caption,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  streakValue: {
    ...typography.h2,
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 24,
  },
  recentActivitySection: {
    marginBottom: spacing.lg,
  },
  recentActivityList: {
    gap: spacing.sm,
  },
  recentActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: spacing.md,
    ...shadow.sm,
  },
  recentActivityIcon: {
    fontSize: 36,
  },
  recentActivityContent: {
    flex: 1,
  },
  recentActivityTitle: {
    ...typography.subtitle,
    color: '#111827',
    fontWeight: '600',
    marginBottom: spacing.xs,
    fontSize: 14,
    lineHeight: 20,
  },
  recentActivityTime: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 12,
  },
  recentActivityScore: {
    alignItems: 'flex-end',
  },
  recentActivityScoreText: {
    ...typography.h3,
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 18,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.xl + 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadow.md,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  welcomeEmoji: {
    fontSize: 52,
    marginRight: spacing.md,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    ...typography.h2,
    color: '#111827',
    fontWeight: '700',
    marginBottom: spacing.sm,
    fontSize: 22,
    lineHeight: 28,
  },
  welcomeSubtitle: {
    ...typography.body,
    color: '#6B7280',
    lineHeight: 22,
    fontSize: 15,
  },
  welcomeFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
  },
  welcomeFeature: {
    alignItems: 'center',
    flex: 1,
  },
  welcomeFeatureText: {
    ...typography.caption,
    color: '#64748B',
    marginTop: spacing.xs,
    textAlign: 'center',
    fontSize: 11,
  },
  examCountdownHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  examCountdownHintText: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10,
  },
  streakCardHint: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    marginTop: spacing.xs,
  },
  metricHint: {
    ...typography.caption,
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 2,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: spacing.xs,
  },
  quickActionsSection: {
    marginBottom: spacing.lg,
  },
  quickActionPillHint: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: spacing.xs,
  },
  emptyActivityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.xxxl + 8,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadow.sm,
  },
  emptyActivityTitle: {
    ...typography.h3,
    color: '#111827',
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontSize: 18,
  },
  emptyActivityText: {
    ...typography.body,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
    fontSize: 14,
  },
  emptyActivityButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.md,
  },
  emptyActivityButtonGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyActivityButtonText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  subjectPerformanceSection: {
    marginBottom: spacing.lg,
  },
  subjectPerformanceList: {
    gap: spacing.md,
  },
  subjectPerformanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl + 4,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  subjectPerformanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  subjectPerformanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  subjectPerformanceIcon: {
    fontSize: 32,
  },
  subjectPerformanceName: {
    ...typography.title,
    color: '#1E293B',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subjectPerformanceMeta: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 16,
  },
  subjectPerformanceScore: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  subjectPerformanceScoreText: {
    ...typography.h2,
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 22,
  },
  subjectPerformanceProgressContainer: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  subjectPerformanceProgressBar: {
    height: '100%',
    borderRadius: radius.full,
  },
  subjectPerformanceHint: {
    ...typography.caption,
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  subjectGuideCard: {
    borderRadius: radius.xl + 4,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadow.lg,
  },
  subjectGuideGradient: {
    padding: spacing.xl,
  },
  subjectGuideContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  subjectGuideLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  subjectGuideIconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.md,
  },
  subjectGuideTextContainer: {
    flex: 1,
  },
  subjectGuideTitle: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 18,
    lineHeight: 24,
  },
  subjectGuideDescription: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  subjectGuideRight: {
    marginLeft: spacing.md,
  },
  subjectGuideFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  subjectGuideFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    minWidth: '45%',
  },
  subjectGuideFeatureText: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 12,
    fontWeight: '500',
  },
  freePlanCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    marginBottom: spacing.xl,
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    overflow: 'hidden',
    ...shadow.md,
  },
  freePlanLeft: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  freePlanBadgeRow: {
    marginBottom: spacing.sm,
  },
  freePlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  freePlanBadgeText: {
    ...typography.caption,
    color: '#065F46',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  freePlanTitle: {
    ...typography.subtitle,
    color: '#111827',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  freePlanBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  freePlanBenefitText: {
    ...typography.caption,
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  freePlanUpgradeButton: {
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  freePlanUpgradeGradient: {
    width: 88,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  freePlanUpgradePrice: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 22,
    letterSpacing: -0.5,
  },
  freePlanUpgradeLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '700',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  freePlanUpgradeHint: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 1,
  },
});

