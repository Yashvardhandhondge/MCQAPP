import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
  Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { AppStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography, shadow } from '../theme';
import ModernCard from '../components/ui/ModernCard';
import GradientButton from '../components/ui/GradientButton';
import BackHeader from '../components/ui/BackHeader';
import ReportQuestionModal from '../components/ui/ReportQuestionModal';
import { getQuestionsByIds, submitTestSession } from '../services/mcq.service';
import type { Question } from '../types/mcq';

type QuestionStatus = 'answered' | 'not-answered' | 'marked' | 'not-visited';

interface QuestionState {
  id: string;
  status: QuestionStatus;
  selectedOption?: string;
}

export type CBTSimulatorScreenProps = NativeStackScreenProps<AppStackParamList, 'CBT'>;

export default function CBTSimulatorScreen({ route, navigation }: CBTSimulatorScreenProps) {
  const { testId, questions: questionIds } = route.params;
  const insets = useSafeAreaInsets();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [questionStates, setQuestionStates] = useState<QuestionState[]>([]);
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(5400); // 90 minutes in seconds
  const [submitting, setSubmitting] = useState(false);
  const [showQuestionsOverlay, setShowQuestionsOverlay] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const overlayScale = useRef(new Animated.Value(0.95)).current;

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
    if (showQuestionsOverlay) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(overlayScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayScale, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showQuestionsOverlay]);

  // Fetch questions on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchQuestions() {
      setLoading(true);
      setError(null);
      try {
        const response = await getQuestionsByIds(questionIds);
        if (isMounted) {
          setQuestions(response.data);
          // Initialize question states
          const states = response.data.map((q) => ({
            id: q._id,
            status: 'not-visited' as QuestionStatus,
          }));
          setQuestionStates(states);
          // Mark first question as visited
          if (states.length > 0) {
            states[0].status = 'not-answered';
          }
        }
      } catch (requestError) {
        if (isMounted) {
          const message =
            requestError instanceof Error ? requestError.message : 'Failed to load questions';
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (questionIds && questionIds.length > 0) {
      fetchQuestions();
    } else {
      setError('No questions provided');
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [questionIds]);

  useEffect(() => {
    // Timer countdown
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          handleFinishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleFinishTest = async () => {
    if (submitting) return;

    Alert.alert(
      'Finish Test',
      'Are you sure you want to submit your answers?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              const answers = questionStates.map((state) => ({
                questionId: state.id,
                selectedOption: state.selectedOption || '',
              }));

              const response = await submitTestSession({
                sessionId: testId,
                answers,
              });

              // Navigate to test results screen
              navigation.replace('TestResults', {
                sessionId: response.data.sessionId,
              });
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit test');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient colors={colors.gradientAuthLight as [string, string, ...string[]]} style={styles.backgroundGradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading questions...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (error || questions.length === 0) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient colors={colors.gradientAuthLight as [string, string, ...string[]]} style={styles.backgroundGradient}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color={colors.danger} />
            <Text style={styles.errorText}>{error || 'No questions available'}</Text>
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

  const currentQuestion = questions[currentQuestionIndex];
  const currentState = questionStates[currentQuestionIndex];

  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
    const newStates = [...questionStates];
    newStates[currentQuestionIndex] = {
      ...newStates[currentQuestionIndex],
      status: 'answered',
      selectedOption: option,
    };
    setQuestionStates(newStates);
  };

  const handleMarkForReview = () => {
    const newMarked = new Set(markedForReview);
    if (newMarked.has(currentQuestionIndex)) {
      newMarked.delete(currentQuestionIndex);
    } else {
      newMarked.add(currentQuestionIndex);
    }
    setMarkedForReview(newMarked);

    const newStates = [...questionStates];
    newStates[currentQuestionIndex] = {
      ...newStates[currentQuestionIndex],
      status: 'marked',
    };
    setQuestionStates(newStates);
  };

  const handleNavigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    const state = questionStates[index];
    setSelectedOption(state?.selectedOption || null);
    
    // Mark as visited if not already
    if (questionStates[index].status === 'not-visited') {
      const newStates = [...questionStates];
      newStates[index].status = 'not-answered';
      setQuestionStates(newStates);
    }
  };

  const handleSaveAndNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      handleNavigateToQuestion(currentQuestionIndex + 1);
    } else {
      handleFinishTest();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      handleNavigateToQuestion(currentQuestionIndex - 1);
    }
  };

  const getQuestionStatus = (index: number): QuestionStatus => {
    if (markedForReview.has(index)) return 'marked';
    const state = questionStates[index];
    return state?.status || 'not-visited';
  };

  const getStatusColor = (status: QuestionStatus) => {
    switch (status) {
      case 'answered':
        return colors.accent;
      case 'not-answered':
        return colors.danger;
      case 'marked':
        return colors.warning;
      default:
        return colors.authBorder;
    }
  };

  const answeredCount = questionStates.filter((s) => s.status === 'answered').length;
  const markedCount = markedForReview.size;

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <LinearGradient colors={colors.gradientAuthLight as [string, string, ...string[]]} style={styles.backgroundGradient}>
        {/* Header with Heading and Time */}
        <LinearGradient
          colors={colors.gradientPrimary as [string, string, ...string[]]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.headerBackButton}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>MHT CET Test</Text>
                <Text style={styles.headerSubtitle}>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.15)'] as [string, string, ...string[]]}
                style={styles.timerContainerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="time" size={18} color="#FFFFFF" />
                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
              </LinearGradient>
              <TouchableOpacity
                style={styles.questionsButton}
                onPress={() => setShowQuestionsOverlay(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="list" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Main Question Area - Full Screen */}
        <View style={styles.content}>
          <ScrollView
            style={styles.questionArea}
            contentContainerStyle={styles.questionAreaContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <View style={styles.questionCard}>
                <View style={styles.questionNumberContainer}>
                  <View style={styles.questionNumberBadge}>
                    <Text style={styles.questionNumberBadgeText}>{currentQuestionIndex + 1}</Text>
                  </View>
                  <Text style={styles.questionText}>{currentQuestion.question}</Text>
                </View>

                <View style={styles.optionsContainer}>
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedOption === option;
                    const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D
                    return (
                      <Pressable
                        key={idx}
                        style={[
                          styles.optionButton,
                          isSelected && styles.optionSelected,
                        ]}
                        onPress={() => handleSelectOption(option)}
                      >
                        <View style={styles.optionContent}>
                          <View
                            style={[
                              styles.optionLabel,
                              isSelected && styles.optionLabelSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.optionLabelText,
                                isSelected && styles.optionLabelTextSelected,
                              ]}
                            >
                              {optionLabel}
                            </Text>
                          </View>
                          <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                            {option}
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={styles.selectedIconContainer}>
                            <Ionicons name="checkmark-circle" size={26} color={colors.accent} />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
                
                {/* Mark for Review Button */}
                <TouchableOpacity
                  style={[
                    styles.markForReviewButton,
                    markedForReview.has(currentQuestionIndex) && styles.markForReviewButtonActive,
                  ]}
                  onPress={handleMarkForReview}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={markedForReview.has(currentQuestionIndex) ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={markedForReview.has(currentQuestionIndex) ? '#FFFFFF' : colors.warning}
                  />
                  <Text
                    style={[
                      styles.markForReviewText,
                      markedForReview.has(currentQuestionIndex) && styles.markForReviewTextActive,
                    ]}
                  >
                    {markedForReview.has(currentQuestionIndex) ? 'Marked for Review' : 'Mark for Review'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </View>

        {/* Bottom Navigation */}
        <View style={[styles.bottomNavigation, { paddingBottom: insets.bottom }]}>
          {currentQuestionIndex > 0 && (
            <TouchableOpacity
              style={styles.prevButton}
              onPress={handlePrevious}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
              <Text style={styles.prevButtonText}>Prev</Text>
            </TouchableOpacity>
          )}
          <View style={styles.navSpacer} />
          <TouchableOpacity
            style={styles.saveNextButton}
            onPress={handleSaveAndNext}
            disabled={submitting}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={colors.gradientPrimary as [string, string, ...string[]]}
              style={styles.saveNextGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.saveNextText}>
                {currentQuestionIndex < questions.length - 1
                  ? 'Save & Next'
                  : 'Finish Test'}
              </Text>
              <Ionicons
                name={
                  currentQuestionIndex < questions.length - 1
                    ? 'chevron-forward'
                    : 'checkmark-circle'
                }
                size={20}
                color="#FFFFFF"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Fullscreen Questions Overlay */}
        {showQuestionsOverlay && (
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: overlayOpacity,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.overlayContent,
                {
                  transform: [{ scale: overlayScale }],
                  marginTop: insets.top,
                  marginBottom: insets.bottom,
                },
              ]}
            >
              <View style={styles.overlayHeader}>
                <View style={styles.overlayHeaderLeft}>
                  <View style={styles.overlayIconContainer}>
                    <Ionicons name="list" size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.overlayTitle}>Question Navigator</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowQuestionsOverlay(false)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={24} color={colors.authText} />
                </TouchableOpacity>
              </View>

              <View style={styles.statusLegend}>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                    <Text style={styles.legendText}>Answered ({answeredCount})</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                    <Text style={styles.legendText}>Not Answered</Text>
                  </View>
                </View>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                    <Text style={styles.legendText}>Marked ({markedCount})</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.authBorder }]} />
                    <Text style={styles.legendText}>Not Visited</Text>
                  </View>
                </View>
              </View>

              <ScrollView
                style={styles.overlayScrollView}
                contentContainerStyle={styles.questionGridContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.questionGrid}>
                  {questions.map((_, index) => {
                    const status = getQuestionStatus(index);
                    const isCurrent = index === currentQuestionIndex;
                    const statusColor = getStatusColor(status);
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.questionNumberButton,
                          isCurrent && styles.questionNumberButtonActive,
                          { backgroundColor: isCurrent ? colors.primary : statusColor },
                        ]}
                        onPress={() => {
                          handleNavigateToQuestion(index);
                          setShowQuestionsOverlay(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.questionNumberButtonText,
                            isCurrent && styles.questionNumberButtonTextActive,
                          ]}
                        >
                          {index + 1}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </Animated.View>
          </Animated.View>
        )}
      </LinearGradient>
      {currentQuestion?._id && (
        <ReportQuestionModal
          visible={reportModalVisible}
          questionId={currentQuestion._id}
          onClose={() => setReportModalVisible(false)}
        />
      )}
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
  headerGradient: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    ...shadow.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: spacing.xs / 2,
    fontSize: 18,
  },
  headerSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  timerContainerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  timerText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  questionsButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  questionArea: {
    flex: 1,
  },
  questionAreaContent: {
    padding: spacing.xxl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.xl + spacing.md,
  },
  questionCard: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.xl + 4,
    padding: spacing.xxl,
    ...shadow.lg,
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  questionNumberContainer: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  questionNumberBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  questionNumberBadgeText: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 20,
  },
  questionText: {
    ...typography.h3,
    color: colors.authText,
    flex: 1,
    lineHeight: 28,
    fontWeight: '600',
    fontSize: 18,
  },
  questionNumber: {
    ...typography.h2,
    color: colors.authText,
    marginBottom: spacing.xl,
    lineHeight: 32,
    fontWeight: '600',
  },
  optionsContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  optionButton: {
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.authBorder,
    padding: spacing.lg + 2,
    backgroundColor: colors.authSurface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow.sm,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
    borderWidth: 2.5,
    ...shadow.md,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  optionLabel: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.authInputBg,
    borderWidth: 2,
    borderColor: colors.authBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabelSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    ...shadow.sm,
  },
  optionLabelText: {
    ...typography.subtitle,
    color: colors.authTextMuted,
    fontWeight: '700',
  },
  optionLabelTextSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    ...typography.body,
    color: colors.authText,
    flex: 1,
    lineHeight: 22,
  },
  optionTextSelected: {
    color: colors.authText,
    fontWeight: '600',
  },
  selectedIconContainer: {
    marginLeft: spacing.xs,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  markForReviewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.authInputBg,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.authInputBg,
    borderWidth: 2,
    borderColor: colors.danger,
  },
  reportButtonText: {
    ...typography.subtitle,
    color: colors.danger,
    fontWeight: '600',
  },
  markForReviewButtonActive: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  markForReviewText: {
    ...typography.subtitle,
    color: colors.warning,
    fontWeight: '600',
  },
  markForReviewTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bottomNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.authSurface,
    borderTopWidth: 1,
    borderTopColor: colors.authBorder,
    ...shadow.xl,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.xl,
    backgroundColor: colors.authInputBg,
    borderWidth: 1.5,
    borderColor: colors.authBorder,
    ...shadow.sm,
  },
  prevButtonText: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  navSpacer: {
    flex: 1,
  },
  saveNextButton: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.lg,
  },
  saveNextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  saveNextText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  // Fullscreen Questions Overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  overlayContent: {
    flex: 1,
    backgroundColor: colors.authSurface,
    margin: spacing.lg,
    borderRadius: radius.xl + 4,
    overflow: 'hidden',
    ...shadow.xl,
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  overlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.authBorder,
    backgroundColor: colors.authSurface,
  },
  overlayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  overlayIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTitle: {
    ...typography.h2,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.authInputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusLegend: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.authBorder,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: radius.full,
  },
  legendText: {
    ...typography.caption,
    color: colors.authTextSecondary,
  },
  overlayScrollView: {
    flex: 1,
  },
  questionGridContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  questionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  questionNumberButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  questionNumberButtonActive: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...shadow.lg,
  },
  questionNumberButtonText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  questionNumberButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
