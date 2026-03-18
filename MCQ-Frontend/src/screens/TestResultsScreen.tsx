import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { AppStackParamList } from '../navigation/types';
import { getMockTestLeaderboard, getTestReport } from '../services/mcq.service';
import type { TestResult } from '../types/mcq';
import { colors, radius, spacing, typography, shadow } from '../theme';
import ModernCard from '../components/ui/ModernCard';
import BackHeader from '../components/ui/BackHeader';
import MathText from '../components/ui/MathText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { safeGoBack } from '../utils/navigation';

export type TestResultsScreenProps = NativeStackScreenProps<AppStackParamList, 'TestResults'>;

export default function TestResultsScreen({ route, navigation }: TestResultsScreenProps) {
  const { sessionId } = route.params;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [wrongFilter, setWrongFilter] = useState<'All' | 'Physics' | 'Chemistry' | 'Maths'>('All');
  const [myRank, setMyRank] = useState<number | null>(null);
  const [rankLoading, setRankLoading] = useState(false);

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

  useEffect(() => {
    let isMounted = true;

    async function fetchReport() {
      setLoading(true);
      setError(null);
      try {
        const response = await getTestReport(sessionId);
        if (isMounted) {
          setReport(response.data);
        }
      } catch (requestError) {
        if (isMounted) {
          const message =
            requestError instanceof Error ? requestError.message : 'Failed to load test report';
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchReport();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  useEffect(() => {
    let isMounted = true;

    async function fetchRank() {
      if (!report?.testType) return;
      if (report.testType !== 'mocktest') return;
      if (!report.mockTestNumber) return;

      setRankLoading(true);
      try {
        const response = await getMockTestLeaderboard(Number(report.mockTestNumber));
        if (!isMounted) return;
        const entry = Array.isArray(response?.data)
          ? response.data.find((e) => Boolean(e?.isCurrentUser))
          : null;
        setMyRank(typeof entry?.rank === 'number' ? entry.rank : null);
      } catch {
        if (!isMounted) return;
        setMyRank(null);
      } finally {
        if (!isMounted) return;
        setRankLoading(false);
      }
    }

    fetchRank();
    return () => {
      isMounted = false;
    };
  }, [report?.testType, report?.mockTestNumber]);

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient
          colors={colors.gradientPurpleLight as [string, string, ...string[]]}
          style={styles.backgroundGradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading test report...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (error || !report) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient
          colors={colors.gradientPurpleLight as [string, string, ...string[]]}
          style={styles.backgroundGradient}
        >
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color={colors.danger} />
            <Text style={styles.errorText}>{error || 'Failed to load test report'}</Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <LinearGradient colors={colors.gradientPrimary as [string, string, ...string[]]} style={styles.backButtonGradient}>
                <Text style={styles.backButtonText}>Go Back</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const normalizeSubject = (value: unknown): 'Physics' | 'Chemistry' | 'Maths' | 'Other' => {
    const s = String(value ?? '').trim().toLowerCase();
    if (s === 'physics' || s === 'phy') return 'Physics';
    if (s === 'chemistry' || s === 'chem') return 'Chemistry';
    if (s === 'maths' || s === 'math' || s === 'mathematics') return 'Maths';
    return 'Other';
  };

  const results: TestResult[] = Array.isArray(report?.results) ? report.results : [];
  const correctResults = results.filter((r) => Boolean(r?.isCorrect));
  const wrongResults = results.filter((r) => !r?.isCorrect);
  const attempted = results.filter((r) => String(r?.selectedOption ?? '').trim().length > 0);
  const unattemptedCount = Math.max(0, Number(report?.total ?? results.length) - attempted.length);
  const accuracyPct = attempted.length > 0 ? Math.round((correctResults.length / attempted.length) * 100) : 0;

  const marksPerQuestion = (subject: 'Physics' | 'Chemistry' | 'Maths' | 'Other') =>
    subject === 'Maths' ? 2 : 1;

  const subjectOrder: Array<'Physics' | 'Chemistry' | 'Maths'> = ['Physics', 'Chemistry', 'Maths'];
  const expectedMaxBySubject: Record<'Physics' | 'Chemistry' | 'Maths', number> = {
    Physics: 50,
    Chemistry: 50,
    Maths: 100,
  };
  const useExpectedMax =
    report?.testType === 'mocktest' || report?.testType === 'pyq-mocktest';

  const subjectTotals = subjectOrder.map((subject) => {
    const items = results.filter((r) => normalizeSubject(r?.subject) === subject);
    const correct = items.filter((r) => Boolean(r?.isCorrect)).length;
    const perQ = marksPerQuestion(subject);
    const maxMarks = items.length * perQ;
    const marks = correct * perQ;
    const displayMaxMarks = useExpectedMax ? expectedMaxBySubject[subject] : maxMarks;
    return {
      subject,
      totalQ: items.length,
      correctQ: correct,
      marks,
      maxMarks,
      displayMaxMarks,
      perQ,
    };
  }).filter((s) => s.totalQ > 0);

  const totalMarks = subjectTotals.reduce((sum, s) => sum + s.marks, 0);
  const totalMaxMarks = subjectTotals.reduce((sum, s) => sum + s.maxMarks, 0);
  const totalDisplayMaxMarks = subjectTotals.reduce((sum, s) => sum + (Number(s.displayMaxMarks) || 0), 0);

  const contentPaddingX = width < 380 ? spacing.lg : spacing.xxl;
  const statMinWidth = width < 380 ? (width - contentPaddingX * 2 - spacing.md) / 2 : (width - contentPaddingX * 2 - spacing.md * 2) / 3;
  const filteredWrongResults =
    wrongFilter === 'All'
      ? wrongResults
      : wrongResults.filter((r) => normalizeSubject(r?.subject) === wrongFilter);

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={colors.gradientPurpleLight as [string, string, ...string[]]}
        style={styles.backgroundGradient}
      >
        <BackHeader
          title="Test Results"
          subtitle={
            report.testType === 'mocktest' && report.mockTestNumber
              ? `MockTest ${report.mockTestNumber}`
              : `${report.subject || 'Test'} ${report.chapter ? `• ${report.chapter}` : ''}`
          }
          navigation={navigation}
        />
        <ScrollView
          contentContainerStyle={[
            styles.container,
            {
              paddingBottom: insets.bottom + spacing.xl,
              paddingHorizontal: contentPaddingX,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Score Hero */}
            <ModernCard variant="elevated" padding="lg" style={styles.heroCard}>
              <LinearGradient
                colors={colors.gradientPrimary as [string, string, ...string[]]}
                style={styles.heroGradient}
              >
                <View style={styles.heroTopRow}>
                  <View style={styles.heroTitleRow}>
                    <Ionicons name="trophy" size={22} color="#FFFFFF" />
                    <Text style={styles.heroTitle}>Test Completed</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => safeGoBack(navigation)}
                    style={styles.heroClose}
                    accessibilityRole="button"
                  >
                    <Ionicons name="close" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.heroScore}>
                  {totalMarks}
                  <Text style={styles.heroScoreOutOf}>
                    {totalDisplayMaxMarks > 0
                      ? ` / ${totalDisplayMaxMarks}`
                      : totalMaxMarks > 0
                        ? ` / ${totalMaxMarks}`
                        : ''}
                  </Text>
                </Text>
                <Text style={styles.heroMeta}>
                  {formatDuration(Number(report?.duration) || 0)} •{' '}
                  {report?.completedAt ? new Date(report.completedAt).toLocaleString() : ''}
                </Text>

                <View style={styles.heroBadgesRow}>
                  <View style={styles.badgePill}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.badgeText}>{correctResults.length} Correct</Text>
                  </View>
                  <View style={styles.badgePill}>
                    <Ionicons name="close-circle" size={16} color="#F87171" />
                    <Text style={styles.badgeText}>{wrongResults.length} Wrong</Text>
                  </View>
                  <View style={styles.badgePill}>
                    <Ionicons name="help-circle" size={16} color="#FBBF24" />
                    <Text style={styles.badgeText}>{unattemptedCount} Unattempted</Text>
                  </View>
                  <View style={styles.badgePill}>
                    <Ionicons name="analytics" size={16} color="#93C5FD" />
                    <Text style={styles.badgeText}>{accuracyPct}% Accuracy</Text>
                  </View>
                </View>

                <View style={styles.heroFooterRow}>
                  <View style={styles.rankPill}>
                    <Ionicons name="podium" size={16} color="#FFFFFF" />
                    <Text style={styles.rankText}>
                      {rankLoading ? 'Rank: …' : myRank ? `Rank: #${myRank}` : 'Rank: —'}
                    </Text>
                  </View>
                  {report?.testType === 'mocktest' && report?.mockTestNumber ? (
                    <View style={styles.rankHintPill}>
                      <Text style={styles.rankHintText}>MockTest {report.mockTestNumber}</Text>
                    </View>
                  ) : null}
                </View>
              </LinearGradient>
            </ModernCard>

            {/* Subject-wise Marks */}
            {subjectTotals.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="layers" size={22} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Subject Marks</Text>
                </View>

                <View style={styles.subjectGrid}>
                  {subjectTotals.map((s) => {
                    const pct = s.maxMarks > 0 ? Math.min(1, s.marks / s.maxMarks) : 0;
                    const accent =
                      s.subject === 'Physics'
                        ? colors.info
                        : s.subject === 'Chemistry'
                          ? colors.accent
                          : colors.purple;
                    return (
                      <ModernCard
                        key={s.subject}
                        variant="elevated"
                        padding="md"
                        style={[styles.subjectCard, { minWidth: statMinWidth }]}
                      >
                        <View style={styles.subjectTopRow}>
                          <Text style={styles.subjectName}>{s.subject}</Text>
                          <View style={[styles.subjectChip, { backgroundColor: `${accent}22` }]}>
                            <Text style={[styles.subjectChipText, { color: accent }]}>
                              {s.perQ} mark/q
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.subjectScore}>
                          {s.marks}
                          <Text style={styles.subjectScoreOutOf}>
                            {' '}
                            / {s.displayMaxMarks || s.maxMarks}
                          </Text>
                        </Text>
                        <Text style={styles.subjectMeta}>
                          {s.correctQ}/{s.totalQ} correct
                        </Text>
                        <View style={styles.progressTrack}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${Math.round(pct * 100)}%`, backgroundColor: accent },
                            ]}
                          />
                        </View>
                      </ModernCard>
                    );
                  })}
                </View>

                <ModernCard variant="elevated" padding="md" style={styles.totalRowCard}>
                  <View style={styles.totalRow}>
                    <View style={styles.totalRowLeft}>
                      <Ionicons name="calculator" size={20} color={colors.primary} />
                      <Text style={styles.totalRowLabel}>Total</Text>
                    </View>
                    <Text style={styles.totalRowValue}>
                      {totalMarks}
                      {totalDisplayMaxMarks > 0
                        ? ` / ${totalDisplayMaxMarks}`
                        : totalMaxMarks > 0
                          ? ` / ${totalMaxMarks}`
                          : ''}
                    </Text>
                  </View>
                </ModernCard>
              </View>
            )}

            {/* Wrong Answers (interactive) */}
            {wrongResults.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="close-circle" size={22} color={colors.danger} />
                  <Text style={styles.sectionTitle}>Wrong Answers</Text>
                  <View style={styles.sectionCountPill}>
                    <Text style={styles.sectionCountText}>{wrongResults.length}</Text>
                  </View>
                </View>

                <View style={styles.filterRow}>
                  {(['All', 'Physics', 'Chemistry', 'Maths'] as const).map((k) => {
                    const active = wrongFilter === k;
                    return (
                      <TouchableOpacity
                        key={k}
                        onPress={() => setWrongFilter(k)}
                        style={[styles.filterChip, active && styles.filterChipActive]}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                          {k}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {filteredWrongResults.map((result: TestResult, index: number) => {
                  const isExpanded = expandedQuestions.has(result.questionId);
                  const subject = normalizeSubject(result?.subject);
                  const subjectLabel = subject === 'Other' ? '' : ` • ${subject}`;
                  return (
                    <ModernCard
                      key={result.questionId}
                      variant="elevated"
                      padding="md"
                      style={styles.resultCard}
                    >
                      <TouchableOpacity
                        onPress={() => toggleQuestion(result.questionId)}
                        style={styles.resultHeaderPress}
                        accessibilityRole="button"
                      >
                        <View style={styles.resultHeaderLeft}>
                          <View style={styles.resultNumberWrong}>
                            <Text style={styles.resultNumberText}>{index + 1}</Text>
                          </View>
                          <Text style={styles.resultHeaderMeta}>
                            Wrong{subjectLabel}
                          </Text>
                        </View>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={colors.authTextSecondary}
                        />
                      </TouchableOpacity>

                      <MathText style={styles.resultQuestion}>
                        {result.question}
                      </MathText>

                      {isExpanded ? (
                        <View style={styles.expandedBlock}>
                          <View style={styles.optionsList}>
                            {result.options.map((option, optIdx) => {
                              const isCorrect = option === result.correctAnswer;
                              const isSelected = option === result.selectedOption;
                              return (
                                <View
                                  key={optIdx}
                                  style={[
                                    styles.optionRow,
                                    isCorrect && styles.optionRowCorrect,
                                    isSelected && !isCorrect && styles.optionRowWrong,
                                  ]}
                                >
                                  <View style={styles.optionLabelContainer}>
                                    {isCorrect && (
                                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                    )}
                                    {isSelected && !isCorrect && (
                                      <Ionicons name="close-circle" size={18} color={colors.danger} />
                                    )}
                                    {!isCorrect && !isSelected && <View style={styles.optionDot} />}
                                  </View>
                                  <MathText
                                    style={[
                                      styles.optionText,
                                      ...(isCorrect ? [styles.optionTextCorrect] : []),
                                      ...(isSelected && !isCorrect ? [styles.optionTextWrong] : []),
                                    ]}
                                  >
                                    {option}
                                  </MathText>
                                </View>
                              );
                            })}
                          </View>

                          <View style={styles.resultAnswers}>
                            <View style={[styles.resultAnswer, styles.resultAnswerWrong]}>
                              <Ionicons name="close-circle" size={20} color={colors.danger} />
                              <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
                                <Text style={styles.resultAnswerText}>Your Answer: </Text>
                                <MathText style={styles.resultAnswerText}>
                                  {result.selectedOption || '—'}
                                </MathText>
                              </View>
                            </View>
                            <View style={[styles.resultAnswer, styles.resultAnswerCorrect]}>
                              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                              <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
                                <Text style={styles.resultAnswerText}>Correct Answer: </Text>
                                <MathText style={styles.resultAnswerText}>{result.correctAnswer}</MathText>
                              </View>
                            </View>
                          </View>
                        </View>
                      ) : null}
                    </ModernCard>
                  );
                })}
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.authBackground,
  },
  backgroundGradient: {
    flex: 1,
    backgroundColor: colors.authBackground,
  },
  container: {
    flexGrow: 1,
    paddingTop: spacing.xl,
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
  backButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: spacing.md,
    ...shadow.md,
  },
  backButtonGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  backButtonText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryCard: {
    marginBottom: spacing.xl,
  },
  heroCard: {
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  heroGradient: {
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroTitle: {
    ...typography.title,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroClose: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroScore: {
    ...typography.display,
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  heroScoreOutOf: {
    ...typography.h3,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
  },
  heroMeta: {
    ...typography.small,
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing.xs,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  badgeText: {
    ...typography.small,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  heroFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  rankText: {
    ...typography.small,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rankHintPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  rankHintText: {
    ...typography.small,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  summaryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    ...typography.h2,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  summarySubtitle: {
    ...typography.body,
    color: colors.authTextSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadow.sm,
  },
  statCardCorrect: {
    backgroundColor: '#D1FAE5',
  },
  statCardWrong: {
    backgroundColor: '#FEE2E2',
  },
  statCardTotal: {
    backgroundColor: colors.primarySoft,
  },
  statValue: {
    ...typography.h1,
    color: colors.authText,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.authTextSecondary,
    marginTop: spacing.xs,
  },
  marksContainer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.authBorder,
  },
  marksLabel: {
    ...typography.body,
    color: colors.authTextSecondary,
    marginBottom: spacing.xs,
  },
  marksValue: {
    ...typography.h1,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 48,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
  },
  sectionCountPill: {
    marginLeft: 'auto',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  sectionCountText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  subjectCard: {
    flexGrow: 1,
  },
  subjectTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  subjectName: {
    ...typography.subtitle,
    color: colors.authText,
    fontWeight: '700',
  },
  subjectChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  subjectChipText: {
    ...typography.caption,
    fontWeight: '700',
  },
  subjectScore: {
    ...typography.h2,
    color: colors.authText,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  subjectScoreOutOf: {
    ...typography.subtitle,
    color: colors.authTextSecondary,
    fontWeight: '700',
  },
  subjectMeta: {
    ...typography.caption,
    color: colors.authTextSecondary,
    marginTop: spacing.xs,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.authBorder,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  totalRowCard: {
    marginTop: spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  totalRowLabel: {
    ...typography.subtitle,
    color: colors.authText,
    fontWeight: '700',
  },
  totalRowValue: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  filterChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryLight,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.authTextSecondary,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: colors.primary,
  },
  resultCard: {
    marginBottom: spacing.md,
  },
  resultHeaderPress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  resultHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  resultHeaderMeta: {
    ...typography.caption,
    color: colors.authTextSecondary,
    fontWeight: '700',
  },
  resultNumberCorrect: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultNumberWrong: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultNumberText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  resultQuestion: {
    ...typography.body,
    color: colors.authText,
    flex: 1,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  expandedBlock: {
    marginTop: spacing.sm,
  },
  optionsList: {
    gap: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.authInputBg,
  },
  optionRowCorrect: {
    backgroundColor: '#D1FAE5',
  },
  optionRowWrong: {
    backgroundColor: '#FEE2E2',
  },
  optionLabelContainer: {
    width: 24,
    alignItems: 'center',
  },
  optionDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.authTextMuted,
  },
  optionText: {
    ...typography.body,
    color: colors.authText,
    flex: 1,
  },
  optionTextCorrect: {
    color: '#10B981',
    fontWeight: '600',
  },
  optionTextWrong: {
    color: colors.danger,
    fontWeight: '600',
  },
  resultAnswers: {
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.authBorder,
  },
  resultAnswer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  resultAnswerWrong: {
    backgroundColor: '#FEE2E2',
  },
  resultAnswerCorrect: {
    backgroundColor: '#D1FAE5',
  },
  resultAnswerText: {
    ...typography.body,
    color: colors.authText,
    flex: 1,
  },
});





