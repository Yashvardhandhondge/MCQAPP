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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { AppStackParamList } from '../navigation/types';
import { getTestReport } from '../services/mcq.service';
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
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

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
        <View style={styles.backgroundGradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading test report...</Text>
          </View>
        </View>
      </View>
    );
  }

  if (error || !report) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.backgroundGradient}>
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
        </View>
      </View>
    );
  }

  const correctResults = report.results.filter((r: TestResult) => r.isCorrect);
  const wrongResults = report.results.filter((r: TestResult) => !r.isCorrect);

  // Calculate total marks based on subject
  const calculateMarks = () => {
    let totalMarks = 0;
    report.results.forEach((result: TestResult) => {
      if (result.isCorrect) {
        const subject = result.subject || '';
        if (subject === 'Maths' || subject === 'Mathematics') {
          totalMarks += 2;
        } else if (subject === 'Physics' || subject === 'Chemistry') {
          totalMarks += 1;
        } else {
          // Default to 1 mark if subject is not recognized
          totalMarks += 1;
        }
      }
    });
    return totalMarks;
  };

  const totalMarks = calculateMarks();

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.backgroundGradient}>
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
          contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Summary Card */}
            <ModernCard variant="elevated" padding="lg" style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={styles.summaryIconContainer}>
                  <Ionicons name="trophy" size={32} color={colors.primary} />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryTitle}>Test Completed!</Text>
                  <Text style={styles.summarySubtitle}>
                    {formatDuration(report.duration)} • {new Date(report.completedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={[styles.statCard, styles.statCardCorrect]}>
                  <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                  <Text style={styles.statValue}>{correctResults.length}</Text>
                  <Text style={styles.statLabel}>Correct</Text>
                </View>
                <View style={[styles.statCard, styles.statCardWrong]}>
                  <Ionicons name="close-circle" size={32} color={colors.danger} />
                  <Text style={styles.statValue}>{report.wrongCount}</Text>
                  <Text style={styles.statLabel}>Wrong</Text>
                </View>
                <View style={[styles.statCard, styles.statCardTotal]}>
                  <Ionicons name="document-text" size={32} color={colors.primary} />
                  <Text style={styles.statValue}>{report.total}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
              </View>

              <View style={styles.marksContainer}>
                <Text style={styles.marksLabel}>Total Marks</Text>
                <Text style={styles.marksValue}>{totalMarks}</Text>
              </View>
            </ModernCard>

            {/* Wrong Answers Section - Show directly below results */}
            {wrongResults.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="close-circle" size={24} color={colors.danger} />
                  <Text style={styles.sectionTitle}>
                    Wrong Answers ({wrongResults.length})
                  </Text>
                </View>
                {wrongResults.map((result: TestResult, index: number) => (
                  <ModernCard
                    key={result.questionId}
                    variant="elevated"
                    padding="md"
                    style={styles.resultCard}
                  >
                    <View style={styles.resultHeader}>
                      <View style={styles.resultNumberWrong}>
                        <Text style={styles.resultNumberText}>{index + 1}</Text>
                      </View>
                      <MathText style={styles.resultQuestion}>
                        {result.question}
                      </MathText>
                    </View>

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
                              {!isCorrect && !isSelected && (
                                <View style={styles.optionDot} />
                              )}
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
                          <Text style={styles.resultAnswerText}>
                            Your Answer:{' '}
                          </Text>
                          <MathText style={styles.resultAnswerText}>
                            {result.selectedOption}
                          </MathText>
                        </View>
                      </View>
                      <View style={[styles.resultAnswer, styles.resultAnswerCorrect]}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
                          <Text style={styles.resultAnswerText}>
                            Correct Answer:{' '}
                          </Text>
                          <MathText style={styles.resultAnswerText}>
                            {result.correctAnswer}
                          </MathText>
                        </View>
                      </View>
                    </View>
                  </ModernCard>
                ))}
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </View>
    </View>
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
  resultCard: {
    marginBottom: spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
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
  },
  expandedContent: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
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





