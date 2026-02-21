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
import { useAuth } from '../context/AuthContext';
import { getYearsWithAnalytics } from '../services/mcq.service';
import { colors, radius, spacing, typography, shadow } from '../theme';
import BackHeader from '../components/ui/BackHeader';
import PremiumLockModal from '../components/ui/PremiumLockModal';
import { safeGoBack } from '../utils/navigation';
import type { YearAnalytics } from '../types/mcq';

export type PracticeByYearScreenProps = NativeStackScreenProps<AppStackParamList, 'PracticeByYear'>;

export default function PracticeByYearScreen({ route, navigation }: PracticeByYearScreenProps) {
  const { subject, chapter, standard, chapterNumber } = route.params;
  const [years, setYears] = useState<YearAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const { user } = useAuth();
  const isPremium = user?.subscription === 'premium';

  const customYearLabelMap: Record<string, string> = {
    'classical thinking': 'Advanced Practice Set',
    'concept fusion': 'Integrated Concepts Set',
    'critical thinking': 'Reasoning Mastery Set',
  };

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
          const sortedYears = [...response.data].sort((a, b) => Number(b.year) - Number(a.year));
          setYears(sortedYears);
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
    // All users can navigate to any year - questions will handle blur logic
    navigation.navigate('Questions', {
      subject,
      chapter,
      mode: 'year',
      year,
    });
  };

  const getDisplayLabel = (value: unknown) => {
    if (typeof value !== 'string') {
      return 'Unknown Set';
    }

    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return 'Unknown Set';
    }

    return customYearLabelMap[normalized] ?? value;
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


    return (
      <View style={styles.yearList}>
        {years.map((item, index) => {
          const progressPercentage = item.totalQuestions > 0
            ? Math.round((item.userAttempts / item.totalQuestions) * 100)
            : 0;
          
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
                activeOpacity={0.85}
              >
                <View style={styles.yearItem}>
                  <View style={styles.yearContent}>
                    <View style={styles.yearIconContainer}>
                      <LinearGradient
                        colors={colors.gradientPrimary as [string, string]}
                        style={styles.yearIconGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Ionicons
                          name="calendar"
                          size={24}
                          color="#FFFFFF"
                        />
                      </LinearGradient>
                    </View>
                    <View style={styles.yearInfo}>
                      <View style={styles.yearHeaderRow}>
                        <Text style={styles.yearName}>
                          {getDisplayLabel(item.year)}
                        </Text>
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
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.authTextMuted} style={styles.yearChevron} />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.backgroundGradient}>
        <BackHeader
          title={chapter}
          subtitle={`Practice by Year - ${subject}`}
          navigation={navigation}
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
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: 100,
  },
  yearList: {
    gap: spacing.md,
  },
  yearItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl + 2,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadow.sm,
  },
  yearContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  yearIconContainer: {
    marginRight: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  yearIconGradient: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.sm,
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
    color: '#111827',
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 18,
  },
  yearChevron: {
    marginLeft: spacing.sm,
    opacity: 0.6,
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

//added code