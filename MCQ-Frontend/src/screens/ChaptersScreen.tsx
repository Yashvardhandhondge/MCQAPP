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
import type { AppStackParamList } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { getChaptersWithAnalytics, getDashboard } from '../services/mcq.service';
import { colors, radius, spacing, typography, shadow } from '../theme';
import BackHeader from '../components/ui/BackHeader';
import PremiumLockModal from '../components/ui/PremiumLockModal';
import type { SubjectSummary, ChapterAnalytics } from '../types/mcq';
import { categorizeChapters } from '../utils/chapterMapping';

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
  const appNavigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();
  const isPremium = user?.subscription === 'premium';
  const [chaptersData, setChaptersData] = useState<{ standard11: ChapterAnalytics[]; standard12: ChapterAnalytics[]; unclassified: ChapterAnalytics[] } | null>(null);
  const [selectedStandard, setSelectedStandard] = useState<'11' | '12' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);

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
          // Handle both old format (array) and new format (object with standard11/standard12)
          const data = response.data;
          
          if (Array.isArray(data)) {
            // Old format - categorize chapters using frontend mapping
            console.log('Received old format (array), categorizing chapters...');
            const categorized = categorizeChapters(data, subject);
            console.log('Categorized chapters:', {
              std11: categorized.standard11.length,
              std12: categorized.standard12.length,
              unclassified: categorized.unclassified.length,
            });
            setChaptersData(categorized);
          } else if (data && typeof data === 'object') {
            // New format - ensure all properties exist
            console.log('Received new format:', {
              std11: data.standard11?.length || 0,
              std12: data.standard12?.length || 0,
              unclassified: data.unclassified?.length || 0,
            });
            setChaptersData({
              standard11: data.standard11 || [],
              standard12: data.standard12 || [],
              unclassified: data.unclassified || [],
            });
          } else {
            console.log('Unknown data format, using empty arrays');
            setChaptersData({
              standard11: [],
              standard12: [],
              unclassified: [],
            });
          }
          setSelectedStandard(null); // Reset standard selection when subject changes
        }
      } catch (requestError) {
        if (isMounted) {
          const message =
            requestError instanceof Error ? requestError.message : 'Failed to load chapters';
          setError(message);
          setChaptersData(null);
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

  // Get chapters for selected standard
  const chapters = useMemo(() => {
    if (!chaptersData || !selectedStandard) return [];
    
    if (selectedStandard === '11') {
      return chaptersData.standard11 || [];
    } else if (selectedStandard === '12') {
      return chaptersData.standard12 || [];
    }
    
    return [];
  }, [chaptersData, selectedStandard]);

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

    // Standard selection view
    if (subject && !selectedStandard && !loading && !error) {
      const std11Count = chaptersData?.standard11?.length || 0;
      const std12Count = chaptersData?.standard12?.length || 0;
      const unclassifiedCount = chaptersData?.unclassified?.length || 0;

      // Always show both standard cards, even if empty
      // This allows users to navigate and see what's available
      return (
        <View style={styles.standardSelectionContainer}>
          <Text style={styles.standardSelectionTitle}>Select Standard</Text>
          <Text style={styles.standardSelectionSubtitle}>Choose a standard to view chapters</Text>
          <View style={styles.standardGrid}>
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <TouchableOpacity
                onPress={() => setSelectedStandard('11')}
                activeOpacity={0.85}
                disabled={std11Count === 0}
              >
                <LinearGradient
                  colors={std11Count > 0 ? ['#6366F1', '#4F46E5'] : ['#9CA3AF', '#6B7280'] as [string, string, ...string[]]}
                  style={[styles.standardCard, std11Count === 0 && styles.standardCardDisabled]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.standardCardContent}>
                    <View style={styles.standardCardLeft}>
                      <Text style={styles.standardNumber}>11</Text>
                      <Text style={styles.standardLabel}>Standard XI</Text>
                    </View>
                    <View style={styles.standardCardRight}>
                      <View style={styles.standardChapterBadge}>
                        <Ionicons name="book" size={14} color="#FFFFFF" />
                        <Text style={styles.standardChapterCount}>
                          {std11Count}
                        </Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <TouchableOpacity
                onPress={() => setSelectedStandard('12')}
                activeOpacity={0.85}
                disabled={std12Count === 0}
              >
                <LinearGradient
                  colors={std12Count > 0 ? ['#10B981', '#059669'] : ['#9CA3AF', '#6B7280'] as [string, string, ...string[]]}
                  style={[styles.standardCard, std12Count === 0 && styles.standardCardDisabled]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.standardCardContent}>
                    <View style={styles.standardCardLeft}>
                      <Text style={styles.standardNumber}>12</Text>
                      <Text style={styles.standardLabel}>Standard XII</Text>
                    </View>
                    <View style={styles.standardCardRight}>
                      <View style={styles.standardChapterBadge}>
                        <Ionicons name="book" size={14} color="#FFFFFF" />
                        <Text style={styles.standardChapterCount}>
                          {std12Count}
                        </Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
          {unclassifiedCount > 0 && (
            <View style={styles.unclassifiedWarning}>
              <Ionicons name="information-circle" size={16} color={colors.authTextMuted} />
              <Text style={styles.unclassifiedText}>
                {unclassifiedCount} chapter{unclassifiedCount !== 1 ? 's' : ''} could not be categorized. Please check chapter names in the database.
              </Text>
            </View>
          )}
        </View>
      );
    }

    // Chapters view for selected subject and standard
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

    if (!chaptersData || chapters.length === 0) {
      return (
        <View style={styles.stateCard}>
          <Ionicons name="document-outline" size={48} color={colors.authTextMuted} />
          <Text style={styles.stateText}>
            {!chaptersData ? 'No chapters available.' : 'No chapters available for this standard.'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.chapterList}>
        {chapters.map((item, index) => {
          const progressPercentage = item.totalQuestions > 0 
            ? Math.round((item.userAttempts / item.totalQuestions) * 100) 
            : 0;
          
          // Check if weightage should be displayed
          const hasWeightage = item.examQuestions !== undefined && item.examQuestions !== null && item.examQuestions > 0;
          
          // Temporary debug - remove after verifying
          if (index === 0 && __DEV__) {
            console.log('Chapter weightage check:', {
              chapter: item.chapter,
              examQuestions: item.examQuestions,
              examMarks: item.examMarks,
              hasWeightage,
            });
          }
          
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
                  // Navigate to chapter detail using parent navigator.
                  // We pass the standard and chapterNumber so non-premium limits can be applied based on chapterNumber (1,2,3 free; 4+ locked).
                  (navigation as any).getParent()?.navigate('ChapterDetail', {
                    subject,
                    chapter: item.chapter,
                    standard: selectedStandard as '11' | '12',
                    chapterNumber: item.chapterNumber,
                  });
                }}
                activeOpacity={0.85}
              >
                <View style={styles.chapterItem}>
                  <View style={styles.chapterContent}>
                    <View style={styles.chapterIconContainer}>
                      {item.chapterNumber !== undefined ? (
                        <LinearGradient
                          colors={colors.gradientPrimary as [string, string]}
                          style={styles.chapterNumberBadge}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.chapterNumberText}>{item.chapterNumber}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.chapterIconWrapper}>
                          <Ionicons name="book" size={24} color={colors.primary} />
                        </View>
                      )}
                    </View>
                    <View style={styles.chapterInfo}>
                      <View style={styles.chapterNameRow}>
                        <Text style={styles.chapterName}>{item.chapter}</Text>
                      </View>
                      <>
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
                          {hasWeightage && (
                            <View style={styles.statItem}>
                              <Ionicons name="trophy" size={14} color="#F59E0B" />
                              <Text style={styles.statText}>
                                {item.examQuestions} question{item.examQuestions !== 1 ? 's' : ''} expected 
                              </Text>
                            </View>
                          )}
                        </View>
                        {item.totalQuestions > 0 && (
                          <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                              <LinearGradient
                                colors={colors.gradientPrimary as [string, string]}
                                style={[
                                  styles.progressFill, 
                                  { width: `${progressPercentage}%` }
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                              />
                            </View>
                            <Text style={styles.progressText}>{progressPercentage}% complete</Text>
                          </View>
                        )}
                      </>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.authTextMuted} style={styles.chapterChevron} />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  }, [chapters, error, loading, navigation, subject, subjects, subjectsLoading, fadeAnim, slideAnim, isPremium, appNavigation, selectedStandard, chaptersData]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGradient}>
        {subject ? (
          <BackHeader
            title={selectedStandard ? `${subject} - Std. ${selectedStandard}` : `${subject} Chapters`}
            subtitle={selectedStandard ? "Choose a chapter to practice" : "Select a standard"}
            onBack={() => {
              if (selectedStandard) {
                setSelectedStandard(null);
              } else {
                navigation.setParams({ subject: undefined });
              }
            }}
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
        <PremiumLockModal
          visible={premiumModalVisible}
          onClose={() => setPremiumModalVisible(false)}
          onBuyPremium={() => appNavigation.navigate('PremiumPurchase')}
        />
      </View>
    </SafeAreaView>
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
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  chapterItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl + 2,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadow.sm,
  },
  chapterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chapterIconContainer: {
    marginRight: spacing.md,
  },
  chapterIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterInfo: {
    flex: 1,
  },
  chapterNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  chapterName: {
    ...typography.h3,
    color: '#111827',
    fontWeight: '700',
    flex: 1,
    fontSize: 17,
    lineHeight: 24,
  },
  chapterChevron: {
    marginLeft: spacing.sm,
    opacity: 0.6,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.sm,
  },
  premiumBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 10,
  },
  chapterSubtitle: {
    ...typography.caption,
    color: colors.authTextMuted,
  },
  chapterStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    color: '#6B7280',
    fontSize: 12,
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  progressText: {
    ...typography.caption,
    color: '#6366F1',
    fontSize: 11,
    fontWeight: '600',
  },
  stateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl + 2,
    padding: spacing.xxxl,
    alignItems: 'center',
    marginTop: spacing.xl,
    ...shadow.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stateText: {
    ...typography.body,
    color: '#6B7280',
    marginTop: spacing.md,
    textAlign: 'center',
    fontSize: 14,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.md,
    fontSize: 14,
  },
  standardSelectionContainer: {
    paddingTop: spacing.xl,
  },
  standardSelectionTitle: {
    ...typography.h2,
    color: '#111827',
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
    fontSize: 22,
  },
  standardSelectionSubtitle: {
    ...typography.body,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontSize: 14,
  },
  standardGrid: {
    flexDirection: 'column',
    gap: spacing.md,
  },
  standardCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: '100%',
    minHeight: 100,
    justifyContent: 'center',
    ...shadow.lg,
  },
  standardCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  standardCardLeft: {
    flex: 1,
  },
  standardCardRight: {
    alignItems: 'flex-end',
  },
  standardNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: spacing.xs / 2,
  },
  standardLabel: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    fontSize: 14,
  },
  standardChapterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.md,
  },
  standardChapterCount: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  standardCardDisabled: {
    opacity: 0.6,
  },
  unclassifiedWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  unclassifiedText: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 12,
    flex: 1,
  },
  chapterNumberBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.sm,
  },
  chapterNumberText: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 20,
  },
});

