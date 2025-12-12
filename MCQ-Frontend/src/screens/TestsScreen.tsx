import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { AppStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing, typography, shadow } from '../theme';
import ModernCard from '../components/ui/ModernCard';
import GradientButton from '../components/ui/GradientButton';
import { getDistinctYears, generateRandomTest } from '../services/mcq.service';

type FilterType = 'year' | 'subject';

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
  const [filter, setFilter] = useState<FilterType>('year');
  const [years, setYears] = useState<string[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingRandom, setGeneratingRandom] = useState(false);
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

  const handleGenerateRandomTest = async () => {
    if (!(await checkTestLimit())) return;
    
    setGeneratingRandom(true);
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
      console.error('Failed to generate random test:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate random test');
    } finally {
      setGeneratingRandom(false);
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
        <LinearGradient colors={colors.gradientAuthLight as [string, string, ...string[]]} style={styles.backgroundGradient}>
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
                  <Ionicons name="document-text" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.title}>PYQ Tests</Text>
                  <Text style={styles.subtitle}>Previous Year Question Papers</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Random Test Card */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <TouchableOpacity
                onPress={handleGenerateRandomTest}
                disabled={generatingRandom}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={colors.gradientPrimary as [string, string, ...string[]]}
                  style={styles.randomTestCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                <View style={styles.randomTestContent}>
                  <View style={styles.randomTestIconContainer}>
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)'] as [string, string, ...string[]]}
                      style={styles.randomTestIconGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="shuffle" size={32} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                  <View style={styles.randomTestInfo}>
                    <Text style={styles.randomTestTitle}>Random Practice Test</Text>
                    <Text style={styles.randomTestSubtitle}>
                      Get 10-50 random questions from all subjects
                    </Text>
                  </View>
                </View>
                <View style={styles.randomTestButton}>
                  <LinearGradient
                    colors={colors.gradientAccent as [string, string, ...string[]]}
                    style={styles.randomTestButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {generatingRandom ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.randomTestButtonText}>Start Random Test</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                      </>
                    )}
                  </LinearGradient>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            </Animated.View>

            {/* Filter Tabs */}
            <Animated.View 
              style={[
                styles.filterContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
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
            </Animated.View>

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
                  <Text style={styles.emptySubtext}>Try the Random Practice Test above</Text>
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
    color: colors.authTextMuted,
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
  randomTestCard: {
    borderRadius: radius.xl + 4,
    padding: spacing.lg + 4,
    marginBottom: spacing.xl,
    ...shadow.xl,
  },
  randomTestContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  randomTestIconContainer: {
    marginRight: spacing.md,
  },
  randomTestIconGradient: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  randomTestInfo: {
    flex: 1,
  },
  randomTestTitle: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: spacing.xs,
    fontSize: 22,
  },
  randomTestSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    lineHeight: 22,
  },
  randomTestButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  randomTestButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  randomTestButtonText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.authSurface,
    borderRadius: radius.xl + 2,
    padding: spacing.xs + 2,
    marginBottom: spacing.xl,
    gap: spacing.xs,
    ...shadow.md,
    borderWidth: 1,
    borderColor: colors.authBorder,
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
    color: colors.authTextMuted,
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
    color: colors.authText,
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
    color: colors.authTextMuted,
  },
  testQuestions: {
    ...typography.caption,
    color: colors.authTextMuted,
  },
  testStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.authBorder,
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
    color: colors.authTextMuted,
    fontWeight: '600',
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.authTextMuted,
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
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearInfo: {
    flex: 1,
  },
  yearTitle: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  yearSubtitle: {
    ...typography.body,
    color: colors.authTextSecondary,
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
});
