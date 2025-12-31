import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import type { AppStackParamList } from '../navigation/types';
import {
  getQuestionsBySubjectAndChapter,
  getQuestionsBySubjectChapterAndYear,
  submitAnswer,
  getQuestionSolution,
  saveQuestion,
  unsaveQuestion,
  getSavedStatus,
  getUserAttemptsByQuestions,
  revealQuestion,
  getDailyViews,
} from '../services/mcq.service';
import type { Question } from '../types/mcq';
import { colors, radius, spacing, typography, shadow } from '../theme';
import { useAuth } from '../context/AuthContext';
import ModernCard from '../components/ui/ModernCard';
import BackHeader from '../components/ui/BackHeader';
import GradientButton from '../components/ui/GradientButton';
import ReportQuestionModal from '../components/ui/ReportQuestionModal';
import MathText from '../components/ui/MathText';
import PremiumLockModal from '../components/ui/PremiumLockModal';

const QUESTIONS_PER_PAGE = 5;

export type QuestionsScreenProps = NativeStackScreenProps<AppStackParamList, 'Questions'>;

interface QuestionState {
  questionId: string;
  selectedOption: string | null;
  isCorrect: boolean | null;
  isSubmitted: boolean;
  isSubmitting: boolean;
  solution?: string;
  isLoadingSolution: boolean;
  showSolution: boolean;
  isSaved: boolean;
  isSaving: boolean;
}

