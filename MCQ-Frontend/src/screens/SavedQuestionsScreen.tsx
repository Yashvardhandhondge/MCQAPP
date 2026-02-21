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
import { getSavedQuestionsBySubjects } from '../services/mcq.service';
import type { SavedQuestionsBySubject } from '../types/mcq';
import { colors, radius, spacing, typography, shadow } from '../theme';
import ModernCard from '../components/ui/ModernCard';
import BackHeader from '../components/ui/BackHeader';
import { safeGoBack } from '../utils/navigation';

const SUBJECT_ICONS: Record<string, string> = {
  Chemistry: 'flask',
  Physics: 'nuclear',
  Maths: 'calculator',
  Biology: 'leaf',
};

const SUBJECT_GRADIENTS: Record<string, string[]> = {
  Chemistry: ['#8B5CF6', '#7C3AED'],
  Physics: ['#6366F1', '#4F46E5'],
  Maths: ['#10B981', '#059669'],
  Biology: ['#F59E0B', '#D97706'],
};

export type SavedQuestionsScreenProps = NativeStackScreenProps<AppStackParamList, 'SavedQuestions'>;

export default function SavedQuestionsScreen({ navigation }: SavedQuestionsScreenProps) {
  const [subjects, setSubjects] = useState<SavedQuestionsBySubject[]>([]);
  const [loading, setLoading] = useState(true);

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
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await getSavedQuestionsBySubjects();
      setSubjects(response.data);
    } catch (error) {
      console.error('Failed to load saved questions by subjects:', error);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectPress = (subject: string) => {
    navigation.navigate('SavedQuestionsChapters', { subject });
  };

  const totalQuestions = subjects.reduce((sum, s) => sum + s.questionCount, 0);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <LinearGradient
        colors={colors.gradientAuthLight as [string, string, ...string[]]}
        style={styles.backgroundGradient}
      >
        <BackHeader
          title="Saved Questions"
          subtitle={totalQuestions > 0 ? `${totalQuestions} saved question${totalQuestions === 1 ? '' : 's'}` : 'No saved questions'}
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
                <Text style={styles.stateText}>Loading subjects...</Text>
              </Animated.View>
            </View>
          ) : subjects.length === 0 ? (
            <View style={styles.stateCard}>
              <Animated.View style={{ opacity: fadeAnim }}>
                <Ionicons name="bookmark-outline" size={48} color={colors.authTextMuted} />
                <Text style={styles.emptyText}>No saved questions</Text>
                <Text style={styles.emptySubtext}>
                  Save questions while practicing to view them here
                </Text>
              </Animated.View>
            </View>
          ) : (
            <View style={styles.subjectsList}>
              {subjects.map((subjectData, index) => (
                <Animated.View
                  key={subjectData.subject}
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
                    onPress={() => handleSubjectPress(subjectData.subject)}
                    activeOpacity={0.8}
                  >
                    <ModernCard
                      variant="elevated"
                      padding="lg"
                      style={styles.subjectCard}
                    >
                      <LinearGradient
                        colors={SUBJECT_GRADIENTS[subjectData.subject] as [string, string, ...string[]]}
                        style={styles.subjectGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.subjectContent}>
                          <View style={styles.subjectIconContainer}>
                            <Ionicons
                              name={SUBJECT_ICONS[subjectData.subject] as any}
                              size={32}
                              color="#FFFFFF"
                            />
                          </View>
                          <View style={styles.subjectTextContainer}>
                            <Text style={styles.subjectName}>{subjectData.subject}</Text>
                            <Text style={styles.subjectCount}>
                              {subjectData.questionCount} {subjectData.questionCount === 1 ? 'question' : 'questions'}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                        </View>
                      </LinearGradient>
                    </ModernCard>
                  </TouchableOpacity>
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
  subjectsList: {
    gap: spacing.md,
  },
  subjectCard: {
    marginBottom: spacing.sm,
    borderRadius: radius.xl + 2,
    overflow: 'hidden',
  },
  subjectGradient: {
    padding: spacing.lg,
    borderRadius: radius.xl + 2,
  },
  subjectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  subjectIconContainer: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  subjectTextContainer: {
    flex: 1,
  },
  subjectName: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 20,
    marginBottom: spacing.xs / 2,
  },
  subjectCount: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
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
