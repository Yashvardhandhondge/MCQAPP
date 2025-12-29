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
            {/* Header - Show PYQ banner only on initial screen */}
            {!showTestOptions && (
              <LinearGradient
                colors={colors.gradientPrimary as [string, string, ...string[]]}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.headerContent}>
                  <View style={styles.headerIconContainer}>
                    <Ionicons name="document-text" size={32} color="#FFFFFF" />
                  </View>
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.title}>PYQ Tests</Text>
                    <Text style={styles.subtitle}>Previous Year Question Papers</Text>
                  </View>
                </View>
              </LinearGradient>
            )}

            {/* Back Button Header - Show when test options are visible */}
            {showTestOptions && (
              <View style={styles.backHeader}>
                <TouchableOpacity
                  onPress={() => setShowTestOptions(false)}
                  activeOpacity={0.7}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.authText} />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Initial Simple UI - Show only if test options are not shown */}
            {!showTestOptions && (
              <Animated.View
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }}
              >
                <TouchableOpacity
                  onPress={() => setShowTestOptions(true)}
                  activeOpacity={0.85}
                  style={styles.startRandomTestButton}
                >
                  <LinearGradient
                    colors={colors.gradientPrimary as [string, string, ...string[]]}
                    style={styles.startRandomTestGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.startRandomTestText}>Start Random Test</Text>
                    <Ionicons name="arrow-forward" size={24} color="#FFFFFF" style={{ marginLeft: spacing.sm }} />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Full Test Options UI - Show only if test options are shown */}
            {showTestOptions && (
              <>
                {/* Main Test Mode Selection */}
                <Animated.View
                  style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  }}
                >
              <ModernCard variant="elevated" padding="lg" style={styles.mainSectionCard}>
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
                          size={20} 
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
                          size={20} 
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
                          size={20} 
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
                          size={20} 
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
                    <View style={styles.randomTestHeader}>
                      <Ionicons name="shuffle" size={24} color={colors.primary} />
                      <Text style={styles.randomTestSectionTitle}>Random Practice Test</Text>
                    </View>
                    <Text style={styles.randomTestSectionSubtitle}>
                      Get 10, 50, or 100 random questions from all subjects
                    </Text>
                    <View style={styles.randomTestOptions}>
                      {RANDOM_TEST_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.count}
                          onPress={() => handleGenerateRandomTest(option.count)}
                          disabled={generatingRandom === option.count}
                          activeOpacity={0.85}
                          style={styles.randomTestOptionWrapper}
                        >
                          <LinearGradient
                            colors={colors.gradientPrimary as [string, string, ...string[]]}
                            style={[
                              styles.randomTestOptionCard,
                              generatingRandom === option.count && styles.randomTestOptionCardLoading,
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                            {generatingRandom === option.count ? (
                              <View style={styles.randomTestOptionLoadingContainer}>
                                <ActivityIndicator color="#FFFFFF" size="large" />
                                <Text style={styles.randomTestOptionLoadingText}>Generating...</Text>
                              </View>
                            ) : (
                              <View style={styles.randomTestOptionContent}>
                                <View style={styles.randomTestOptionNumberContainer}>
                                  <Text style={styles.randomTestOptionCount}>{option.count}</Text>
                                  <Text style={styles.randomTestOptionLabel}>Questions</Text>
                                </View>
                                <View style={styles.randomTestOptionArrowContainer}>
                                  <Ionicons name="arrow-forward-circle" size={32} color="#FFFFFF" />
                                </View>
                              </View>
                            )}
                          </LinearGradient>
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
                        activeOpacity={0.8}
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
                        activeOpacity={0.8}
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
                                activeOpacity={0.85}
                              >
                                <ModernCard variant="elevated" padding="lg" style={styles.yearCard}>
                                  <View style={styles.yearCardContent}>
                                    <View style={styles.yearIconContainer}>
                                      <Ionicons name="calendar" size={28} color={colors.primary} />
                                    </View>
                                    <View style={styles.yearInfo}>
                                      <Text style={styles.yearTitle}>MHT CET PYQ {year}</Text>
                                      <Text style={styles.yearSubtitle}>
                                        Random questions from {year}
                                      </Text>
                                    </View>
                                    {generatingYearTest === year ? (
                                      <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                      <Ionicons name="arrow-forward" size={24} color={colors.primary} />
                                    )}
                                  </View>
                                </ModernCard>
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
                              activeOpacity={0.85}
                            >
                              <LinearGradient
                                colors={[subject.color, `${subject.color}CC`] as [string, string, ...string[]]}
                                style={styles.subjectCard}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                              >
                                <View style={styles.subjectCardContent}>
                                  <View style={styles.subjectIconContainer}>
                                    <Ionicons name={subject.icon as any} size={32} color="#FFFFFF" />
                                  </View>
                                  <View style={styles.subjectInfo}>
                                    <Text style={styles.subjectTitle}>{subject.name}</Text>
                                    <Text style={styles.subjectSubtitle}>
                                      Random questions from {subject.name}
                                    </Text>
                                  </View>
                                  {generatingSubjectTest === subject.name ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                  ) : (
                                    <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
                                  )}
                                </View>
                              </LinearGradient>
                            </TouchableOpacity>
                          </Animated.View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </ModernCard>
                </Animated.View>
              </>
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
    backgroundColor: '#FAFBFC',
  },
  backgroundGradient: {
    flex: 1,
    backgroundColor: '#FAFBFC',
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
    width: 64,
    height: 64,
    borderRadius: radius.xl + 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  headerTextContainer: {
    flex: 1,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: spacing.xs,
    fontSize: 26,
  },
  subtitle: {
    ...typography.subtitle,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
  },
  backHeader: {
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  backButtonText: {
    ...typography.subtitle,
    color: '#111827',
    fontWeight: '600',
    fontSize: 16,
  },
  mainSectionCard: {
    marginBottom: spacing.xl,
    borderRadius: radius.xl + 4,
    ...shadow.xl,
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.xl,
    padding: spacing.xs + 2,
    marginBottom: spacing.xl,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadow.sm,
  },
  modeTab: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  modeTabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md,
  },
  modeTabInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: 'transparent',
  },
  modeTabActive: {
    ...shadow.md,
  },
  modeText: {
    ...typography.subtitle,
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 15,
  },
  modeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  randomTestSection: {
    paddingTop: spacing.md,
  },
  randomTestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  randomTestSectionTitle: {
    ...typography.h2,
    color: '#111827',
    fontWeight: '700',
    fontSize: 20,
  },
  randomTestSectionSubtitle: {
    ...typography.body,
    color: '#6B7280',
    marginBottom: spacing.xl,
    fontSize: 14,
  },
  randomTestOptions: {
    gap: spacing.lg,
  },
  randomTestOptionWrapper: {
    width: '100%',
  },
  randomTestOptionCard: {
    borderRadius: radius.xl + 4,
    padding: spacing.xxl,
    ...shadow.lg,
    minHeight: 120,
  },
  randomTestOptionCardLoading: {
    opacity: 0.8,
  },
  randomTestOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  randomTestOptionNumberContainer: {
    flex: 1,
  },
  randomTestOptionCount: {
    ...typography.h1,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 48,
    marginBottom: spacing.xs,
    lineHeight: 56,
  },
  randomTestOptionLabel: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 16,
    fontWeight: '600',
  },
  randomTestOptionArrowContainer: {
    marginLeft: spacing.lg,
  },
  randomTestOptionLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  randomTestOptionLoadingText: {
    ...typography.body,
    color: '#FFFFFF',
    marginTop: spacing.md,
    fontWeight: '600',
  },
  selectPracticeSection: {
    paddingTop: spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.xl + 2,
    padding: spacing.xs + 2,
    marginBottom: spacing.xl,
    gap: spacing.xs,
    ...shadow.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTab: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  filterTabGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    ...shadow.md,
  },
  filterText: {
    ...typography.subtitle,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    marginBottom: spacing.sm,
    borderRadius: radius.xl + 2,
  },
  yearCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  yearIconContainer: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearInfo: {
    flex: 1,
  },
  yearTitle: {
    ...typography.h3,
    color: '#111827',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  yearSubtitle: {
    ...typography.body,
    color: '#6B7280',
  },
  subjectList: {
    gap: spacing.md,
  },
  subjectCard: {
    borderRadius: radius.xl + 4,
    padding: spacing.lg + 4,
    marginBottom: spacing.sm,
    ...shadow.xl,
  },
  subjectCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  subjectIconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectInfo: {
    flex: 1,
  },
  subjectTitle: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subjectSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  startRandomTestButton: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginTop: spacing.xl,
    ...shadow.lg,
  },
  startRandomTestGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xxl,
  },
  startRandomTestText: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
});