export default function QuestionsScreen({ route, navigation }: QuestionsScreenProps) {
  const { subject, chapter, mode, year, randomQuestions } = route.params;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [displayedCount, setDisplayedCount] = useState(QUESTIONS_PER_PAGE);
  const [loading, setLoading] = useState(true);
  const [questionStates, setQuestionStates] = useState<Map<string, QuestionState>>(new Map());
  const [showWithAttempts, setShowWithAttempts] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportingQuestionId, setReportingQuestionId] = useState<string | null>(null);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [revealedQuestions, setRevealedQuestions] = useState<Set<string>>(new Set());
  const [dailyViewsRemaining, setDailyViewsRemaining] = useState<number | null>(null);
  const { user } = useAuth();
  const isPremium = user?.subscription === 'premium';

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

  // Fetch daily views on mount
  useEffect(() => {
    async function fetchDailyViews() {
      if (!isPremium) {
        try {
          const response = await getDailyViews();
          setDailyViewsRemaining(response.dailyViewsRemaining);
        } catch (error) {
          console.error('Failed to fetch daily views:', error);
          // Set to null on error so we show "Loading..." instead of "Daily limit reached"
          setDailyViewsRemaining(null);
        }
      } else {
        // Premium users have unlimited views
        setDailyViewsRemaining(-1);
      }
    }
    fetchDailyViews();
  }, [isPremium]);

  useEffect(() => {
    let isMounted = true;

    async function fetchQuestions() {
      setLoading(true);
      try {
        let questionsData: Question[] = [];

        // If random mode with pre-loaded questions, use them directly
        if (mode === 'random' && randomQuestions && randomQuestions.length > 0) {
          questionsData = randomQuestions;
        } else {
          // Otherwise fetch questions normally
          const response =
            mode === 'year' && year
              ? await getQuestionsBySubjectChapterAndYear(subject, chapter, year)
              : await getQuestionsBySubjectAndChapter(subject, chapter);
          questionsData = response.data || [];
        }

        if (isMounted) {
          setQuestions(questionsData);
          setDisplayedCount(QUESTIONS_PER_PAGE);
          
          // Initialize question states
          const states = new Map<string, QuestionState>();
          
          // Check saved status for all questions
          const savedStatusPromises = questionsData.map(async (q) => {
            try {
              const statusResponse = await getSavedStatus(q._id);
              return { questionId: q._id, isSaved: statusResponse.data.isSaved };
            } catch {
              return { questionId: q._id, isSaved: false };
            }
          });
          
          const savedStatuses = await Promise.all(savedStatusPromises);
          const savedStatusMap = new Map(savedStatuses.map(s => [s.questionId, s.isSaved]));
          
          // If showWithAttempts is enabled, fetch previous attempts
          if (showWithAttempts) {
            try {
              const questionIds = questionsData.map(q => q._id);
              const attemptsResponse = await getUserAttemptsByQuestions(questionIds);
              const attemptsMap = attemptsResponse.data;
              
              questionsData.forEach((q) => {
                const attempt = attemptsMap[q._id];
                states.set(q._id, {
                  questionId: q._id,
                  selectedOption: attempt?.selectedOption || null,
                  isCorrect: attempt?.isCorrect ?? null,
                  isSubmitted: attempt?.isSubmitted || false,
                  isSubmitting: false,
                  solution: q.solution,
                  isLoadingSolution: false,
                  showSolution: false,
                  isSaved: savedStatusMap.get(q._id) || false,
                  isSaving: false,
                });
              });
            } catch (error) {
              // If fetching attempts fails, initialize without attempts
              console.error('Failed to fetch attempts:', error);
              questionsData.forEach((q) => {
                states.set(q._id, {
                  questionId: q._id,
                  selectedOption: null,
                  isCorrect: null,
                  isSubmitted: false,
                  isSubmitting: false,
                  solution: q.solution,
                  isLoadingSolution: false,
                  showSolution: false,
                  isSaved: savedStatusMap.get(q._id) || false,
                  isSaving: false,
                });
              });
            }
          } else {
            // Fresh start - no previous attempts
            questionsData.forEach((q) => {
              states.set(q._id, {
                questionId: q._id,
                selectedOption: null,
                isCorrect: null,
                isSubmitted: false,
                isSubmitting: false,
                solution: q.solution,
                isLoadingSolution: false,
                showSolution: false,
                isSaved: savedStatusMap.get(q._id) || false,
                isSaving: false,
              });
            });
          }
          
          setQuestionStates(states);
        }
      } catch (error) {
        // If backend says this chapter is premium-only, show premium modal instead of silent failure.
        // mcq.service wraps axios errors into a regular Error with a message, so we inspect the message.
        const message = (error as Error)?.message?.toLowerCase?.() ?? '';

        if (message.includes('premium')) {
          if (isMounted) {
            setPremiumModalVisible(true);
          }
        } else {
          console.error('Failed to load questions:', error);
        }

        // In all error cases, show empty list
        if (isMounted) {
          setQuestions([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchQuestions();

    return () => {
      isMounted = false;
    };
  }, [chapter, mode, subject, year, randomQuestions, showWithAttempts]);

  // Reset question states when navigating away or when questions change
  useEffect(() => {
    return () => {
      // Cleanup: reset states when component unmounts or dependencies change
      setQuestionStates(new Map());
    };
  }, [chapter, mode, subject, year]);

  const displayedQuestions = questions.slice(0, displayedCount);
  const hasMore = displayedCount < questions.length;
  const totalQuestions = questions.length;

  const handleLoadMore = () => {
    setDisplayedCount((prev) => Math.min(prev + QUESTIONS_PER_PAGE, totalQuestions));
  };

  const handleRevealQuestion = async (questionId: string) => {
    // Premium users don't need to reveal
    if (isPremium) {
      setRevealedQuestions((prev) => new Set(prev).add(questionId));
      return;
    }

    // Check if already revealed
    if (revealedQuestions.has(questionId)) {
      return;
    }

    // Check daily limit
    if (dailyViewsRemaining !== null && dailyViewsRemaining <= 0) {
      Alert.alert(
        'Daily Limit Reached',
        "You have reached your today's limit to see more questions. Upgrade to premium to see unlimited questions.",
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upgrade to Premium',
            onPress: () => navigation.navigate('PremiumPurchase'),
          },
        ],
      );
      return;
    }

    try {
      const response = await revealQuestion(questionId);
      if (response.isRevealed) {
        setRevealedQuestions((prev) => new Set(prev).add(questionId));
        setDailyViewsRemaining(response.dailyViewsRemaining);
      } else {
        Alert.alert(
          'Daily Limit Reached',
          response.message || "You have reached your today's limit to see more questions. Upgrade to premium to see unlimited questions.",
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Upgrade to Premium',
              onPress: () => navigation.navigate('PremiumPurchase'),
            },
          ],
        );
      }
    } catch (error) {
      const message = (error as Error)?.message || 'Failed to reveal question';
      if (message.includes('limit')) {
        Alert.alert(
          'Daily Limit Reached',
          "You have reached your today's limit to see more questions. Upgrade to premium to see unlimited questions.",
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Upgrade to Premium',
              onPress: () => navigation.navigate('PremiumPurchase'),
            },
          ],
        );
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  const handleOptionSelect = async (questionId: string, selectedOption: string) => {
    const state = questionStates.get(questionId);
    
    // Don't allow selection if currently submitting
    if (state?.isSubmitting) {
      return;
    }
    
    // Allow re-selection even if already submitted (to update answer)
    // If selecting a different option than previously submitted, reset submitted state
    const isNewSelection = state?.selectedOption !== selectedOption;
    
    // Update state to show selection
    setQuestionStates((prev) => {
      const newMap = new Map(prev);
      const currentState = newMap.get(questionId);
      if (currentState) {
        newMap.set(questionId, {
          ...currentState,
          selectedOption,
          // Reset submitted state if selecting a different option
          isSubmitted: isNewSelection ? false : currentState.isSubmitted,
          isCorrect: isNewSelection ? null : currentState.isCorrect,
        });
      }
      return newMap;
    });

    // Submit answer to backend
    setQuestionStates((prev) => {
      const newMap = new Map(prev);
      const currentState = newMap.get(questionId);
      if (currentState) {
        newMap.set(questionId, {
          ...currentState,
          isSubmitting: true,
        });
      }
      return newMap;
    });

    try {
      const response = await submitAnswer({
        questionId,
        selectedOption,
      });

      // Update state with result
      setQuestionStates((prev) => {
        const newMap = new Map(prev);
        const currentState = newMap.get(questionId);
        if (currentState) {
          newMap.set(questionId, {
            ...currentState,
            isCorrect: response.data.isCorrect,
            isSubmitted: true,
            isSubmitting: false,
          });
        }
        return newMap;
      });
    } catch (error) {
      // Revert selection on error
      setQuestionStates((prev) => {
        const newMap = new Map(prev);
        const currentState = newMap.get(questionId);
        if (currentState) {
          newMap.set(questionId, {
            ...currentState,
            selectedOption: null,
            isSubmitting: false,
          });
        }
        return newMap;
      });
      
      // You could show an error toast here
      console.error('Failed to submit answer:', error);
    }
  };

  const handleSaveQuestion = async (questionId: string) => {
    const state = questionStates.get(questionId);
    if (!state || state.isSaving) {
      return;
    }

    // Update saving state
    setQuestionStates((prev) => {
      const newMap = new Map(prev);
      const currentState = newMap.get(questionId);
      if (currentState) {
        newMap.set(questionId, {
          ...currentState,
          isSaving: true,
        });
      }
      return newMap;
    });

    try {
      if (state.isSaved) {
        await unsaveQuestion(questionId);
        setQuestionStates((prev) => {
          const newMap = new Map(prev);
          const currentState = newMap.get(questionId);
          if (currentState) {
            newMap.set(questionId, {
              ...currentState,
              isSaved: false,
              isSaving: false,
            });
          }
          return newMap;
        });
      } else {
        await saveQuestion(questionId);
        setQuestionStates((prev) => {
          const newMap = new Map(prev);
          const currentState = newMap.get(questionId);
          if (currentState) {
            newMap.set(questionId, {
              ...currentState,
              isSaved: true,
              isSaving: false,
            });
          }
          return newMap;
        });
      }
    } catch (error) {
      console.error('Failed to save/unsave question:', error);
      // Revert saving state on error
      setQuestionStates((prev) => {
        const newMap = new Map(prev);
        const currentState = newMap.get(questionId);
        if (currentState) {
          newMap.set(questionId, {
            ...currentState,
            isSaving: false,
          });
        }
        return newMap;
      });
    }
  };

  const handleAskAI = async (questionId: string) => {
    const state = questionStates.get(questionId);
    if (!state || state.isLoadingSolution) {
      return;
    }

    // If solution already loaded, just toggle display
    if (state.solution) {
      setQuestionStates((prev) => {
        const newMap = new Map(prev);
        const currentState = newMap.get(questionId);
        if (currentState) {
          newMap.set(questionId, {
            ...currentState,
            showSolution: !currentState.showSolution,
          });
        }
        return newMap;
      });
      return;
    }

    // Start loading
    setQuestionStates((prev) => {
      const newMap = new Map(prev);
      const currentState = newMap.get(questionId);
      if (currentState) {
        newMap.set(questionId, {
          ...currentState,
          isLoadingSolution: true,
          showSolution: true,
        });
      }
      return newMap;
    });

    try {
      // Simulate AI thinking delay for better UX (minimum 1.5 seconds)
      const [solutionResponse] = await Promise.all([
        getQuestionSolution(questionId),
        new Promise((resolve) => setTimeout(resolve, 1500)), // Minimum delay
      ]);

      // Update state with solution
      setQuestionStates((prev) => {
        const newMap = new Map(prev);
        const currentState = newMap.get(questionId);
        if (currentState) {
          newMap.set(questionId, {
            ...currentState,
            solution: solutionResponse.data.solution,
            isLoadingSolution: false,
            showSolution: true,
          });
        }
        return newMap;
      });
    } catch (error) {
      console.error('Failed to get solution:', error);
      // Revert loading state on error
      setQuestionStates((prev) => {
        const newMap = new Map(prev);
        const currentState = newMap.get(questionId);
        if (currentState) {
          newMap.set(questionId, {
            ...currentState,
            isLoadingSolution: false,
            showSolution: false,
          });
        }
        return newMap;
      });
    }
  };

  const getOptionStyle = (questionId: string, option: string) => {
    const state = questionStates.get(questionId);
    if (!state || !state.isSubmitted) {
      // Not submitted yet - show selected state
      if (state?.selectedOption === option) {
        return styles.optionSelected;
      }
      return styles.option;
    }

    // Submitted - show correct/incorrect states
    const question = questions.find((q) => q._id === questionId);
    const isCorrectAnswer = option === question?.correctanswrs;
    const isSelected = state.selectedOption === option;

    if (isCorrectAnswer) {
      return styles.optionCorrect;
    }
    if (isSelected && !isCorrectAnswer) {
      return styles.optionIncorrect;
    }
    return styles.optionDisabled;
  };

  const getOptionIcon = (questionId: string, option: string) => {
    const state = questionStates.get(questionId);
    if (!state || !state.isSubmitted) {
      if (state?.selectedOption === option) {
        return <Ionicons name="radio-button-on" size={20} color={colors.primary} />;
      }
      return <Ionicons name="radio-button-off" size={20} color={colors.authTextMuted} />;
    }

    const question = questions.find((q) => q._id === questionId);
    const isCorrectAnswer = option === question?.correctanswrs;
    const isSelected = state.selectedOption === option;

    if (isCorrectAnswer) {
      return <Ionicons name="checkmark-circle" size={20} color="#10B981" />;
    }
    if (isSelected && !isCorrectAnswer) {
      return <Ionicons name="close-circle" size={20} color={colors.danger} />;
    }
    return null;
  };

  const headerTitle = mode === 'year' && year ? `${chapter} – ${year}` : chapter;
  const headerSubtitle =
    mode === 'year' && year
      ? `${totalQuestions} questions from ${year}`
      : `${totalQuestions} questions available`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={colors.gradientAuthLight as [string, string, ...string[]]}
        style={styles.backgroundGradient}
      >
        <BackHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          onBack={() => navigation.goBack()}
        />
        {/* Toggle Button for Showing Attempts */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            onPress={() => setShowWithAttempts(!showWithAttempts)}
            activeOpacity={0.8}
            style={styles.toggleButton}
          >
            <LinearGradient
              colors={showWithAttempts ? (colors.gradientPrimary as [string, string, ...string[]]) : ([colors.authSurface, colors.authSurface] as [string, string, ...string[]])}
              style={[
                styles.toggleGradient,
                { borderColor: showWithAttempts ? colors.primary : colors.authBorder }
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons 
                name={showWithAttempts ? "checkmark-circle" : "refresh"} 
                size={20} 
                color={showWithAttempts ? "#FFFFFF" : colors.authTextMuted} 
                style={{ marginRight: spacing.xs }}
              />
              <Text style={[
                styles.toggleText,
                showWithAttempts && styles.toggleTextActive
              ]}>
                {showWithAttempts ? 'Showing My Attempts' : 'Show My Attempts'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.stateCard}>
              <Animated.View style={{ opacity: fadeAnim }}>
                <Ionicons name="hourglass-outline" size={48} color={colors.primary} />
                <Text style={styles.stateText}>Loading questions...</Text>
              </Animated.View>
            </View>
          ) : displayedQuestions.length === 0 ? (
            <View style={styles.stateCard}>
              <Animated.View style={{ opacity: fadeAnim }}>
                <Ionicons name="document-outline" size={48} color={colors.authTextMuted} />
                <Text style={styles.emptyText}>No questions found</Text>
              </Animated.View>
            </View>
          ) : (
            <>
              <View style={styles.questionsList}>
                {displayedQuestions.map((question, index) => (
                  <Animated.View
                    key={question._id}
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
                    <ModernCard
                      variant="elevated"
                      padding="lg"
                      style={styles.questionCard}
                    >
                      <View style={styles.questionHeader}>
                        <View style={styles.questionNumber}>
                          <Text style={styles.questionNumberText}>{index + 1}</Text>
                        </View>
                        <View style={styles.questionMeta}>
                          <View style={styles.metaRow}>
                            <Ionicons name="calendar" size={14} color={colors.primary} />
                            <Text style={styles.questionYear}>{question.year}</Text>
                          </View>
                        </View>
                        <View style={styles.headerActions}>
                          <TouchableOpacity
                            onPress={() => {
                              console.log('Report button pressed for question:', question._id);
                              setReportingQuestionId(question._id);
                              setReportModalVisible(true);
                            }}
                            style={styles.reportButton}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="flag-outline" size={20} color={colors.danger} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleSaveQuestion(question._id)}
                            disabled={questionStates.get(question._id)?.isSaving}
                            style={styles.saveButton}
                            activeOpacity={0.7}
                          >
                            {questionStates.get(question._id)?.isSaving ? (
                              <ActivityIndicator size="small" color={colors.primary} />
                            ) : questionStates.get(question._id)?.isSaved ? (
                              <Ionicons name="bookmark" size={24} color={colors.primary} />
                            ) : (
                              <Ionicons name="bookmark-outline" size={24} color={colors.authTextMuted} />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View 
                        style={styles.questionContentWrapper}
                      >
                        {/* Question Text - Show blurred for non-premium users */}
                        <View style={styles.questionTextContainer}>
                          {question.isBlurred && !isPremium && !revealedQuestions.has(question._id) ? (
                            <View style={styles.blurredWrapper}>
                              <View style={styles.blurredContent}>
                                <MathText style={[styles.questionText, styles.blurredQuestionText]}>
                                  {question.question}
                                </MathText>
                              </View>
                              <View style={styles.blurBackgroundLayer} />
                              <BlurView
                                intensity={100}
                                tint="light"
                                style={styles.blurOverlay}
                              >
                                <TouchableOpacity
                                  style={styles.blurTouchable}
                                  onPress={() => handleRevealQuestion(question._id)}
                                  activeOpacity={0.9}
                                >
                                  <View style={styles.blurContent}>
                                    <Ionicons name="eye-off" size={40} color={colors.primary} />
                                    <Text style={styles.blurTitle} numberOfLines={1}>Tap to Reveal Question</Text>
                                    <Text style={styles.blurSubtitle} numberOfLines={2}>
                                      {dailyViewsRemaining !== null && dailyViewsRemaining > 0
                                        ? `${dailyViewsRemaining} questions remaining today`
                                        : dailyViewsRemaining === 0
                                        ? 'Daily limit reached'
                                        : 'Loading...'}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              </BlurView>
                            </View>
                          ) : (
                            <MathText style={styles.questionText}>
                              {question.question}
                            </MathText>
                          )}
                        </View>
                      
                      {/* Options List */}
                      <View style={styles.optionsContainer}>
                        {question.options?.map((option, optionIndex) => {
                          const state = questionStates.get(question._id);
                          // Allow interaction if showing previous attempts (for reattempts) or if not submitted yet
                          const isDisabled = (!showWithAttempts && state?.isSubmitted) || state?.isSubmitting;
                          const isBlurred = question.isBlurred && !isPremium && !revealedQuestions.has(question._id);
                          
                          return (
                            <View key={optionIndex} style={styles.optionWrapper}>
                              {isBlurred ? (
                                <View style={styles.optionBlurredWrapper}>
                                  <View style={styles.optionBlurredContent}>
                                    <TouchableOpacity
                                      style={[
                                        getOptionStyle(question._id, option),
                                        isDisabled && styles.optionDisabledTouch,
                                      ]}
                                      disabled={true}
                                    >
                                      <View style={styles.optionContent}>
                                        <View style={styles.optionIconContainer}>
                                          {getOptionIcon(question._id, option)}
                                        </View>
                                        <MathText
                                          style={[
                                            styles.optionText,
                                            state?.selectedOption === option && styles.optionTextSelected,
                                            styles.blurredOptionText,
                                          ]}
                                        >
                                          {option}
                                        </MathText>
                                      </View>
                                    </TouchableOpacity>
                                  </View>
                                  <View style={styles.optionBlurBackgroundLayer} />
                                  <BlurView
                                    intensity={100}
                                    tint="light"
                                    style={styles.optionBlurOverlay}
                                  >
                                    <TouchableOpacity
                                      style={styles.optionBlurTouchable}
                                      onPress={() => handleRevealQuestion(question._id)}
                                      activeOpacity={0.9}
                                    />
                                  </BlurView>
                                </View>
                              ) : (
                                <TouchableOpacity
                                  style={[
                                    getOptionStyle(question._id, option),
                                    isDisabled && styles.optionDisabledTouch,
                                  ]}
                                  onPress={() => handleOptionSelect(question._id, option)}
                                  disabled={isDisabled}
                                  activeOpacity={isDisabled ? 1 : 0.7}
                                >
                                  <View style={styles.optionContent}>
                                    <View style={styles.optionIconContainer}>
                                      {getOptionIcon(question._id, option)}
                                    </View>
                                    <MathText
                                      style={[
                                        styles.optionText,
                                        state?.selectedOption === option && styles.optionTextSelected,
                                      ]}
                                    >
                                      {option}
                                    </MathText>
                                  </View>
                                </TouchableOpacity>
                              )}
                            </View>
                          );
                        })}
                      </View>
                      </View>

                      {/* Previous Attempt Indicator */}
                      {showWithAttempts && questionStates.get(question._id)?.isSubmitted && (
                        <View style={styles.previousAttemptBadge}>
                          <Ionicons name="time-outline" size={14} color={colors.primary} />
                          <Text style={styles.previousAttemptText}>Previous Attempt</Text>
                        </View>
                      )}

                      {/* Result Feedback */}
                      {questionStates.get(question._id)?.isSubmitted && (
                        <View style={styles.resultContainer}>
                          {questionStates.get(question._id)?.isCorrect ? (
                            <View style={styles.resultCorrect}>
                              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                              <Text style={styles.resultTextCorrect}>Correct!</Text>
                            </View>
                          ) : (
                            <View style={styles.resultIncorrect}>
                              <Ionicons name="close-circle" size={20} color={colors.danger} />
                              <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
                                <Text style={styles.resultTextIncorrect}>
                                  Incorrect. Correct answer:{' '}
                                </Text>
                                <MathText style={styles.resultTextIncorrect}>
                                  {question.correctanswrs}
                                </MathText>
                              </View>
                            </View>
                          )}

                          {/* Ask AI Button */}
                          <TouchableOpacity
                            style={styles.askAIButton}
                            onPress={() => handleAskAI(question._id)}
                            disabled={questionStates.get(question._id)?.isLoadingSolution}
                            activeOpacity={0.8}
                          >
                            <LinearGradient
                              colors={['#667EEA', '#764BA2'] as [string, string, ...string[]]}
                              style={styles.askAIGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                            >
                              {questionStates.get(question._id)?.isLoadingSolution ? (
                                <>
                                  <ActivityIndicator color="#FFFFFF" size="small" />
                                  <Text style={styles.askAIText}>AI is thinking...</Text>
                                </>
                              ) : questionStates.get(question._id)?.showSolution ? (
                                <>
                                  <Ionicons name="eye-off" size={18} color="#FFFFFF" />
                                  <Text style={styles.askAIText}>Hide Solution</Text>
                                </>
                              ) : (
                                <>
                                  <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                                  <Text style={styles.askAIText}>Ask AI</Text>
                                </>
                              )}
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Solution Display */}
                      {questionStates.get(question._id)?.showSolution && (
                        <Animated.View
                          style={[
                            styles.solutionContainer,
                            {
                              opacity: fadeAnim,
                            },
                          ]}
                        >
                          <View style={styles.solutionHeader}>
                            <View style={styles.solutionIconContainer}>
                              <LinearGradient
                                colors={['#667EEA', '#764BA2'] as [string, string, ...string[]]}
                                style={styles.solutionIconGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                              >
                                <Ionicons name="bulb" size={20} color="#FFFFFF" />
                              </LinearGradient>
                            </View>
                            <Text style={styles.solutionTitle}>AI Solution</Text>
                          </View>
                          {questionStates.get(question._id)?.isLoadingSolution ? (
                            <View style={styles.solutionLoading}>
                              <ActivityIndicator color={colors.primary} size="small" />
                              <Text style={styles.solutionLoadingText}>
                                AI is analyzing the question...
                              </Text>
                            </View>
                          ) : questionStates.get(question._id)?.solution ? (
                            <MathText style={styles.solutionText}>
                              {questionStates.get(question._id)?.solution}
                            </MathText>
                          ) : null}
                        </Animated.View>
                      )}
                    </ModernCard>
                  </Animated.View>
                ))}
              </View>

              {/* Load More Button */}
              {hasMore && (
                <Animated.View style={{ opacity: fadeAnim }}>
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={handleLoadMore}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={colors.gradientPrimary as [string, string, ...string[]]}
                      style={styles.loadMoreGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.loadMoreText}>
                        Load More ({totalQuestions - displayedCount} remaining)
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* End of List Indicator */}
              {!hasMore && totalQuestions > 0 && (
                <View style={styles.endIndicator}>
                  <Text style={styles.endIndicatorText}>
                    Showing all {totalQuestions} {totalQuestions === 1 ? 'question' : 'questions'}
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </LinearGradient>
      {reportingQuestionId && (
        <ReportQuestionModal
          visible={reportModalVisible}
          questionId={reportingQuestionId}
          onClose={() => {
            setReportModalVisible(false);
            setReportingQuestionId(null);
          }}
        />
      )}
      <PremiumLockModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
        onBuyPremium={() => {
          setPremiumModalVisible(false);
          navigation.navigate('PremiumPurchase');
        }}
      />
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
    paddingTop: spacing.xl,
    paddingBottom: 100,
  },
  questionsList: {
    gap: spacing.md,
  },
  questionCard: {
    marginBottom: spacing.sm,
    borderRadius: radius.xl + 2,
    position: 'relative',
    overflow: 'hidden',
  },
  questionContentWrapper: {
    position: 'relative',
  },
  questionTextContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  blurredWrapper: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.md,
    minHeight: 120,
  },
  blurredContent: {
    zIndex: 1,
    opacity: 0,
  },
  blurBackgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    zIndex: 9,
  },
  blurredQuestionText: {
    opacity: 0,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.md,
    overflow: 'hidden',
    zIndex: 10,
  },
  blurTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 120,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  blurContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    width: '100%',
  },
  blurTitle: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
    marginTop: spacing.sm,
    textAlign: 'center',
    fontSize: 16,
  },
  blurSubtitle: {
    ...typography.body,
    color: colors.authTextMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: spacing.xs,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  questionNumber: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionNumberText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  questionMeta: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  questionYear: {
    ...typography.subtitle,
    color: colors.authText,
    fontWeight: '600',
  },
  questionSource: {
    ...typography.caption,
    color: colors.authTextMuted,
  },
  questionText: {
    ...typography.body,
    color: colors.authText,
    lineHeight: 22,
    marginBottom: spacing.md,
    fontSize: 16,
    fontWeight: '500',
  },
  optionsContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  optionWrapper: {
    position: 'relative',
  },
  optionBlurredWrapper: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.lg,
  },
  optionBlurredContent: {
    zIndex: 1,
  },
  optionBlurBackgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    zIndex: 9,
  },
  blurredOptionText: {
    opacity: 0,
  },
  optionBlurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
    overflow: 'hidden',
    zIndex: 10,
  },
  optionBlurTouchable: {
    flex: 1,
    minHeight: 50,
  },
  option: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    borderWidth: 2,
    borderColor: colors.authBorder,
  },
  optionSelected: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  optionCorrect: {
    backgroundColor: '#D1FAE5',
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  optionIncorrect: {
    backgroundColor: '#FEE2E2',
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    borderWidth: 2,
    borderColor: colors.danger,
  },
  optionDisabled: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    borderWidth: 2,
    borderColor: colors.authBorder,
    opacity: 0.6,
  },
  optionDisabledTouch: {
    opacity: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionIconContainer: {
    width: 24,
    alignItems: 'center',
  },
  optionText: {
    ...typography.body,
    color: colors.authText,
    flex: 1,
    fontSize: 15,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  resultContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  resultCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#D1FAE5',
    padding: spacing.md,
    borderRadius: radius.md,
  },
  resultIncorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEE2E2',
    padding: spacing.md,
    borderRadius: radius.md,
  },
  resultTextCorrect: {
    ...typography.subtitle,
    color: '#10B981',
    fontWeight: '600',
  },
  resultTextIncorrect: {
    ...typography.subtitle,
    color: colors.danger,
    fontWeight: '600',
    flex: 1,
  },
  loadMoreButton: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginTop: spacing.xl,
    ...shadow.lg,
  },
  loadMoreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  loadMoreText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  endIndicator: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  endIndicatorText: {
    ...typography.caption,
    color: colors.authTextMuted,
  },
  stateCard: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.xl + 4,
    padding: spacing.xxxl,
    alignItems: 'center',
    marginTop: spacing.xl,
    ...shadow.lg,
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  stateText: {
    ...typography.body,
    color: colors.authTextMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.authTextMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  askAIButton: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.md,
  },
  askAIGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  askAIText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  solutionContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.authSurface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.authBorder,
    ...shadow.sm,
  },
  solutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  solutionIconContainer: {
    marginRight: spacing.xs,
  },
  solutionIconGradient: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  solutionTitle: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 18,
  },
  solutionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  solutionLoadingText: {
    ...typography.body,
    color: colors.authTextMuted,
    fontStyle: 'italic',
  },
  solutionText: {
    ...typography.body,
    color: colors.authText,
    lineHeight: 24,
    fontSize: 15,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reportButton: {
    padding: spacing.xs,
  },
  saveButton: {
    padding: spacing.xs,
  },
  previousAttemptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  previousAttemptText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  toggleContainer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  toggleButton: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.md,
  },
  toggleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
  },
  toggleText: {
    ...typography.subtitle,
    color: colors.authTextMuted,
    fontWeight: '600',
    fontSize: 15,
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
