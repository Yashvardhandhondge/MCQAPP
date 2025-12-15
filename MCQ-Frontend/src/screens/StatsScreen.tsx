import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getUserProgress, getTestReports, getTimeSeriesAnalytics } from '../services/mcq.service';
import type {
  SubjectChapterStats,
  SubjectChapterYearStats,
  UserProgressData,
  TestReport,
} from '../types/mcq';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing, typography, shadow } from '../theme';
import ModernCard from '../components/ui/ModernCard';
import ProgressBar from '../components/ui/ProgressBar';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import PieChart from '../components/charts/PieChart';
import QuestionHeatmap from '../components/charts/QuestionHeatmap';

const clampPercent = (value: number | null | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
};

const formatAttempts = (correct: number, total: number) => {
  if (total === 0) {
    return '0/0 correct';
  }
  return `${correct}/${total} correct`;
};

const aggregateFromList = (list: { totalAttempts: number; correctAttempts: number }[]) => {
  return list.reduce(
    (acc, item) => {
      acc.totalAttempts += item.totalAttempts;
      acc.correctAttempts += item.correctAttempts;
      return acc;
    },
    { totalAttempts: 0, correctAttempts: 0 },
  );
};

// Animated Number Component
const AnimatedNumber = ({ value, style }: { value: number; style?: any }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value]);

  return <Text style={style}>{displayValue.toLocaleString()}</Text>;
};

// Metric Card Component with Animation
const MetricCard = ({
  label,
  value,
  icon,
  gradient,
}: {
  label: string;
  value: number;
  icon: string;
  gradient: string[];
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.metricBox,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={gradient as [string, string, ...string[]]}
        style={styles.metricGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.metricIconContainer}>
          <Ionicons name={icon as any} size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.metricLabel}>{label}</Text>
        <AnimatedNumber value={value} style={styles.metricValue} />
      </LinearGradient>
    </Animated.View>
  );
};

