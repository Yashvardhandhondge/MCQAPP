import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { AppStackParamList } from '../navigation/types';
import { getSavedQuestionsBySubjectAndChapter, unsaveQuestion } from '../services/mcq.service';
import type { SavedQuestionWithAttempt } from '../types/mcq';
import { colors, radius, spacing, typography, shadow } from '../theme';
import ModernCard from '../components/ui/ModernCard';
import BackHeader from '../components/ui/BackHeader';
import MathText from '../components/ui/MathText';

import { safeGoBack } from '../utils/navigation';

export type SavedQuestionsListScreenProps = NativeStackScreenProps<AppStackParamList, 'SavedQuestionsList'>;

export default function SavedQuestionsListScreen({ route, navigation }: SavedQuestionsListScreenProps) {
  const { subject, chapter } = route.params;
  const [questions, setQuestions] = useState<SavedQuestionWithAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [unsavingIds, setUnsavingIds] = useState<Set<string>>(new Set());

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
    loadQuestions();
  }, [subject, chapter]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await getSavedQuestionsBySubjectAndChapter(subject, chapter);
      setQuestions(response.data);
    } catch (error) {
      console.error('Failed to load saved questions:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (questionId: string) => {
    if (unsavingIds.has(questionId)) {
      return;
    }

    setUnsavingIds((prev) => new Set(prev).add(questionId));

    try {
      await unsaveQuestion(questionId);
      // Remove from local state
      setQuestions((prev) => prev.filter((q) => q._id !== questionId));
    } catch (error) {
      console.error('Failed to unsave question:', error);
    } finally {
      setUnsavingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  const handleQuestionPress = (question: SavedQuestionWithAttempt) => {
    navigation.navigate('Questions', {
      subject: question.subject,
      chapter: question.chapter,
      mode: 'all',
    });
  };

  const getOptionStyle = (question: SavedQuestionWithAttempt, option: string) => {
    if (!question.userAttempt) {
      return styles.option;
    }

    const isCorrectAnswer = option === question.correctanswrs;
    const isSelected = question.userAttempt.selectedOption === option;

    if (isCorrectAnswer) {
      return styles.optionCorrect;
    }
    if (isSelected && !isCorrectAnswer) {
      return styles.optionIncorrect;
    }
    return styles.optionDisabled;
  };

  const getOptionIcon = (question: SavedQuestionWithAttempt, option: string) => {
    if (!question.userAttempt) {
      return null;
    }

    const isCorrectAnswer = option === question.correctanswrs;
    const isSelected = question.userAttempt.selectedOption === option;

    if (isCorrectAnswer) {
      return <Ionicons name="checkmark-circle" size={20} color="#10B981" />;
    }
    if (isSelected && !isCorrectAnswer) {
      return <Ionicons name="close-circle" size={20} color={colors.danger} />;
    }
    return null;
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <LinearGradient
        colors={colors.gradientAuthLight as [string, string, ...string[]]}
        style={styles.backgroundGradient}
      >
        <BackHeader
          title={chapter}
          subtitle={`${questions.length} saved question${questions.length === 1 ? '' : 's'}`}
          navigation={navigation}
        />
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.stateCard}>
              <Animated.View style={{ opacity: fadeAnim }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.stateText}>Loading questions...</Text>
              </Animated.View>
            </View>
          ) : questions.length === 0 ? (
            <View style={styles.stateCard}>
              <Animated.View style={{ opacity: fadeAnim }}>
                <Ionicons name="document-outline" size={48} color={colors.authTextMuted} />
                <Text style={styles.emptyText}>No saved questions</Text>
                <Text style={styles.emptySubtext}>
                  No saved questions found for this chapter
                </Text>
              </Animated.View>
            </View>
          ) : (
            <View style={styles.questionsList}>
              {questions.map((question, index) => (
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
                      <View style={styles.questionMeta}>
                        <View style={styles.metaRow}>
                          <Ionicons name="calendar" size={14} color={colors.primary} />
                          <Text style={styles.questionYear}>{question.year}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleUnsave(question._id)}
                        disabled={unsavingIds.has(question._id)}
                        style={styles.unsaveButton}
                        activeOpacity={0.7}
                      >
                        {unsavingIds.has(question._id) ? (
                          <ActivityIndicator size="small" color={colors.danger} />
                        ) : (
                          <Ionicons name="bookmark" size={24} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity
                      onPress={() => handleQuestionPress(question)}
                      activeOpacity={0.7}
                    >
                      <MathText style={styles.questionText}>{question.question}</MathText>
                    </TouchableOpacity>

                    {/* Show options with answers if attempted */}
                    {question.userAttempt && (
                      <View style={styles.optionsContainer}>
                        {question.options?.map((option, optionIndex) => (
                          <View
                            key={optionIndex}
                            style={[
                              getOptionStyle(question, option),
                              styles.optionDisabledTouch,
                            ]}
                          >
                            <View style={styles.optionContent}>
                              <View style={styles.optionIconContainer}>
                                {getOptionIcon(question, option)}
                              </View>
                              <MathText
                                style={[
                                  styles.optionText,
                                  ...(question.userAttempt?.selectedOption === option ? [styles.optionTextSelected] : []),
                                ]}
                              >
                                {option}
                              </MathText>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Result Feedback if attempted */}
                    {question.userAttempt && (
                      <View style={styles.resultContainer}>
                        {question.userAttempt.isCorrect ? (
                          <View style={styles.resultCorrect}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.resultTextCorrect}>Correct!</Text>
                          </View>
                        ) : (
                          <View style={styles.resultIncorrect}>
                            <Ionicons name="close-circle" size={20} color={colors.danger} />
                            <Text style={styles.resultTextIncorrect}>
                              Incorrect. Correct answer: {question.correctanswrs}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* View Question Button */}
                    <TouchableOpacity
                      onPress={() => handleQuestionPress(question)}
                      style={styles.viewQuestionButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewQuestionText}>
                        {question.userAttempt ? 'View Question Again' : 'View Question'}
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </ModernCard>
                </Animated.View>
              ))}
            </View>
          )}
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
    paddingTop: spacing.xl,
    paddingBottom: 100,
  },
  questionsList: {
    gap: spacing.md,
  },
  questionCard: {
    marginBottom: spacing.sm,
    borderRadius: radius.xl + 2,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  questionMeta: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  questionYear: {
    ...typography.body,
    color: colors.authTextMuted,
    fontSize: 13,
  },
  unsaveButton: {
    padding: spacing.xs,
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
  option: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    borderWidth: 2,
    borderColor: colors.authBorder,
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
  viewQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.authBorder,
  },
  viewQuestionText: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
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
    ...typography.h3,
    color: colors.authText,
    marginTop: spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    ...typography.body,
    color: colors.authTextMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});













