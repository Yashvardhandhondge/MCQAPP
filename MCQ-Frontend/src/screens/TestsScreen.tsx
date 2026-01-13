import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { AppStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing, typography, shadow } from '../theme';
import ModernCard from '../components/ui/ModernCard';
import GradientButton from '../components/ui/GradientButton';
import BackHeader from '../components/ui/BackHeader';
import { getDistinctYears, generateRandomTest } from '../services/mcq.service';

type FilterType = 'year' | 'subject';
type TestMode = 'select' | 'random';

const ALL_SUBJECTS = [
  { name: 'Chemistry', icon: 'flask', color: '#8B5CF6' },
  { name: 'Physics', icon: 'nuclear', color: '#3B82F6' },
  { name: 'Maths', icon: 'calculator', color: '#10B981' },
  { name: 'Biology', icon: 'leaf', color: '#F59E0B' },
];

// Subject groups mapping
const GROUP_SUBJECTS: Record<string, string[]> = {
  PCM: ['Chemistry', 'Physics', 'Maths'],
  PCB: ['Chemistry', 'Physics', 'Biology'],
  PCMB: ['Chemistry', 'Physics', 'Maths', 'Biology'],
};

const RANDOM_TEST_OPTIONS = [
  { count: 10, label: '10 Questions' },
  { count: 50, label: '50 Questions' },
  { count: 100, label: '100 Questions' },
];

