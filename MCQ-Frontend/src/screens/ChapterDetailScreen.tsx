import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState, useRef } from 'react';
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
import type { AppStackParamList } from '../navigation/types';
import { getYearsBySubjectAndChapter, generateChapterPractice, getTestReports } from '../services/mcq.service';
import { colors, radius, spacing, typography, shadow } from '../theme';
import ModernCard from '../components/ui/ModernCard';
import GradientButton from '../components/ui/GradientButton';
import BackHeader from '../components/ui/BackHeader';

export type ChapterDetailScreenProps = NativeStackScreenProps<AppStackParamList, 'ChapterDetail'>;

export default function ChapterDetailScreen({ route, navigation }: ChapterDetailScreenProps) {
  const { subject, chapter } = route.params;
  const [years, setYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPractice, setGeneratingPractice] = useState(false);
  const [testReports, setTestReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

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

    async function fetchYears() {
      setLoading(true);
      setError(null);
      try {
        const response = await getYearsBySubjectAndChapter(subject, chapter);
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
          setLoading(false);
        }
      }
    }

    fetchYears();

    return () => {
      isMounted = false;
    };
  }, [chapter, subject]);

  useEffect(() => {
    let isMounted = true;

    async function fetchReports() {
      setLoadingReports(true);
      try {
        const response = await getTestReports({
          subject,
          chapter,
          testType: 'chapter',
        });
        if (isMounted) {
          setTestReports(response.data);
        }
      } catch (requestError) {
        console.error('Failed to load test reports:', requestError);
        if (isMounted) {
          setTestReports([]);
        }
      } finally {
        if (isMounted) {
          setLoadingReports(false);
        }
      }
    }

    fetchReports();

    return () => {
      isMounted = false;
    };
  }, [chapter, subject]);

  const handleSolveAll = async () => {
    setGeneratingPractice(true);
    try {
      // Generate random practice test with unattempted questions and create test session
      const response = await generateChapterPractice(subject, chapter, 20);
      
      if (response.data && response.data.sessionId && response.data.questions) {
        // Navigate to CBT Simulator screen with test session
        navigation.navigate('CBT', {
          testId: response.data.sessionId,
          questions: response.data.questions, // Question IDs
        });
      } else {
        // Fallback to regular mode if no questions
        navigation.navigate('Questions', {
          subject,
          chapter,
          mode: 'all',
        });
      }
    } catch (error) {
      console.error('Failed to generate practice:', error);
      // Fallback to regular mode on error
      navigation.navigate('Questions', {
        subject,
        chapter,
        mode: 'all',
      });
    } finally {
      setGeneratingPractice(false);
    }
  };

  const handleSolveByYear = (year: string) => {
    navigation.navigate('Questions', {
      subject,
      chapter,
      mode: 'year',
      year,
    });
  };

  const renderYearContent = () => {
    if (loading) {
      return (
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.stateText}>Loading years...</Text>
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

    if (years.length === 0) {
      return (
        <View style={styles.stateCard}>
          <Ionicons name="calendar-outline" size={48} color={colors.authTextMuted} />
          <Text style={styles.stateText}>No specific years available for this chapter.</Text>
        </View>
      );
    }

    return (
      <View style={styles.yearGrid}>
        {years.map((year, index) => (
          <Animated.View
            key={`${year}-${index}`}
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 30],
                    outputRange: [0, 30 + index * 5],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={styles.yearPill}
              onPress={() => handleSolveByYear(year)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={colors.gradientPrimary as [string, string, ...string[]]}
                style={styles.yearPillGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.yearPillIcon}>
                  <Ionicons name="calendar" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.yearText}>{year}</Text>
                <Ionicons name="chevron-forward" size={16} color="#FFFFFF" style={styles.yearChevron} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={colors.gradientAuthLight as [string, string, ...string[]]}
        style={styles.backgroundGradient}
      >
        <BackHeader
          title={chapter}
          subtitle={`Subject: ${subject}`}
          onBack={() => navigation.goBack()}
        />
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
            {/* Chapter Info Card */}
            <LinearGradient
              colors={colors.gradientPrimary as [string, string, ...string[]]}
              style={styles.heroCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroIconContainer}>
                  <Ionicons name="book" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.heroTextContainer}>
                  <Text style={styles.heroTitle}>{chapter}</Text>
                  <Text style={styles.heroSubtitle}>{subject}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Full Practice Card */}
            <TouchableOpacity
              onPress={handleSolveAll}
              disabled={generatingPractice}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={colors.gradientAccent as [string, string, ...string[]]}
                style={styles.fullPracticeCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.fullPracticeContent}>
                  <View style={styles.fullPracticeLeft}>
                    <View style={styles.fullPracticeIconContainer}>
                      <Ionicons name="play-circle" size={36} color="#FFFFFF" />
                    </View>
                    <View style={styles.fullPracticeText}>
                      <Text style={styles.fullPracticeTitle}>Full Chapter Practice</Text>
                      <Text style={styles.fullPracticeSubtitle}>
                        Solve all questions from this chapter
                      </Text>
                    </View>
                  </View>
                  <View style={styles.fullPracticeRight}>
                    {generatingPractice ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Ionicons name="arrow-forward-circle" size={32} color="#FFFFFF" />
                    )}
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Practice by Year Card */}
            <ModernCard variant="elevated" padding="lg" style={styles.yearPracticeCard}>
              <View style={styles.yearPracticeHeader}>
                <View style={styles.yearPracticeIconContainer}>
                  <LinearGradient
                    colors={colors.gradientPrimary as [string, string, ...string[]]}
                    style={styles.yearPracticeIconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="calendar" size={24} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                <View style={styles.yearPracticeContent}>
                  <Text style={styles.yearPracticeTitle}>Practice by Year</Text>
                  <Text style={styles.yearPracticeSubtitle}>
                    Focus on a specific year's papers
                  </Text>
                </View>
              </View>
              {renderYearContent()}
            </ModernCard>
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
    paddingTop: spacing.xl,
    paddingBottom: 100,
    gap: spacing.lg,
  },
  heroCard: {
    borderRadius: radius.xl + 6,
    padding: spacing.xxl,
    marginBottom: spacing.xl,
    ...shadow.xl,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.xl + 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    ...typography.h1,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: spacing.xs,
    fontSize: 26,
  },
  heroSubtitle: {
    ...typography.subtitle,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    fontSize: 16,
  },
  fullPracticeCard: {
    borderRadius: radius.xl + 4,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadow.xl,
    minHeight: 120,
  },
  fullPracticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fullPracticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fullPracticeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  fullPracticeText: {
    flex: 1,
  },
  fullPracticeTitle: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 22,
  },
  fullPracticeSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
  },
  fullPracticeRight: {
    marginLeft: spacing.md,
  },
  yearPracticeCard: {
    marginBottom: spacing.md,
    borderRadius: radius.xl + 4,
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  yearPracticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  yearPracticeIconContainer: {
    marginRight: spacing.md,
  },
  yearPracticeIconGradient: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearPracticeContent: {
    flex: 1,
  },
  yearPracticeTitle: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  yearPracticeSubtitle: {
    ...typography.body,
    color: colors.authTextSecondary,
  },
  stateCard: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.xl + 2,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadow.lg,
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
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  yearPill: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.md,
    minWidth: 110,
  },
  yearPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  yearPillIcon: {
    opacity: 0.9,
  },
  yearText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  yearChevron: {
    marginLeft: spacing.xs,
    opacity: 0.8,
  },
  reportsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  reportsLoadingText: {
    ...typography.body,
    color: colors.authTextMuted,
  },
  reportsEmpty: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  reportsEmptyText: {
    ...typography.subtitle,
    color: colors.authText,
    fontWeight: '600',
  },
  reportsEmptySubtext: {
    ...typography.caption,
    color: colors.authTextMuted,
    textAlign: 'center',
  },
  reportsList: {
    gap: spacing.md,
  },
  reportItem: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.xl + 2,
    padding: spacing.md,
    ...shadow.md,
  },
  reportItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reportItemInfo: {
    flex: 1,
  },
  reportItemDate: {
    ...typography.subtitle,
    color: colors.authText,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  reportItemTime: {
    ...typography.caption,
    color: colors.authTextMuted,
  },
  reportItemScore: {
    alignItems: 'flex-end',
  },
  reportItemScoreText: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  reportItemAccuracy: {
    ...typography.caption,
    color: colors.authTextMuted,
  },
  reportItemFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.authBorder,
  },
  reportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
  },
  reportBadgeCorrect: {
    backgroundColor: '#D1FAE5',
  },
  reportBadgeWrong: {
    backgroundColor: '#FEE2E2',
  },
  reportBadgeText: {
    ...typography.caption,
    color: colors.authText,
    fontWeight: '600',
  },
  reportsMoreText: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontWeight: '600',
  },
});