export default function StatsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();
  const isPremium = user?.subscription === 'premium';
  const [progress, setProgress] = useState<UserProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedChapterSubjects, setExpandedChapterSubjects] = useState<Record<string, boolean>>({});
  const [expandedYearSubjects, setExpandedYearSubjects] = useState<Record<string, boolean>>({});
  const [expandedYearChapters, setExpandedYearChapters] = useState<Record<string, boolean>>({});
  const [testReports, setTestReports] = useState<TestReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [expandedTestSubjects, setExpandedTestSubjects] = useState<Record<string, boolean>>({});
  const [timeSeriesData, setTimeSeriesData] = useState<any>(null);
  const [loadingTimeSeries, setLoadingTimeSeries] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [dailyActivity, setDailyActivity] = useState<Array<{ date: string; totalAttempts: number; totalQuestions?: number }>>([]);
  const [loadingDailyActivity, setLoadingDailyActivity] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start visible, then animate if needed
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
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

  useEffect(() => {
    let isMounted = true;

    const loadProgress = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getUserProgress();
        if (isMounted) {
          setProgress(response.data);
        }
      } catch (requestError) {
        if (isMounted) {
          const message =
            requestError instanceof Error ? requestError.message : 'Failed to load progress';
          setError(message);
          setProgress(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTestReports = async () => {
      setLoadingReports(true);
      try {
        const response = await getTestReports();
        if (isMounted) {
          setTestReports(response.data);
        }
      } catch (requestError) {
        console.error('Failed to load test reports:', requestError);
        if (isMounted) {
          setTestReports([]);
        }
      } finally {
        if (isMounted) {
          setLoadingReports(false);
        }
      }
    };

    loadTestReports();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTimeSeries = async () => {
      setLoadingTimeSeries(true);
      try {
        const response = await getTimeSeriesAnalytics({ period: selectedPeriod, groupBy: 'day' });
        if (isMounted) {
          setTimeSeriesData(response.data);
        }
      } catch (requestError) {
        console.error('Failed to load time-series analytics:', requestError);
        if (isMounted) {
          setTimeSeriesData(null);
        }
      } finally {
        if (isMounted) {
          setLoadingTimeSeries(false);
        }
      }
    };

    loadTimeSeries();

    return () => {
      isMounted = false;
    };
  }, [selectedPeriod]);

  useEffect(() => {
    let isMounted = true;

    const loadDailyActivity = async () => {
      setLoadingDailyActivity(true);
      try {
        const response = await getTimeSeriesAnalytics({ period: '1y', groupBy: 'day' });
        if (isMounted) {
          setDailyActivity(response.data.timeSeries || []);
        }
      } catch (requestError) {
        console.error('Failed to load daily activity heatmap:', requestError);
        if (isMounted) {
          setDailyActivity([]);
        }
      } finally {
        if (isMounted) {
          setLoadingDailyActivity(false);
        }
      }
    };

    loadDailyActivity();

    return () => {
      isMounted = false;
    };
  }, []);

  const chaptersBySubject = useMemo(() => {
    if (!progress) {
      return {} as Record<string, SubjectChapterStats[]>;
    }
    const grouped: Record<string, SubjectChapterStats[]> = {};
    progress.perSubjectChapter.forEach((item) => {
      if (!grouped[item.subject]) {
        grouped[item.subject] = [];
      }
      grouped[item.subject].push(item);
    });
    Object.keys(grouped).forEach((subject) => {
      grouped[subject].sort((a, b) => a.chapter.localeCompare(b.chapter));
    });
    return grouped;
  }, [progress]);

  const yearTree = useMemo(() => {
    if (!progress) {
      return {} as Record<string, Record<string, SubjectChapterYearStats[]>>;
    }
    const grouped: Record<string, Record<string, SubjectChapterYearStats[]>> = {};
    progress.perSubjectChapterYear.forEach((item) => {
      if (!grouped[item.subject]) {
        grouped[item.subject] = {};
      }
      if (!grouped[item.subject][item.chapter]) {
        grouped[item.subject][item.chapter] = [];
      }
      grouped[item.subject][item.chapter].push(item);
    });
    Object.keys(grouped).forEach((subject) => {
      Object.keys(grouped[subject]).forEach((chapter) => {
        grouped[subject][chapter].sort((a, b) => a.year.localeCompare(b.year));
      });
    });
    return grouped;
  }, [progress]);

  const dailyActivityHeatmap = useMemo(() => {
    if (!dailyActivity || dailyActivity.length === 0) {
      return [] as Array<{ date: string; count: number }>;
    }
    return dailyActivity.map((item) => ({
      date: item.date,
      count: item.totalAttempts ?? item.totalQuestions ?? 0,
    }));
  }, [dailyActivity]);

  // Group test reports by subject
  const testReportsBySubject = useMemo(() => {
    const grouped: Record<string, TestReport[]> = {};
    const practiceTests: TestReport[] = [];
    
    testReports.forEach((report) => {
      // If it's a random/practice test (testType is 'practice' and no subject/chapter/year)
      const isPracticeTest = report.testType === 'practice' && !report.subject && !report.chapter && !report.year;
      
      if (isPracticeTest) {
        practiceTests.push(report);
      } else if (report.subject) {
        if (!grouped[report.subject]) {
          grouped[report.subject] = [];
        }
        grouped[report.subject].push(report);
      } else {
        // Tests without subject but with other info - group under "Other Tests"
        if (!grouped['Other Tests']) {
          grouped['Other Tests'] = [];
        }
        grouped['Other Tests'].push(report);
      }
    });
    
    // Add practice tests as a separate group
    if (practiceTests.length > 0) {
      // Sort practice tests by completedAt (newest first)
      practiceTests.sort((a, b) => 
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );
      grouped['Practice Tests'] = practiceTests;
    }
    
    // Sort reports by completedAt (newest first) within each subject
    Object.keys(grouped).forEach((subject) => {
      grouped[subject].sort((a, b) => 
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );
    });
    return grouped;
  }, [testReports]);

  // Calculate test statistics
  const testStats = useMemo(() => {
    if (testReports.length === 0) {
      return {
        totalTests: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        averageAccuracy: 0,
        totalDuration: 0,
      };
    }
    const totalTests = testReports.length;
    const totalQuestions = testReports.reduce((sum, r) => sum + r.total, 0);
    const totalCorrect = testReports.reduce((sum, r) => sum + r.score, 0);
    const averageAccuracy = testReports.reduce((sum, r) => sum + parseFloat(r.accuracy), 0) / totalTests;
    const totalDuration = testReports.reduce((sum, r) => sum + r.duration, 0);
    return {
      totalTests,
      totalQuestions,
      totalCorrect,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      totalDuration,
    };
  }, [testReports]);

  const toggleChapterSubject = (subject: string) => {
    setExpandedChapterSubjects((prev) => ({ ...prev, [subject]: !prev[subject] }));
  };

  const toggleYearSubject = (subjectKey: string) => {
    setExpandedYearSubjects((prev) => ({ ...prev, [subjectKey]: !prev[subjectKey] }));
  };

  const toggleYearChapter = (chapterKey: string) => {
    setExpandedYearChapters((prev) => ({ ...prev, [chapterKey]: !prev[chapterKey] }));
  };

  const overallData = progress?.overall || {
    totalAttempts: 0,
    totalCorrect: 0,
    accuracy: 0,
  };
  const overallPercent = clampPercent(overallData.accuracy);
  const hasAttempts = overallData.totalAttempts > 0;

  const renderChapterSections = () => {
    const entries = Object.entries(chaptersBySubject);
    if (entries.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="book-outline" size={48} color={colors.authTextMuted} />
          <Text style={styles.emptyStateText}>No chapter attempts yet</Text>
          <Text style={styles.emptyStateSubtext}>Start practicing chapters to see your progress</Text>
        </View>
      );
    }

    return entries.map(([subject, chapters]) => {
      const totals = aggregateFromList(chapters);
      const accuracy = totals.totalAttempts > 0
        ? clampPercent((totals.correctAttempts / totals.totalAttempts) * 100)
        : 0;
      const isOpen = expandedChapterSubjects[subject];
      return (
        <View key={subject} style={styles.collapseGroup}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.collapseHeader}
            onPress={() => toggleChapterSubject(subject)}
          >
            <View style={styles.subjectInfoRow}>
              <View style={styles.collapseSubjectIconWrapper}>
                <LinearGradient
                  colors={
                    subject === 'Chemistry' ? ['#8B5CF6', '#7C3AED'] :
                    subject === 'Physics' ? ['#6366F1', '#4F46E5'] :
                    subject === 'Maths' ? ['#10B981', '#059669'] :
                    ['#F59E0B', '#D97706']
                  }
                  style={styles.collapseSubjectIconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons 
                    name={
                      subject === 'Chemistry' ? 'flask' :
                      subject === 'Physics' ? 'nuclear' :
                      subject === 'Maths' ? 'calculator' :
                      'leaf'
                    } 
                    size={18} 
                    color="#FFFFFF" 
                  />
                </LinearGradient>
              </View>
              <View style={styles.subjectInfo}>
                <Text style={styles.subjectName}>{subject}</Text>
                <Text style={styles.subjectMeta}>
                  {formatAttempts(totals.correctAttempts, totals.totalAttempts)}
                </Text>
              </View>
            </View>
            <View style={styles.collapseMeta}>
              <View style={styles.accuracyBadge}>
                <Text style={styles.subjectAccuracy}>{accuracy}%</Text>
              </View>
              <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.primary} />
            </View>
          </TouchableOpacity>
          {isOpen && (
            <View style={styles.collapseBodySimplified}>
              {chapters.map((chapter) => {
                const chapterAccuracy = clampPercent(chapter.accuracy);
                return (
                  <TouchableOpacity
                    key={`${subject}-${chapter.chapter}`}
                    style={styles.chapterRowSimplified}
                    activeOpacity={0.7}
                  >
                    <View style={styles.chapterInfo}>
                      <Text style={styles.chapterName} numberOfLines={1}>{chapter.chapter}</Text>
                      <Text style={styles.chapterMeta}>
                        {formatAttempts(chapter.correctAttempts, chapter.totalAttempts)}
                      </Text>
                    </View>
                    <View style={styles.chapterAccuracySimple}>
                      <Text style={styles.chapterAccuracyText}>{chapterAccuracy}%</Text>
                      <View style={styles.chapterProgressBarSimple}>
                        <View
                          style={[
                            styles.chapterProgressFillSimple,
                            { width: `${chapterAccuracy}%` },
                            { backgroundColor: colors.accent }
                          ]}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      );
    });
  };

  const renderYearSections = () => {
    const entries = Object.entries(yearTree);
    if (entries.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="calendar-outline" size={48} color={colors.authTextMuted} />
          <Text style={styles.emptyStateText}>No year-wise attempts yet</Text>
          <Text style={styles.emptyStateSubtext}>Practice questions by year to track your progress</Text>
        </View>
      );
    }

    return entries.map(([subject, chapters]) => {
      const subjectKey = `year-${subject}`;
      const subjectYearEntries = Object.values(chapters).reduce<SubjectChapterYearStats[]>(
        (acc, items) => acc.concat(items),
        [],
      );
      const subjectTotals = aggregateFromList(subjectYearEntries);
      const subjectAccuracy = subjectTotals.totalAttempts > 0
        ? clampPercent((subjectTotals.correctAttempts / subjectTotals.totalAttempts) * 100)
        : 0;
      const subjectOpen = expandedYearSubjects[subjectKey];

      return (
        <View key={subjectKey} style={styles.collapseGroup}>
          <TouchableOpacity
            style={styles.collapseHeader}
            activeOpacity={0.85}
            onPress={() => toggleYearSubject(subjectKey)}
          >
            <View style={styles.subjectInfoRow}>
              <View style={styles.collapseSubjectIconWrapper}>
                <LinearGradient
                  colors={
                    subject === 'Chemistry' ? ['#8B5CF6', '#7C3AED'] :
                    subject === 'Physics' ? ['#6366F1', '#4F46E5'] :
                    subject === 'Maths' ? ['#10B981', '#059669'] :
                    ['#F59E0B', '#D97706']
                  }
                  style={styles.collapseSubjectIconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons 
                    name={
                      subject === 'Chemistry' ? 'flask' :
                      subject === 'Physics' ? 'nuclear' :
                      subject === 'Maths' ? 'calculator' :
                      'leaf'
                    } 
                    size={18} 
                    color="#FFFFFF" 
                  />
                </LinearGradient>
              </View>
              <View style={styles.subjectInfo}>
                <Text style={styles.subjectName}>{subject}</Text>
                <Text style={styles.subjectMeta}>
                  {formatAttempts(subjectTotals.correctAttempts, subjectTotals.totalAttempts)}
                </Text>
              </View>
            </View>
            <View style={styles.collapseMeta}>
              <View style={styles.accuracyBadge}>
                <Text style={styles.subjectAccuracy}>{subjectAccuracy}%</Text>
              </View>
              <Ionicons name={subjectOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.primary} />
            </View>
          </TouchableOpacity>
          {subjectOpen && (
            <View style={styles.yearSubjectBody}>
              {Object.entries(chapters).map(([chapterName, years]) => {
                const chapterKey = `${subjectKey}-${chapterName}`;
                const chapterTotals = aggregateFromList(years);
                const chapterAccuracy = chapterTotals.totalAttempts > 0
                  ? clampPercent((chapterTotals.correctAttempts / chapterTotals.totalAttempts) * 100)
                  : 0;
                const chapterOpen = expandedYearChapters[chapterKey];

                return (
                  <View key={chapterKey} style={styles.nestedChapterGroupSimplified}>
                    <TouchableOpacity
                      style={styles.nestedHeaderSimplified}
                      activeOpacity={0.85}
                      onPress={() => toggleYearChapter(chapterKey)}
                    >
                      <View style={styles.chapterInfo}>
                        <Text style={styles.chapterName} numberOfLines={1}>{chapterName}</Text>
                        <Text style={styles.chapterMeta}>
                          {formatAttempts(chapterTotals.correctAttempts, chapterTotals.totalAttempts)}
                        </Text>
                      </View>
                      <View style={styles.nestedChapterMeta}>
                        <Text style={styles.chapterAccuracyText}>{chapterAccuracy}%</Text>
                        <Ionicons name={chapterOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
                      </View>
                    </TouchableOpacity>
                    {chapterOpen && (
                      <View style={styles.yearListSimplified}>
                        {years.map((entry) => {
                          const yearAccuracy = clampPercent(entry.accuracy);
                          return (
                            <TouchableOpacity
                              key={`${chapterKey}-${entry.year}`}
                              style={styles.yearRowSimplified}
                              activeOpacity={0.7}
                            >
                              <View style={styles.yearInfo}>
                                <Text style={styles.yearLabel}>{entry.year}</Text>
                                <Text style={styles.yearAttempts}>
                                  {formatAttempts(entry.correctAttempts, entry.totalAttempts)}
                                </Text>
                              </View>
                              <View style={styles.yearAccuracySimple}>
                                <Text style={styles.yearAccuracyText}>{yearAccuracy}%</Text>
                                <View style={styles.yearProgressBarSimple}>
                                  <View
                                    style={[
                                      styles.yearProgressFillSimple,
                                      { width: `${yearAccuracy}%` },
                                      { backgroundColor: colors.primary }
                                    ]}
                                  />
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      );
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={colors.gradientAuthLight as [string, string, ...string[]]} style={styles.backgroundGradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={colors.gradientAuthLight as [string, string, ...string[]]} style={styles.backgroundGradient}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color={colors.danger} />
            <Text style={styles.errorText}>Could not load stats: {error}</Text>
            <TouchableOpacity
              onPress={() => {
                setError(null);
                setLoading(true);
              }}
              style={styles.retryButton}
            >
              <LinearGradient colors={colors.gradientPrimary as [string, string, ...string[]]} style={styles.retryGradient}>
                <Text style={styles.retryText}>Retry</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={colors.gradientAuthLight as [string, string, ...string[]]} style={styles.backgroundGradient}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Header */}
            <LinearGradient
              colors={colors.gradientPrimary as [string, string, ...string[]]}
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerIconContainer}>
                  <Ionicons name="analytics" size={36} color="#FFFFFF" />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.title}>Analytics Dashboard</Text>
                  <Text style={styles.subtitle}>Track your learning journey</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Overall Performance Card */}
            <ModernCard variant="elevated" padding="lg" style={styles.overallCard}>
              <View style={styles.cardHeader}>
                <View style={styles.sectionHeaderContainer}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="trophy" size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Overall Performance</Text>
                </View>
              </View>

              <View style={styles.metricRow}>
                <MetricCard
                  label="Attempts"
                  value={overallData.totalAttempts}
                  icon="checkmark-circle-outline"
                  gradient={colors.gradientPrimary}
                />
                <MetricCard
                  label="Correct"
                  value={overallData.totalCorrect}
                  icon="checkmark-done-circle-outline"
                  gradient={colors.gradientAccent}
                />
                <MetricCard
                  label="Accuracy"
                  value={overallPercent}
                  icon="trophy-outline"
                  gradient={['#FFD700', '#FFA500']}
                />
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressBarContainer}>
                  <ProgressBar progress={overallPercent} height={12} variant="primary" />
                </View>
                <Text style={styles.accuracyCaption}>
                  {formatAttempts(overallData.totalCorrect, overallData.totalAttempts)}
                </Text>
              </View>

              {!hasAttempts && (
                <View style={styles.zeroStateBanner}>
                  <Ionicons name="rocket-outline" size={20} color={colors.primary} />
                  <Text style={styles.zeroStateBannerText}>
                    Start practicing to build your analytics!
                  </Text>
                </View>
              )}
            </ModernCard>

            {/* Daily Question Streaks */}
            <ModernCard variant="elevated" padding="lg" style={styles.sectionCard}>
              <View style={styles.sectionHeaderContainer}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="calendar" size={24} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>Daily Question Streak</Text>
              </View>

              {loadingDailyActivity ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                <QuestionHeatmap data={dailyActivityHeatmap} />
              )}
            </ModernCard>

            {/* Performance Trends - Time Series Chart */}
            {timeSeriesData && timeSeriesData.timeSeries.length > 0 && (
              <ModernCard variant="elevated" padding="lg" style={styles.sectionCard}>
                <View style={styles.sectionHeaderContainer}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="trending-up" size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Performance Trends</Text>
                </View>
                
                {/* Period Selector */}
                <View style={styles.periodSelector}>
                  {(['7d', '30d', '90d', '1y'] as const).map((period) => (
                    <TouchableOpacity
                      key={period}
                      onPress={() => setSelectedPeriod(period)}
                      style={[
                        styles.periodButton,
                        selectedPeriod === period && styles.periodButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.periodButtonText,
                          selectedPeriod === period && styles.periodButtonTextActive,
                        ]}
                      >
                        {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : period === '90d' ? '90 Days' : '1 Year'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {loadingTimeSeries ? (
                  <View style={styles.chartLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : (
                  <>
                    <LineChart
                      data={timeSeriesData.timeSeries.map((item: any) => item.accuracy)}
                      labels={timeSeriesData.timeSeries.map((item: any) => {
                        const date = new Date(item.date);
                        if (selectedPeriod === '7d' || selectedPeriod === '30d') {
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }
                        return item.date;
                      })}
                      title="Accuracy Over Time"
                      yAxisSuffix="%"
                      color={colors.primary}
                    />
                    <LineChart
                      data={timeSeriesData.timeSeries.map((item: any) => item.totalAttempts)}
                      labels={timeSeriesData.timeSeries.map((item: any) => {
                        const date = new Date(item.date);
                        if (selectedPeriod === '7d' || selectedPeriod === '30d') {
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }
                        return item.date;
                      })}
                      title="Daily Activity"
                      yAxisSuffix=" questions"
                      color={colors.accent}
                    />
                  </>
                )}
              </ModernCard>
            )}

            {/* Subject Distribution Pie Chart */}
            {progress && progress.perSubject.length > 0 && (
              <ModernCard variant="elevated" padding="lg" style={styles.sectionCard}>
                <View style={styles.sectionHeaderContainer}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="pie-chart" size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Subject Distribution</Text>
                </View>
                {isPremium ? (
                  <PieChart
                    data={progress.perSubject.map((item) => ({
                      name: item.subject,
                      value: item.totalAttempts,
                      color:
                        item.subject === 'Chemistry'
                          ? '#8B5CF6'
                          : item.subject === 'Physics'
                          ? '#6366F1'
                          : item.subject === 'Maths'
                          ? '#10B981'
                          : '#F59E0B',
                      legendFontColor: colors.authText,
                      legendFontSize: 12,
                    }))}
                    title="Questions by Subject"
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('PremiumPurchase')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.lockedSectionContent}>
                      <LinearGradient
                        colors={['#64748B', '#475569'] as [string, string, ...string[]]}
                        style={styles.lockedSectionGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Ionicons name="lock-closed" size={48} color="#FFFFFF" />
                        <Text style={styles.lockedSectionText}>Premium Feature</Text>
                        <Text style={styles.lockedSectionSubtext}>
                          Upgrade to unlock custom analytics
                        </Text>
                      </LinearGradient>
                    </View>
                  </TouchableOpacity>
                )}
              </ModernCard>
            )}

            {/* Subject Performance Bar Chart */}
            {progress && progress.perSubject.length > 0 && isPremium && (
              <ModernCard variant="elevated" padding="lg" style={styles.sectionCard}>
                <View style={styles.sectionHeaderContainer}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="bar-chart" size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Subject Performance Comparison</Text>
                </View>
                <BarChart
                  data={progress.perSubject.map((item) => clampPercent(item.accuracy))}
                  labels={progress.perSubject.map((item) => item.subject.substring(0, 4))}
                  title="Accuracy by Subject"
                  yAxisSuffix="%"
                  color={colors.primary}
                />
              </ModernCard>
            )}

            {/* By Subject */}
            <ModernCard variant="elevated" padding="lg" style={styles.sectionCard}>
              <View style={styles.sectionHeaderContainer}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="library" size={24} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>By Subject</Text>
                {!isPremium && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('PremiumPurchase')}
                    style={styles.lockButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="lock-closed" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
              {!isPremium ? (
                <TouchableOpacity
                  onPress={() => navigation.navigate('PremiumPurchase')}
                  activeOpacity={0.8}
                >
                  <View style={styles.lockedSectionContent}>
                    <LinearGradient
                      colors={['#64748B', '#475569'] as [string, string, ...string[]]}
                      style={styles.lockedSectionGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="lock-closed" size={48} color="#FFFFFF" />
                      <Text style={styles.lockedSectionText}>Premium Feature</Text>
                      <Text style={styles.lockedSectionSubtext}>
                        Upgrade to see subject-wise distribution
                      </Text>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
              ) : !progress || progress.perSubject.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="library-outline" size={40} color={colors.authTextMuted} />
                  <Text style={styles.emptyStateText}>No subject attempts yet</Text>
                </View>
              ) : (
                <View style={styles.subjectList}>
                  {progress.perSubject.map((item, index) => {
                    const accuracy = clampPercent(item.accuracy);
                    return (
                      <Animated.View
                        key={item.subject}
                        style={{
                          opacity: fadeAnim,
                          transform: [
                            {
                              translateY: slideAnim.interpolate({
                                inputRange: [0, 30],
                                outputRange: [0, 10 + index * 5],
                              }),
                            },
                          ],
                        }}
                      >
                        <TouchableOpacity
                          style={styles.subjectRowTouchable}
                          activeOpacity={0.7}
                        >
                          <View style={styles.subjectRow}>
                            <View style={styles.subjectIconWrapper}>
                              <LinearGradient
                                colors={
                                  item.subject === 'Chemistry' ? ['#8B5CF6', '#7C3AED'] :
                                  item.subject === 'Physics' ? ['#6366F1', '#4F46E5'] :
                                  item.subject === 'Maths' ? ['#10B981', '#059669'] :
                                  ['#F59E0B', '#D97706']
                                }
                                style={styles.subjectIconGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                              >
                                <Ionicons 
                                  name={
                                    item.subject === 'Chemistry' ? 'flask' :
                                    item.subject === 'Physics' ? 'nuclear' :
                                    item.subject === 'Maths' ? 'calculator' :
                                    'leaf'
                                  } 
                                  size={20} 
                                  color="#FFFFFF" 
                                />
                              </LinearGradient>
                            </View>
                            <View style={styles.subjectInfo}>
                              <Text style={styles.subjectName}>{item.subject}</Text>
                              <View style={styles.subjectMetaRow}>
                                <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
                                <Text style={styles.subjectMeta}>
                                  {formatAttempts(item.correctAttempts, item.totalAttempts)}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.subjectAccuracyContainer}>
                              <View style={styles.accuracyBadge}>
                                <Text style={styles.subjectAccuracy}>{accuracy}%</Text>
                              </View>
                              <View style={styles.miniProgressBar}>
                                <LinearGradient
                                  colors={
                                    item.subject === 'Chemistry' ? ['#8B5CF6', '#7C3AED'] :
                                    item.subject === 'Physics' ? ['#6366F1', '#4F46E5'] :
                                    item.subject === 'Maths' ? ['#10B981', '#059669'] :
                                    ['#F59E0B', '#D97706']
                                  }
                                  style={[styles.miniProgressFill, { width: `${accuracy}%` }]}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                />
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
              )}
            </ModernCard>

            {/* By Chapter */}
            <ModernCard variant="elevated" padding="lg" style={styles.sectionCard}>
              <View style={styles.sectionHeaderContainer}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="book" size={24} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>By Chapter</Text>
                {!isPremium && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('PremiumPurchase')}
                    style={styles.lockButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="lock-closed" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
              {!isPremium ? (
                <TouchableOpacity
                  onPress={() => navigation.navigate('PremiumPurchase')}
                  activeOpacity={0.8}
                >
                  <View style={styles.lockedSectionContent}>
                    <LinearGradient
                      colors={['#64748B', '#475569'] as [string, string, ...string[]]}
                      style={styles.lockedSectionGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="lock-closed" size={48} color="#FFFFFF" />
                      <Text style={styles.lockedSectionText}>Premium Feature</Text>
                      <Text style={styles.lockedSectionSubtext}>
                        Upgrade to see chapter-wise distribution
                      </Text>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
              ) : (
                renderChapterSections()
              )}
            </ModernCard>

            {/* By Year */}
            <ModernCard variant="elevated" padding="lg" style={styles.sectionCard}>
              <View style={styles.sectionHeaderContainer}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="calendar" size={24} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>By Year</Text>
                {!isPremium && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('PremiumPurchase')}
                    style={styles.lockButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="lock-closed" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
              {!isPremium ? (
                <TouchableOpacity
                  onPress={() => navigation.navigate('PremiumPurchase')}
                  activeOpacity={0.8}
                >
                  <View style={styles.lockedSectionContent}>
                    <LinearGradient
                      colors={['#64748B', '#475569'] as [string, string, ...string[]]}
                      style={styles.lockedSectionGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="lock-closed" size={48} color="#FFFFFF" />
                      <Text style={styles.lockedSectionText}>Premium Feature</Text>
                      <Text style={styles.lockedSectionSubtext}>
                        Upgrade to see year-wise distribution
                      </Text>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
              ) : (
                renderYearSections()
              )}
            </ModernCard>

            {/* Test Reports & Analytics */}
            <ModernCard variant="elevated" padding="lg" style={styles.sectionCard}>
              <View style={styles.sectionHeaderContainer}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="document-text" size={24} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>Test Reports & Analytics</Text>
                {!isPremium && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('PremiumPurchase')}
                    style={styles.lockButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="lock-closed" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
              
              {!isPremium ? (
                <TouchableOpacity
                  onPress={() => navigation.navigate('PremiumPurchase')}
                  activeOpacity={0.8}
                >
                  <View style={styles.lockedSectionContent}>
                    <LinearGradient
                      colors={['#64748B', '#475569'] as [string, string, ...string[]]}
                      style={styles.lockedSectionGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="lock-closed" size={48} color="#FFFFFF" />
                      <Text style={styles.lockedSectionText}>Premium Feature</Text>
                      <Text style={styles.lockedSectionSubtext}>
                        Upgrade to see test reports and analytics
                      </Text>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
              ) : loadingReports ? (
                <View style={styles.testReportsLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.testReportsLoadingText}>Loading test reports...</Text>
                </View>
              ) : testReports.length === 0 ? (
                <View style={styles.testReportsEmpty}>
                  <Ionicons name="document-outline" size={48} color={colors.authTextMuted} />
                  <Text style={styles.testReportsEmptyText}>No test reports yet</Text>
                  <Text style={styles.testReportsEmptySubtext}>
                    Complete tests to see your analytics here
                  </Text>
                </View>
              ) : (
                <>
                  {/* Test Statistics - Simplified to 2 main cards */}
                  <View style={styles.testStatsGridSimplified}>
                    <LinearGradient
                      colors={colors.gradientPrimary as [string, string, ...string[]]}
                      style={styles.testStatCardMain}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.testStatIconMain}>
                        <Ionicons name="document-text" size={28} color="#FFFFFF" />
                      </View>
                      <Text style={styles.testStatValueMain}>{testStats.totalTests}</Text>
                      <Text style={styles.testStatLabelMain}>Total Tests</Text>
                    </LinearGradient>
                    <LinearGradient
                      colors={colors.gradientAccent as [string, string, ...string[]]}
                      style={styles.testStatCardMain}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.testStatIconMain}>
                        <Ionicons name="checkmark-circle" size={28} color="#FFFFFF" />
                      </View>
                      <Text style={styles.testStatValueMain}>{testStats.totalCorrect}</Text>
                      <Text style={styles.testStatLabelMain}>Total Correct</Text>
                    </LinearGradient>
                  </View>
                  
                  {/* Additional stats in a compact row */}
                  <View style={styles.testStatsCompactRow}>
                    <View style={styles.testStatCompact}>
                      <Ionicons name="trophy" size={18} color={colors.warning} />
                      <Text style={styles.testStatCompactText}>{testStats.averageAccuracy}% accuracy</Text>
                    </View>
                    <View style={styles.testStatCompact}>
                      <Ionicons name="time" size={18} color={colors.warning} />
                      <Text style={styles.testStatCompactText}>
                        {Math.floor(testStats.totalDuration / 3600)}h {Math.floor((testStats.totalDuration % 3600) / 60)}m
                      </Text>
                    </View>
                  </View>

                  {/* Test Reports by Subject */}
                  {Object.keys(testReportsBySubject).length > 0 && (
                    <View style={styles.testReportsList}>
                      {Object.keys(testReportsBySubject).map((subject) => {
                        const reports = testReportsBySubject[subject];
                        const isExpanded = expandedTestSubjects[subject];
                        const subjectStats = reports.reduce(
                          (acc, r) => ({
                            total: acc.total + r.total,
                            correct: acc.correct + r.score,
                            tests: acc.tests + 1,
                          }),
                          { total: 0, correct: 0, tests: 0 }
                        );
                        const subjectAccuracy = subjectStats.total > 0
                          ? Math.round((subjectStats.correct / subjectStats.total) * 100)
                          : 0;

                        return (
                          <View key={subject} style={styles.testSubjectGroupClean}>
                            <TouchableOpacity
                              onPress={() => setExpandedTestSubjects((prev) => ({ ...prev, [subject]: !prev[subject] }))}
                              style={styles.testSubjectHeaderClean}
                              activeOpacity={0.7}
                            >
                              <View style={styles.testSubjectHeaderLeft}>
                                <View style={styles.testSubjectIconClean}>
                                  <Ionicons name="book" size={18} color={colors.primary} />
                                </View>
                                <View style={styles.testSubjectInfo}>
                                  <Text style={styles.testSubjectName}>{subject}</Text>
                                  <Text style={styles.testSubjectMeta}>
                                    {subjectStats.tests} test{subjectStats.tests !== 1 ? 's' : ''} • {subjectAccuracy}% accuracy
                                  </Text>
                                </View>
                              </View>
                              <Ionicons
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={colors.authTextMuted}
                              />
                            </TouchableOpacity>

                            {isExpanded && (
                              <View style={styles.testReportsGroup}>
                                {reports.map((report, index) => {
                                  // Determine test title
                                  let testTitle = '';
                                  const isPracticeTest = subject === 'Practice Tests' || (report.testType === 'practice' && !report.subject && !report.chapter && !report.year);
                                  
                                  if (isPracticeTest) {
                                    // Number practice tests: Practice Test 1, Practice Test 2, etc.
                                    // Since reports are sorted newest first, we reverse the index to show oldest as 1
                                    const practiceTestNumber = reports.length - index;
                                    testTitle = `Practice Test ${practiceTestNumber}`;
                                  } else if (report.chapter) {
                                    testTitle = report.chapter;
                                  } else if (report.year && report.shift) {
                                    testTitle = `${report.year} - Shift ${report.shift}`;
                                  } else if (report.year) {
                                    testTitle = `${report.year}`;
                                  } else {
                                    testTitle = 'Practice Test';
                                  }
                                  
                                  return (
                                  <TouchableOpacity
                                    key={report.sessionId}
                                    style={styles.testReportItemClean}
                                    onPress={() => navigation.navigate('TestResults', { sessionId: report.sessionId })}
                                    activeOpacity={0.7}
                                  >
                                    <View style={styles.testReportItemContent}>
                                      <View style={styles.testReportItemInfo}>
                                        <Text style={styles.testReportItemTitle}>
                                          {testTitle}
                                        </Text>
                                        <Text style={styles.testReportItemMeta}>
                                          {new Date(report.completedAt).toLocaleDateString()} • {Math.floor(report.duration / 60)}m {report.duration % 60}s
                                        </Text>
                                      </View>
                                      <View style={styles.testReportItemScore}>
                                        <Text style={styles.testReportItemScoreText}>
                                          {report.score}/{report.total}
                                        </Text>
                                        <Text style={styles.testReportItemAccuracy}>
                                          {report.accuracy}%
                                        </Text>
                                      </View>
                                    </View>
                                  </TouchableOpacity>
                                  );
                                })}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </>
              )}
            </ModernCard>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.authText,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
    fontWeight: '600',
  },
  retryButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: spacing.md,
    ...shadow.md,
  },
  retryGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  retryText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerGradient: {
    borderRadius: radius.xl + 6,
    padding: spacing.xxl,
    marginBottom: spacing.xxl,
    ...shadow.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.xl + 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    ...typography.h1,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: spacing.xs,
    fontSize: 28,
  },
  subtitle: {
    ...typography.subtitle,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
  },
  overallCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.authSurface,
    borderWidth: 1,
    borderColor: colors.authBorder,
    borderRadius: radius.xl + 2,
  },
  sectionCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.authSurface,
    borderWidth: 1,
    borderColor: colors.authBorder,
    borderRadius: radius.xl + 2,
  },
  cardHeader: {
    marginBottom: spacing.lg,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    flex: 1,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metricBox: {
    flex: 1,
    borderRadius: radius.xl + 4,
    overflow: 'hidden',
    ...shadow.lg,
  },
  metricGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  metricLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  metricValue: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressSection: {
    gap: spacing.sm,
  },
  progressBarContainer: {
    position: 'relative',
  },
  accuracyCaption: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.authTextMuted,
  },
  zeroStateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
  },
  zeroStateBannerText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.authTextMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyStateSubtext: {
    ...typography.caption,
    color: colors.authTextMuted,
    textAlign: 'center',
  },
  subjectList: {
    gap: spacing.sm,
  },
  subjectRowTouchable: {
    borderRadius: radius.lg,
    marginBottom: spacing.xs,
    backgroundColor: colors.authInputBg,
    overflow: 'hidden',
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  subjectIconWrapper: {
    marginRight: spacing.md,
  },
  subjectIconGradient: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    ...typography.title,
    color: colors.authText,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  subjectMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs / 2,
  },
  subjectMeta: {
    ...typography.caption,
    color: colors.authTextMuted,
    fontSize: 13,
  },
  subjectAccuracyContainer: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  accuracyBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  subjectAccuracy: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  miniProgressBar: {
    width: 80,
    height: 4,
    backgroundColor: colors.authInputBg,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  collapseGroup: {
    borderRadius: radius.xl + 2,
    marginBottom: spacing.md,
    backgroundColor: colors.authSurface,
    borderWidth: 1,
    borderColor: colors.authBorder,
    overflow: 'hidden',
    ...shadow.md,
  },
  collapseHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  collapseSubjectIconWrapper: {
    marginRight: spacing.md,
  },
  collapseSubjectIconGradient: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  collapseBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  collapseBodySimplified: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  chapterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
  },
  chapterRowSimplified: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.authBorder,
  },
  chapterInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  chapterName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.authText,
    marginBottom: spacing.xs,
  },
  chapterMeta: {
    ...typography.caption,
    color: colors.authTextMuted,
  },
  chapterAccuracyContainer: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    minWidth: 70,
    maxWidth: 90,
  },
  chapterAccuracyBadge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    alignSelf: 'flex-end',
  },
  chapterAccuracy: {
    ...typography.subtitle,
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  chapterProgressBar: {
    width: 70,
    height: 4,
    backgroundColor: colors.authInputBg,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  chapterProgressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  chapterAccuracySimple: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    minWidth: 60,
  },
  chapterAccuracyText: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  chapterProgressBarSimple: {
    width: 60,
    height: 3,
    backgroundColor: colors.authInputBg,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  chapterProgressFillSimple: {
    height: '100%',
    borderRadius: radius.full,
  },
  yearSubjectBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  nestedChapterGroup: {
    borderRadius: radius.lg,
    marginTop: spacing.sm,
    backgroundColor: colors.authSurface,
    borderWidth: 1,
    borderColor: colors.authBorder,
    overflow: 'hidden',
  },
  nestedChapterGroupSimplified: {
    marginTop: spacing.xs,
    backgroundColor: colors.authInputBg,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  nestedHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nestedHeaderSimplified: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nestedChapterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  yearList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  yearListSimplified: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
  },
  yearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    alignItems: 'center',
    gap: spacing.sm,
  },
  yearRowSimplified: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.authBorder,
  },
  yearInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  yearLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.authText,
    marginBottom: spacing.xs / 2,
  },
  yearAttempts: {
    ...typography.caption,
    color: colors.authTextMuted,
  },
  yearAccuracyContainer: {
    alignItems: 'flex-end',
    gap: spacing.xs / 2,
    minWidth: 70,
    maxWidth: 90,
  },
  yearAccuracyBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: 'flex-end',
  },
  yearAccuracy: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  yearProgressBar: {
    width: 70,
    height: 4,
    backgroundColor: colors.authInputBg,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  yearProgressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  yearAccuracySimple: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    minWidth: 60,
  },
  yearAccuracyText: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  yearProgressBarSimple: {
    width: 60,
    height: 3,
    backgroundColor: colors.authInputBg,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  yearProgressFillSimple: {
    height: '100%',
    borderRadius: radius.full,
  },
  testReportsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  testReportsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  testReportsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  testReportsLoadingText: {
    ...typography.body,
    color: colors.authTextMuted,
  },
  testReportsEmpty: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  testReportsEmptyText: {
    ...typography.subtitle,
    color: colors.authText,
    fontWeight: '600',
  },
  testReportsEmptySubtext: {
    ...typography.caption,
    color: colors.authTextMuted,
    textAlign: 'center',
  },
  testStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  testStatsGridSimplified: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  testStatCardMain: {
    flex: 1,
    borderRadius: radius.xl + 2,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    ...shadow.lg,
  },
  testStatIconMain: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  testStatValueMain: {
    ...typography.h1,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: spacing.xs,
    fontSize: 32,
  },
  testStatLabelMain: {
    ...typography.subtitle,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    fontWeight: '600',
  },
  testStatsCompactRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.authInputBg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  testStatCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  testStatCompactText: {
    ...typography.body,
    color: colors.authText,
    fontWeight: '600',
    fontSize: 14,
  },
  testStatCardGradient: {
    flex: 1,
    minWidth: '45%',
    borderRadius: radius.xl + 2,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.lg,
    minHeight: 120,
    justifyContent: 'center',
  },
  testStatIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  testStatValueGradient: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: spacing.xs,
    fontSize: 26,
  },
  testStatLabelGradient: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  testStatCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.authSurface,
    borderRadius: radius.xl,
    padding: spacing.md + 2,
    alignItems: 'center',
    ...shadow.md,
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  testStatValue: {
    ...typography.h2,
    color: colors.authText,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  testStatLabel: {
    ...typography.caption,
    color: colors.authTextMuted,
    marginTop: spacing.xs,
  },
  testReportsList: {
    gap: spacing.md,
  },
  testSubjectGroup: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...shadow.md,
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  testSubjectGroupSimplified: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  testSubjectGroupClean: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  testSubjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  testSubjectHeaderSimplified: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  testSubjectHeaderClean: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  testSubjectHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  testSubjectIconSimple: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testSubjectIconClean: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testSubjectInfo: {
    flex: 1,
  },
  testSubjectName: {
    ...typography.subtitle,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: spacing.xs / 2,
  },
  testSubjectMeta: {
    ...typography.caption,
    color: colors.authTextMuted,
    fontSize: 12,
  },
  testSubjectBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  testSubjectBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  testSubjectHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  testSubjectAccuracy: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '700',
  },
  testReportsGroup: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  testReportItem: {
    backgroundColor: colors.authBackground,
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    ...shadow.sm,
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  testReportItemClean: {
    backgroundColor: colors.authInputBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  testReportItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testReportItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  testReportItemInfo: {
    flex: 1,
  },
  testReportItemTitle: {
    ...typography.body,
    color: colors.authText,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  testReportItemMeta: {
    ...typography.caption,
    color: colors.authTextMuted,
  },
  testReportItemScore: {
    alignItems: 'flex-end',
  },
  testReportItemScoreText: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  testReportItemAccuracy: {
    ...typography.caption,
    color: colors.authTextMuted,
  },
  testReportItemFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.authBorder,
  },
  testReportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  testReportBadgeCorrect: {
    backgroundColor: '#D1FAE5',
  },
  testReportBadgeWrong: {
    backgroundColor: '#FEE2E2',
  },
  testReportBadgeText: {
    ...typography.caption,
    color: colors.authText,
    fontWeight: '600',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  periodButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.authInputBg,
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodButtonText: {
    ...typography.caption,
    color: colors.authText,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  chartLoading: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedMetricCard: {
    flex: 1,
    borderRadius: radius.xl + 4,
    overflow: 'hidden',
    ...shadow.lg,
  },
  lockedMetricGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  lockedMetricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    alignSelf: 'flex-end',
  },
  lockedMetricLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  lockedMetricContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  lockedSectionContent: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  lockedSectionGradient: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    gap: spacing.md,
  },
  lockedSectionText: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  lockedSectionSubtext: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontSize: 14,
  },
  lockButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  blurContent: {
    backgroundColor: colors.authSurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.authBorder,
    ...shadow.sm,
  },
  blurredTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  blurredText: {
    opacity: 0.4,
  },
  blurLockIcon: {
    marginLeft: spacing.xs / 2,
  },
});