export default function TestsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();
  const isPremium = user?.subscription === 'premium';
  
  // Filter subjects based on user's group
  const SUBJECTS = useMemo(() => {
    if (!user?.group) {
      return ALL_SUBJECTS;
    }
    const allowedSubjects = GROUP_SUBJECTS[user.group] || [];
    return ALL_SUBJECTS.filter(subj => allowedSubjects.includes(subj.name));
  }, [user?.group]);
  
  const [showTestOptions, setShowTestOptions] = useState(false);
  const [testMode, setTestMode] = useState<TestMode>('select');
  const [filter, setFilter] = useState<FilterType>('year');
  const [years, setYears] = useState<string[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingRandom, setGeneratingRandom] = useState<number | null>(null);
  const [generatingYearTest, setGeneratingYearTest] = useState<string | null>(null);
  const [generatingSubjectTest, setGeneratingSubjectTest] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
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

  // Fetch years when filter changes to 'year'
  useEffect(() => {
    if (filter === 'year') {
      let isMounted = true;

      async function fetchYears() {
        setLoadingYears(true);
        setError(null);
        try {
          const response = await getDistinctYears();
          if (isMounted) {
            setYears(response.data);
          }
        } catch (requestError) {
          if (isMounted) {
            const message =
              requestError instanceof Error ? requestError.message : 'Failed to load years';
            setError(message);
            setYears([]);
          }
        } finally {
          if (isMounted) {
            setLoadingYears(false);
          }
        }
      }

      fetchYears();

      return () => {
        isMounted = false;
      };
    }
  }, [filter]);

  const checkTestLimit = async (): Promise<boolean> => {
    if (isPremium) return true;
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
      return false;
    }
    return true;
  };

  const handleGenerateRandomTest = async (questionCount: number) => {
    if (!(await checkTestLimit())) return;
    
    setGeneratingRandom(questionCount);
    setError(null);
    try {
      const response = await generateRandomTest(questionCount);
      if (!isPremium) {
        const { incrementTestCount } = await import('../utils/testTracking');
        await incrementTestCount();
      }
      navigation.navigate('CBT', {
        testId: response.data.sessionId,
        questions: response.data.questions,
      });
    } catch (err) {
      console.error('Failed to generate random test:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate random test');
    } finally {
      setGeneratingRandom(null);
    }
  };

  const handleStartYearTest = async (year: string) => {
    if (!(await checkTestLimit())) return;
    
    setGeneratingYearTest(year);
    setError(null);
    try {
      const response = await generateRandomTest(25, year);
      if (!isPremium) {
        const { incrementTestCount } = await import('../utils/testTracking');
        await incrementTestCount();
      }
      navigation.navigate('CBT', {
        testId: response.data.sessionId,
        questions: response.data.questions,
      });
    } catch (err) {
      console.error('Failed to start year test:', err);
      setError(err instanceof Error ? err.message : 'Failed to start test');
    } finally {
      setGeneratingYearTest(null);
    }
  };

  const handleStartSubjectTest = async (subject: string) => {
    if (!(await checkTestLimit())) return;
    
    setGeneratingSubjectTest(subject);
    setError(null);
    try {
      const response = await generateRandomTest(25, undefined, subject);
      if (!isPremium) {
        const { incrementTestCount } = await import('../utils/testTracking');
        await incrementTestCount();
      }
      navigation.navigate('CBT', {
        testId: response.data.sessionId,
        questions: response.data.questions,
      });
    } catch (err) {
      console.error('Failed to start subject test:', err);
      setError(err instanceof Error ? err.message : 'Failed to start test');
    } finally {
      setGeneratingSubjectTest(null);
    }
  };

  if (error && years.length === 0 && loadingYears && filter === 'year') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.backgroundGradient}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => {
                setError(null);
                setLoadingYears(true);
              }}
              style={styles.retryButton}
            >
              <LinearGradient colors={colors.gradientPrimary as [string, string, ...string[]]} style={styles.retryGradient}>
                <Text style={styles.retryText}>Retry</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGradient}>
        {showTestOptions ? (
          <BackHeader 
            title="PYQ Tests" 
            subtitle="Previous Year Question Papers"
            onBack={() => setShowTestOptions(false)} 
          />
        ) : (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>PYQ Tests</Text>
            <Text style={styles.headerSubtitle}>Previous Year Question Papers</Text>
          </View>
        )}
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

            {/* Initial Simple UI - Show only if test options are not shown */}
            {!showTestOptions && (
              <View style={styles.initialCardsContainer}>
                {/* Start Random Test Card */}
                <TouchableOpacity
                  onPress={() => setShowTestOptions(true)}
                  activeOpacity={0.7}
                  style={styles.initialCard}
                >
                  <View style={styles.initialCardContent}>
                    <View style={styles.initialCardLeft}>
                      <View style={styles.initialCardIconContainer}>
                        <Ionicons name="shuffle" size={24} color={colors.primary} />
                      </View>
                      <View style={styles.initialCardText}>
                        <Text style={styles.initialCardTitle}>Start Random Test</Text>
                        <Text style={styles.initialCardSubtitle}>
                          Practice with random questions
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.authTextMuted} />
                  </View>
                </TouchableOpacity>

                {/* Give Mock Test Card */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('MockTestSelection')}
                  activeOpacity={0.7}
                  style={styles.initialCard}
                >
                  <View style={styles.initialCardContent}>
                    <View style={styles.initialCardLeft}>
                      <View style={styles.initialCardIconContainer}>
                        <Ionicons name="document-text" size={24} color={colors.primary} />
                      </View>
                      <View style={styles.initialCardText}>
                        <Text style={styles.initialCardTitle}>Give Mock Test</Text>
                        <Text style={styles.initialCardSubtitle}>
                          Full-length MHT CET mock tests
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.authTextMuted} />
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Full Test Options UI - Show only if test options are shown */}
            {showTestOptions && (
              <View style={styles.contentCard}>
                {/* Mode Selection Tabs */}
                <View style={styles.modeContainer}>
                  <TouchableOpacity
                    style={[styles.modeTab, testMode === 'select' && styles.modeTabActive]}
                    onPress={() => setTestMode('select')}
                    activeOpacity={0.7}
                  >
                    {testMode === 'select' ? (
                      <LinearGradient
                        colors={colors.gradientPrimary as [string, string, ...string[]]}
                        style={styles.modeTabGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons 
                          name="list" 
                          size={18} 
                          color="#FFFFFF" 
                          style={{ marginRight: spacing.xs }}
                        />
                        <Text style={styles.modeTextActive}>
                          Select Practice
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.modeTabInactive}>
                        <Ionicons 
                          name="list" 
                          size={18} 
                          color={colors.authTextMuted} 
                          style={{ marginRight: spacing.xs }}
                        />
                        <Text style={styles.modeText}>
                          Select Practice
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modeTab, testMode === 'random' && styles.modeTabActive]}
                    onPress={() => setTestMode('random')}
                    activeOpacity={0.7}
                  >
                    {testMode === 'random' ? (
                      <LinearGradient
                        colors={colors.gradientPrimary as [string, string, ...string[]]}
                        style={styles.modeTabGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons 
                          name="shuffle" 
                          size={18} 
                          color="#FFFFFF" 
                          style={{ marginRight: spacing.xs }}
                        />
                        <Text style={styles.modeTextActive}>
                          Random Test
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.modeTabInactive}>
                        <Ionicons 
                          name="shuffle" 
                          size={18} 
                          color={colors.authTextMuted} 
                          style={{ marginRight: spacing.xs }}
                        />
                        <Text style={styles.modeText}>
                          Random Test
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Content based on selected mode */}
                {testMode === 'random' ? (
                  <View style={styles.randomTestSection}>
                    <Text style={styles.sectionSubtitle}>
                      Get 10, 50, or 100 random questions from all subjects
                    </Text>
                    <View style={styles.randomTestOptions}>
                      {RANDOM_TEST_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.count}
                          onPress={() => handleGenerateRandomTest(option.count)}
                          disabled={generatingRandom === option.count}
                          activeOpacity={0.7}
                          style={styles.randomTestCard}
                        >
                          <View style={styles.randomTestCardContent}>
                            <View style={styles.randomTestCardLeft}>
                              <View style={styles.randomTestIconContainer}>
                                <Ionicons name="shuffle" size={24} color={colors.primary} />
                              </View>
                              <View style={styles.randomTestInfo}>
                                <Text style={styles.randomTestTitle}>{option.count} Questions</Text>
                                <Text style={styles.randomTestSubtitle}>Random practice test</Text>
                              </View>
                            </View>
                            {generatingRandom === option.count ? (
                              <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                              <Ionicons name="chevron-forward" size={20} color={colors.authTextMuted} />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.selectPracticeSection}>
                    {/* Filter Tabs */}
                    <View style={styles.filterContainer}>
                      <TouchableOpacity
                        style={[styles.filterTab, filter === 'year' && styles.filterTabActive]}
                        onPress={() => setFilter('year')}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={filter === 'year' ? (colors.gradientPrimary as [string, string, ...string[]]) : (['transparent', 'transparent'] as [string, string, ...string[]])}
                          style={styles.filterTabGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <Text
                            style={[
                              styles.filterText,
                              filter === 'year' && styles.filterTextActive,
                            ]}
                          >
                            By Year
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.filterTab, filter === 'subject' && styles.filterTabActive]}
                        onPress={() => setFilter('subject')}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={filter === 'subject' ? (colors.gradientPrimary as [string, string, ...string[]]) : (['transparent', 'transparent'] as [string, string, ...string[]])}
                          style={styles.filterTabGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <Text
                            style={[
                              styles.filterText,
                              filter === 'subject' && styles.filterTextActive,
                            ]}
                          >
                            By Subject
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>

                    {/* Year Cards or Subject Cards */}
                    {filter === 'year' ? (
                      loadingYears ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color={colors.primary} />
                          <Text style={styles.loadingText}>Loading years...</Text>
                        </View>
                      ) : years.length === 0 ? (
                        <View style={styles.emptyContainer}>
                          <Ionicons name="calendar-outline" size={64} color={colors.authTextMuted} />
                          <Text style={styles.emptyText}>No years available</Text>
                          <Text style={styles.emptySubtext}>Try the Random Test option</Text>
                        </View>
                      ) : (
                        <View style={styles.yearList}>
                          {years.map((year, index) => (
                            <Animated.View
                              key={year}
                              style={{
                                opacity: fadeAnim,
                                transform: [
                                  {
                                    translateY: slideAnim.interpolate({
                                      inputRange: [0, 30],
                                      outputRange: [0, 30 + index * 10],
                                    }),
                                  },
                                ],
                              }}
                            >
                              <TouchableOpacity
                                onPress={() => handleStartYearTest(year)}
                                disabled={generatingYearTest === year}
                                activeOpacity={0.7}
                                style={styles.yearCard}
                              >
                                <View style={styles.yearCardContent}>
                                  <View style={styles.yearCardLeft}>
                                    <View style={styles.yearIconContainer}>
                                      <Ionicons name="calendar" size={24} color={colors.primary} />
                                    </View>
                                    <View style={styles.yearInfo}>
                                      <Text style={styles.yearTitle}>MHT CET PYQ</Text>
                                      <Text style={styles.yearYear}>{year}</Text>
                                      <Text style={styles.yearSubtitle}>
                                        Random questions from {year}
                                      </Text>
                                    </View>
                                  </View>
                                  <View style={styles.yearCardRight}>
                                    {generatingYearTest === year ? (
                                      <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                      <Ionicons name="chevron-forward" size={20} color={colors.authTextMuted} />
                                    )}
                                  </View>
                                </View>
                              </TouchableOpacity>
                            </Animated.View>
                          ))}
                        </View>
                      )
                    ) : (
                      <View style={styles.subjectList}>
                        {SUBJECTS.map((subject, index) => (
                          <Animated.View
                            key={subject.name}
                            style={{
                              opacity: fadeAnim,
                              transform: [
                                {
                                  translateY: slideAnim.interpolate({
                                    inputRange: [0, 30],
                                    outputRange: [0, 30 + index * 10],
                                  }),
                                },
                              ],
                            }}
                          >
                            <TouchableOpacity
                              onPress={() => handleStartSubjectTest(subject.name)}
                              disabled={generatingSubjectTest === subject.name}
                              activeOpacity={0.7}
                              style={styles.subjectCard}
                            >
                              <View style={styles.subjectCardContent}>
                                <View style={styles.subjectCardLeft}>
                                  <View style={styles.subjectIconContainer}>
                                    <Ionicons name={subject.icon as any} size={24} color={colors.primary} />
                                  </View>
                                  <View style={styles.subjectInfo}>
                                    <Text style={styles.subjectTitle}>{subject.name}</Text>
                                    <Text style={styles.subjectSubtitle}>
                                      Random questions from {subject.name}
                                    </Text>
                                  </View>
                                </View>
                                <View style={styles.subjectCardRight}>
                                  {generatingSubjectTest === subject.name ? (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                  ) : (
                                    <Ionicons name="chevron-forward" size={20} color={colors.authTextMuted} />
                                  )}
                                </View>
                              </View>
                            </TouchableOpacity>
                          </Animated.View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
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
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.authTextSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: '#6B7280',
    fontSize: 14,
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
    fontSize: 14,
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
  contentCard: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.md,
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    padding: spacing.xs + 2,
    marginBottom: spacing.xl,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modeTab: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  modeTabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  modeTabInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: 'transparent',
  },
  modeTabActive: {
    ...shadow.sm,
  },
  modeText: {
    ...typography.subtitle,
    color: colors.authTextMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  modeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  randomTestSection: {
    paddingTop: spacing.md,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.authTextSecondary,
    marginBottom: spacing.lg,
    fontSize: 14,
  },
  randomTestOptions: {
    gap: spacing.md,
  },
  randomTestCard: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.authBorder,
    ...shadow.sm,
  },
  randomTestCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  randomTestCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  randomTestIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  randomTestInfo: {
    flex: 1,
  },
  randomTestTitle: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 17,
    marginBottom: spacing.xs,
  },
  randomTestSubtitle: {
    ...typography.body,
    color: colors.authTextSecondary,
    fontSize: 13,
  },
  selectPracticeSection: {
    paddingTop: spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    padding: spacing.xs + 2,
    marginBottom: spacing.xl,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTab: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  filterTabGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    ...shadow.sm,
  },
  filterText: {
    ...typography.subtitle,
    color: colors.authTextMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  testList: {
    gap: spacing.lg,
  },
  testCard: {
    marginBottom: spacing.md,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  testIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    ...typography.h3,
    color: '#111827',
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  testMeta: {
    flexDirection: 'row',
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  testDuration: {
    ...typography.caption,
    color: '#6B7280',
  },
  testQuestions: {
    ...typography.caption,
    color: '#6B7280',
  },
  testStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statusText: {
    ...typography.body,
    fontWeight: '600',
  },
  testAction: {
    marginTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: '#6B7280',
    fontWeight: '600',
  },
  emptySubtext: {
    ...typography.caption,
    color: '#6B7280',
  },
  yearList: {
    gap: spacing.md,
  },
  yearCard: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.authBorder,
    ...shadow.sm,
  },
  yearCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  yearCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  yearIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  yearInfo: {
    flex: 1,
  },
  yearTitle: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 17,
    marginBottom: spacing.xs,
  },
  yearYear: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 17,
    marginBottom: spacing.xs,
  },
  yearSubtitle: {
    ...typography.body,
    color: colors.authTextSecondary,
    fontSize: 13,
  },
  yearCardRight: {
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  subjectList: {
    gap: spacing.md,
  },
  subjectCard: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.authBorder,
    ...shadow.sm,
  },
  subjectCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subjectIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectTitle: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 17,
    marginBottom: spacing.xs,
  },
  subjectSubtitle: {
    ...typography.body,
    color: colors.authTextSecondary,
    fontSize: 13,
  },
  subjectCardRight: {
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  initialCardsContainer: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  initialCard: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.authBorder,
    ...shadow.sm,
  },
  initialCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  initialCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  initialCardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  initialCardText: {
    flex: 1,
  },
  initialCardTitle: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 17,
    marginBottom: spacing.xs,
  },
  initialCardSubtitle: {
    ...typography.body,
    color: colors.authTextSecondary,
    fontSize: 13,
  },
});
