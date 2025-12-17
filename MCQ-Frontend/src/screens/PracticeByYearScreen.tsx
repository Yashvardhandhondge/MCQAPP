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
import { useAuth } from '../context/AuthContext';
import { getYearsWithAnalytics } from '../services/mcq.service';
import { colors, radius, spacing, typography, shadow } from '../theme';
import ModernCard from '../components/ui/ModernCard';
import BackHeader from '../components/ui/BackHeader';
import PremiumLockModal from '../components/ui/PremiumLockModal';
import type { YearAnalytics } from '../types/mcq';

export type PracticeByYearScreenProps = NativeStackScreenProps<AppStackParamList, 'PracticeByYear'>;

export default function PracticeByYearScreen({ route, navigation }: PracticeByYearScreenProps) {
  const { subject, chapter, chapterIndex } = route.params;
  const [years, setYears] = useState<YearAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const { user } = useAuth();
  const isPremium = user?.subscription === 'premium';

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

  useEffect(() => {
    let isMounted = true;

    async function fetchYears() {
      setLoading(true);
      setError(null);
      try {
        const response = await getYearsWithAnalytics(subject, chapter);
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

  const handleYearClick = async (year: string, index: number) => {
    // Premium users have full access
    if (isPremium) {
      navigation.navigate('Questions', {
        subject,
        chapter,
        mode: 'year',
        year,
      });
      return;
    }

    const isNonPremium = !isPremium;
    const isWithinFreeChapters = !isNonPremium || chapterIndex <= 2; // first 3 chapters by order

    // For non-premium users:
    // - For the first 3 chapters (by index), all years are unlocked.
    // - For later chapters, only the first year (index 0) is unlocked.
    if (isNonPremium && !isWithinFreeChapters && index > 0) {
      setPremiumModalVisible(true);
      return;
    }

    navigation.navigate('Questions', {
      subject,
      chapter,
      mode: 'year',
      year,
    });
  };

  const renderContent = () => {
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
          <Text style={styles.stateText}>No years available for this chapter.</Text>
        </View>
      );
    }

    const isNonPremium = !isPremium;
    const isWithinFreeChapters = !isNonPremium || chapterIndex <= 2;

    return (
      <View style={styles.yearList}>
        {years.map((item, index) => {
          const progressPercentage = item.totalQuestions > 0
            ? Math.round((item.userAttempts / item.totalQuestions) * 100)
            : 0;

          // For non-premium users:
          // - For the first 3 chapters (by order): all years are unlocked.
          // - After that, for later chapters: only the first year (index 0) is unlocked.
          const isLocked = isNonPremium && !isWithinFreeChapters && index > 0;
          
          return (
            <Animated.View
              key={item.year}
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
                onPress={() => handleYearClick(item.year, index)}
                activeOpacity={0.8}
              >
                <ModernCard
                  variant="elevated"
                  padding="lg"
                  style={[
                    styles.yearCard,
                    isLocked && styles.lockedCard,
                  ]}
                >
                  <View style={styles.yearContent}>
                    <View style={styles.yearIconContainer}>
                      <Ionicons
                        name={isLocked ? 'lock-closed' : 'calendar'}
                        size={24}
                        color={isLocked ? colors.authTextMuted : colors.primary}
                      />
                    </View>
                    <View style={styles.yearInfo}>
                      <View style={styles.yearHeaderRow}>
                        <Text
                          style={[
                            styles.yearName,
                            isLocked && styles.lockedText,
                          ]}
                        >
                          {item.year}
                        </Text>
                        {isLocked && (
                          <View style={styles.premiumBadge}>
                            <Ionicons name="diamond" size={12} color={colors.primary} />
                            <Text style={styles.premiumBadgeText}>Premium</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.yearStats}>
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
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={colors.gradientAuthLight as [string, string, ...string[]]}
        style={styles.backgroundGradient}
      >
        <BackHeader
          title={chapter}
          subtitle={`Practice by Year - ${subject}`}
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
            {renderContent()}
          </Animated.View>
        </ScrollView>
        <PremiumLockModal
          visible={premiumModalVisible}
          onClose={() => setPremiumModalVisible(false)}
          onBuyPremium={() => {
            setPremiumModalVisible(false);
            navigation.navigate('PremiumPurchase');
          }}
        />
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
  yearList: {
    gap: spacing.md,
  },
  yearCard: {
    marginBottom: spacing.sm,
    borderRadius: radius.xl + 2,
  },
  lockedCard: {
    opacity: 0.7,
  },
  yearContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  yearIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  yearInfo: {
    flex: 1,
  },
  yearHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  yearName: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  lockedText: {
    color: colors.authTextMuted,
  },
  yearStats: {
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

