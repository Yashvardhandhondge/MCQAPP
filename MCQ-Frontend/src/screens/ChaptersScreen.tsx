import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { TabParamList } from '../navigation/types';
import { getChaptersWithAnalytics, getDashboard } from '../services/mcq.service';
import { colors, radius, spacing, typography, shadow } from '../theme';
import ModernCard from '../components/ui/ModernCard';
import BackHeader from '../components/ui/BackHeader';
import type { SubjectSummary, ChapterAnalytics } from '../types/mcq';

const SUBJECT_ICONS: Record<string, string> = {
  Chemistry: '🧪',
  Physics: '⚛️',
  Maths: '➗',
  Biology: '🧬',
};

const SUBJECT_COLORS: Record<string, string[]> = {
  Chemistry: ['#8B5CF6', '#7C3AED'],
  Physics: ['#6366F1', '#4F46E5'],
  Maths: ['#10B981', '#059669'],
  Biology: ['#F59E0B', '#D97706'],
};

export type ChaptersScreenProps = NativeStackScreenProps<TabParamList, 'Chapters'>;

export default function ChaptersScreen({ route, navigation }: ChaptersScreenProps) {
  const { subject } = route.params || {};
  const [chapters, setChapters] = useState<ChapterAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

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

  // Load subjects list when no subject is selected
  useEffect(() => {
    if (!subject) {
      let isMounted = true;
      async function fetchSubjects() {
        setSubjectsLoading(true);
        try {
          const response = await getDashboard();
          if (isMounted) {
            setSubjects(response.data.subjects);
          }
        } catch {
          // Silently fail
        } finally {
          if (isMounted) {
            setSubjectsLoading(false);
          }
        }
      }
      fetchSubjects();
      return () => {
        isMounted = false;
      };
    }
  }, [subject]);

  useEffect(() => {
    let isMounted = true;

    async function fetchChapters() {
      setLoading(true);
      setError(null);
      if (!subject) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const response = await getChaptersWithAnalytics(subject);
        if (isMounted) {
          setChapters(response.data);
        }
      } catch (requestError) {
        if (isMounted) {
          const message =
            requestError instanceof Error ? requestError.message : 'Failed to load chapters';
          setError(message);
          setChapters([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchChapters();

    return () => {
      isMounted = false;
    };
  }, [subject]);

  // Memoize content - must be called unconditionally
  const content = useMemo(() => {
    if (!subject) {
      // Subject selector view
      if (subjectsLoading) {
        return (
          <View style={styles.stateCard}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.stateText}>Loading subjects...</Text>
          </View>
        );
      }

      return (
        <View style={styles.subjectGrid}>
          {subjects.map((subj, index) => {
            const gradientColors = SUBJECT_COLORS[subj.name] || colors.gradientPrimary;
            return (
              <Animated.View
                key={subj.name}
                style={{
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 20],
                        outputRange: [0, 20 + index * 8],
                      }),
                    },
                  ],
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    navigation.setParams({ subject: subj.name });
                  }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={gradientColors as [string, string, ...string[]]}
                    style={styles.subjectCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.subjectContent}>
                      <View style={styles.subjectIconContainer}>
                        <Text style={styles.subjectIcon}>{SUBJECT_ICONS[subj.name] ?? '📘'}</Text>
                      </View>
                      <View style={styles.subjectInfo}>
                        <Text style={styles.subjectName}>{subj.name}</Text>
                        <View style={styles.subjectMetaContainer}>
                          <Ionicons name="document-text" size={14} color="rgba(255, 255, 255, 0.9)" />
                          <Text style={styles.subjectMeta}>
                            {subj.questionCount.toLocaleString()} questions
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={24} color="#FFFFFF" style={styles.subjectChevron} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      );
    }

    // Chapters view for selected subject
    if (loading) {
      return (
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.stateText}>Loading chapters...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.stateCard}>
          <Ionicons name="alert-circle" size={48} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (chapters.length === 0) {
      return (
        <View style={styles.stateCard}>
          <Ionicons name="document-outline" size={48} color={colors.authTextMuted} />
          <Text style={styles.stateText}>No chapters available.</Text>
        </View>
      );
    }

    return (
      <View style={styles.chapterList}>
        {chapters.map((item, index) => {
          const progressPercentage = item.totalQuestions > 0 
            ? Math.round((item.userAttempts / item.totalQuestions) * 100) 
            : 0;
          
          return (
            <Animated.View
              key={item.chapter}
              style={{
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 20],
                      outputRange: [0, 20 + index * 10],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  // Navigate to chapter detail using parent navigator
                  (navigation as any).getParent()?.navigate('ChapterDetail', {
                    subject,
                    chapter: item.chapter,
                  });
                }}
                activeOpacity={0.8}
              >
                <ModernCard variant="elevated" padding="lg" style={styles.chapterCard}>
                  <View style={styles.chapterContent}>
                    <View style={styles.chapterIconContainer}>
                      <Ionicons name="book" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.chapterInfo}>
                      <Text style={styles.chapterName}>{item.chapter}</Text>
                      <View style={styles.chapterStats}>
                        <View style={styles.statItem}>
                          <Ionicons name="document-text" size={14} color={colors.authTextMuted} />
                          <Text style={styles.statText}>
                            {item.totalQuestions.toLocaleString()} available
                          </Text>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                          <Text style={styles.statText}>
                            {item.userAttempts.toLocaleString()} solved
                          </Text>
                        </View>
                      </View>
                      {item.totalQuestions > 0 && (
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View 
                              style={[
                                styles.progressFill, 
                                { width: `${progressPercentage}%` }
                              ]} 
                            />
                          </View>
                          <Text style={styles.progressText}>{progressPercentage}% complete</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.authTextMuted} />
                  </View>
                </ModernCard>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  }, [chapters, error, loading, navigation, subject, subjects, subjectsLoading, fadeAnim, slideAnim]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={colors.gradientAuthLight as [string, string, ...string[]]}
        style={styles.backgroundGradient}
      >
        {subject ? (
          <BackHeader
            title={`${subject} Chapters`}
            subtitle="Choose a chapter to practice"
            onBack={() => navigation.setParams({ subject: undefined })}
          />
        ) : (
          <View style={styles.header}>
            <Text style={styles.title}>Chapters</Text>
            <Text style={styles.subtitle}>Select a subject to explore chapters</Text>
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
            {content}
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
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.authSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.authBorder,
  },
  title: {
    ...typography.h1,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.authTextSecondary,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: 100,
  },
  subjectGrid: {
    gap: spacing.lg,
  },
  subjectCard: {
    borderRadius: radius.xl + 4,
    padding: spacing.lg + 4,
    marginBottom: spacing.sm,
    ...shadow.xl,
  },
  subjectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
  },
  subjectIconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  subjectIcon: {
    fontSize: 36,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: spacing.sm,
    fontSize: 22,
  },
  subjectMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  subjectMeta: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  subjectChevron: {
    marginLeft: spacing.sm,
    opacity: 0.9,
  },
  chapterList: {
    gap: spacing.md,
  },
  chapterCard: {
    marginBottom: spacing.sm,
    borderRadius: radius.xl + 2,
  },
  chapterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chapterIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterName: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  chapterSubtitle: {
    ...typography.caption,
    color: colors.authTextMuted,
  },
  chapterStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    ...typography.caption,
    color: colors.authTextMuted,
    fontSize: 12,
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.authBorder,
    borderRadius: radius.sm,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  progressText: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
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
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
