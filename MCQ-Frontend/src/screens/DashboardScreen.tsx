import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import type { AppStackParamList } from '../navigation/types';
import { getDashboard, getUserStats, getExamConfig, getStudyStreak, getTimeSeriesAnalytics, generateRandomTest } from '../services/mcq.service';
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
      const [dashboardResponse, statsResponse, configResponse, streakResponse, timeSeriesResponse] = await Promise.allSettled([
        getDashboard(),
        getUserStats(),
        getExamConfig(),
        getStudyStreak(),
        getTimeSeriesAnalytics({ period: '7d', groupBy: 'day' }),
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
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={colors.gradientAuthLight}
        style={styles.backgroundGradient}
      >
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
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.greeting}>
                  {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Student'} 👋
                </Text>
                <Text style={styles.subheading}>Ready to ace {examName} {targetYear}?</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileButton} activeOpacity={0.7}>
                <LinearGradient colors={colors.gradientPrimary} style={styles.profileGradient}>
                  <Ionicons name="person" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Target Exam Card */}
            <View style={styles.targetCard}>
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.targetGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.targetContent}>
                  <View style={styles.targetInfo}>
                    <View style={styles.targetIconContainer}>
                      <Ionicons name="calendar" size={24} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={styles.targetLabel}>Target Exam</Text>
                      <Text style={styles.targetExam}>{examName} {targetYear}</Text>
                    </View>
                  </View>
                  <View style={styles.daysContainer}>
                    <Text style={styles.daysNumber}>{daysUntilExam}</Text>
                    <Text style={styles.daysLabel}>Days Left</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleStartMockTest}
                  disabled={generatingMockTest}
                  activeOpacity={0.85}
                  style={styles.mockTestButton}
                >
                  <LinearGradient
                    colors={colors.gradientAccent}
                    style={styles.mockTestButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {generatingMockTest ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="play-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.mockTestButtonText}>Start Mock Test</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* Quick Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard
                title="Total Attempts"
                value={stats?.overall.totalAttempts ?? 0}
                icon="stats-chart"
                gradient={colors.gradientPrimary}
                delay={100}
              />
              <StatCard
                title="Accuracy"
                value={`${accuracyPercent}%`}
                subtitle="Overall"
                icon="checkmark-circle"
                gradient={colors.gradientAccent}
                delay={150}
                locked={!isPremium}
                onPress={() => !isPremium && navigation.navigate('PremiumPurchase')}
              />
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                title="Correct Answers"
                value={stats?.overall.totalCorrect ?? 0}
                icon="trophy"
                gradient={colors.gradientGold}
                delay={200}
                locked={!isPremium}
                onPress={() => !isPremium && navigation.navigate('PremiumPurchase')}
              />
              <StatCard
                title="Study Streak"
                value={`${currentStreak}`}
                subtitle="days in a row 🔥"
                icon="flame"
                gradient={['#F59E0B', '#EF4444']}
                delay={250}
                locked={!isPremium}
                onPress={() => !isPremium && navigation.navigate('PremiumPurchase')}
              />
            </View>

            {/* Daily Goal Card */}
            <ModernCard variant="elevated" padding="lg" style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View>
                  <Text style={styles.goalTitle}>Today's Goal</Text>
                  <Text style={styles.goalSubtitle}>
                    {todayProgress} / {dailyGoal} questions completed
                  </Text>
                </View>
                <View style={styles.goalIconContainer}>
                  <Ionicons name="flag" size={24} color={colors.primary} />
                </View>
              </View>
              <ProgressBar progress={goalProgress} height={12} variant="primary" />
              <Text style={styles.goalMotivation}>
                {goalProgress >= 100
                  ? '🎉 Amazing! Goal achieved!'
                  : goalProgress >= 50
                  ? '💪 Keep going! You\'re halfway there!'
                  : '🚀 Start strong! Every question counts!'}
              </Text>
            </ModernCard>

            {/* Quick Actions */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
            <View style={styles.quickActions}>
              {[
                { screen: 'Tests', icon: 'play-circle', gradient: colors.gradientPrimary, label: 'Start Test' },
                { screen: 'Chapters', icon: 'book', gradient: colors.gradientAccent, label: 'Chapters' },
                { screen: 'Leaderboard', icon: 'trophy', gradient: colors.gradientGold, label: 'Leaderboard' },
              ].map((action) => (
                <Animated.View
                  key={action.screen}
                  style={[
                    styles.quickActionWrapper,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() => navigation.navigate('MainTabs', { screen: action.screen as any })}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={action.gradient}
                      style={styles.quickActionGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.quickActionIconContainer}>
                        <Ionicons name={action.icon as any} size={32} color="#FFFFFF" />
                      </View>
                      <Text style={styles.quickActionText} numberOfLines={1}>{action.label}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>

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
                  <Text style={styles.streakLabel}>Current Streak 🔥</Text>
                  <Text style={styles.streakValue}>{currentStreak}</Text>
                </View>
                <View style={styles.streakItem}>
                  <Text style={styles.streakLabel}>Max Streak 🔥</Text>
                  <Text style={styles.streakValue}>{studyStreak.maxStreak}</Text>
                </View>
              </View>
            </ModernCard>

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

            {/* Subject Progress */}
            {stats && stats.perSubject.length > 0 && (
              <ModernCard padding="lg" style={styles.subjectProgressCard}>
                <Text style={styles.cardTitle}>Subject Performance</Text>
                <View style={styles.chipGrid}>
                  {stats.perSubject.map((item, index) => {
                    const subjectGradient = SUBJECT_COLORS[item.subject] || colors.gradientPrimary;
                    return (
                      <View key={item.subject} style={styles.chip}>
                        <LinearGradient
                          colors={subjectGradient}
                          style={styles.chipGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.chipIcon}>{SUBJECT_ICONS[item.subject] ?? '📘'}</Text>
                          <Text style={styles.chipLabel}>{item.subject}</Text>
                          <Text style={styles.chipValue}>{Math.round(item.accuracy)}%</Text>
                          <Text style={styles.chipMeta}>
                            {item.correctAttempts}/{item.totalAttempts}
                          </Text>
                        </LinearGradient>
                      </View>
                    );
                  })}
                </View>
              </ModernCard>
            )}

            {/* Subjects Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Explore Subjects</Text>
              <Text style={styles.sectionSubtitle}>Tap to view chapters</Text>
            </View>

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
                    <ModernCard variant="elevated" padding="md" style={styles.subjectCard}>
                      <View style={styles.subjectHeader}>
                        <Text style={styles.subjectIcon}>{SUBJECT_ICONS[subject.name] ?? '📘'}</Text>
                        <View style={styles.subjectInfo}>
                          <Text style={styles.subjectName}>{subject.name}</Text>
                          <Text style={styles.subjectMeta}>
                            {subject.questionCount.toLocaleString()} questions available
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
                      </View>
                      <View style={styles.subjectProgressContainer}>
                        <LinearGradient
                          colors={gradientColors || colors.gradientPrimary}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.subjectProgressBar, { width: `${ratio * 100}%` }]}
                        />
                      </View>
                    </ModernCard>
                  </TouchableOpacity>
                );
              })
            )}

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.authBackground,
  },
  backgroundGradient: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xxl,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    ...typography.h1,
    color: colors.authText,
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  subheading: {
    ...typography.body,
    color: colors.authTextSecondary,
    marginTop: spacing.xs,
  },
  profileButton: {
    borderRadius: radius.full,
    overflow: 'hidden',
    ...shadow.md,
  },
  profileGradient: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  targetCard: {
    marginBottom: spacing.xl,
    borderRadius: radius.xl + 4,
    overflow: 'hidden',
    ...shadow.xl,
  },
  targetGradient: {
    padding: spacing.lg + 4,
  },
  mockTestButton: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  mockTestButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  mockTestButtonText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  targetContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  targetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  targetLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.xs,
  },
  targetExam: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  daysContainer: {
    alignItems: 'flex-end',
  },
  daysNumber: {
    ...typography.display,
    color: '#FFFFFF',
    lineHeight: 40,
    fontWeight: '800',
  },
  daysLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  goalCard: {
    marginBottom: spacing.xl,
    borderRadius: radius.xl + 4,
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  goalTitle: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  goalSubtitle: {
    ...typography.body,
    color: colors.authTextSecondary,
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  goalMotivation: {
    ...typography.body,
    color: colors.authTextSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.authTextSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'stretch',
  },
  quickActionWrapper: {
    flex: 1,
    minWidth: 0,
  },
  quickActionButton: {
    width: '100%',
    borderRadius: radius.xl + 4,
    overflow: 'hidden',
    ...shadow.xl,
    height: 110,
  },
  quickActionGradient: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  quickActionIconContainer: {
    marginBottom: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 11,
    letterSpacing: 0.2,
    lineHeight: 14,
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
  metricLabel: {
    ...typography.caption,
    color: colors.authTextMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  metricValue: {
    ...typography.h2,
    color: colors.authText,
    fontWeight: '700',
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
    borderTopColor: colors.authBorder,
  },
  streakItem: {
    alignItems: 'center',
  },
  streakLabel: {
    ...typography.caption,
    color: colors.authTextMuted,
    marginBottom: spacing.xs,
    fontSize: 12,
  },
  streakValue: {
    ...typography.h2,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 24,
  },
});
