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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing, typography, shadow } from '../theme';
import { getLeaderboard } from '../services/mcq.service';
import type { LeaderboardEntry } from '../types/mcq';
import ModernCard from '../components/ui/ModernCard';

type Timeframe = 'month' | 'all-time';

export default function LeaderboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();
  const isPremium = user?.subscription === 'premium';
  const [timeframe, setTimeframe] = useState<Timeframe>('month');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);
      try {
        const response = await getLeaderboard(timeframe);
        if (isMounted) {
          setLeaderboard(response.data);
        }
      } catch (requestError) {
        if (isMounted) {
          const message =
            requestError instanceof Error ? requestError.message : 'Failed to load leaderboard';
          setError(message);
          setLeaderboard([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchLeaderboard();

    return () => {
      isMounted = false;
    };
  }, [timeframe]);

  const getRankGradient = (rank: number, isCurrentUser: boolean): [string, string, ...string[]] | null => {
    if (isCurrentUser) {
      return colors.gradientPrimary as [string, string, ...string[]];
    }
    switch (rank) {
      case 1:
        return ['#FFD700', '#FFA500'];
      case 2:
        return ['#C0C0C0', '#A0A0A0'];
      case 3:
        return ['#CD7F32', '#B87333'];
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.backgroundGradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error && leaderboard.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.backgroundGradient}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => {
                setError(null);
                setLoading(true);
              }}
              style={styles.retryButton}
            >
              <LinearGradient colors={colors.gradientPrimary as [string, string, ...string[]]} style={styles.retryGradient}>
                <Text style={styles.retryText}>Retry</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGradient}>
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
            {/* Header */}
            <LinearGradient
              colors={colors.gradientPrimary as [string, string, ...string[]]}
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerIconContainer}>
                  <Ionicons name="trophy" size={36} color="#FFFFFF" />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.title}>Leaderboard</Text>
                  <Text style={styles.subtitle}>Compete with peers and track your progress</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Timeframe Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, timeframe === 'month' && styles.tabActive]}
                onPress={() => setTimeframe('month')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={timeframe === 'month' ? (colors.gradientPrimary as [string, string, ...string[]]) : (['transparent', 'transparent'] as [string, string, ...string[]])}
                  style={styles.tabGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.tabText, timeframe === 'month' && styles.tabTextActive]}>
                    This Month
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, timeframe === 'all-time' && styles.tabActive]}
                onPress={() => setTimeframe('all-time')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={timeframe === 'all-time' ? (colors.gradientPrimary as [string, string, ...string[]]) : (['transparent', 'transparent'] as [string, string, ...string[]])}
                  style={styles.tabGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.tabText, timeframe === 'all-time' && styles.tabTextActive]}>
                    All Time
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Leaderboard List */}
            {(() => {
              // Filter leaderboard: show only current user if not premium
              const displayLeaderboard = isPremium 
                ? leaderboard 
                : leaderboard.filter(entry => entry.isCurrentUser);

              if (displayLeaderboard.length === 0) {
                return (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="trophy-outline" size={64} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No leaderboard data available</Text>
                    <Text style={styles.emptySubtext}>Start practicing to appear on the leaderboard!</Text>
                  </View>
                );
              }

              return (
                <>
                  {/* Premium Prompt for Non-Premium Users */}
                  {!isPremium && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('PremiumPurchase')}
                      activeOpacity={0.8}
                      style={styles.premiumPromptCard}
                    >
                      <LinearGradient
                        colors={colors.gradientPrimary as [string, string, ...string[]]}
                        style={styles.premiumPromptGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.premiumPromptContent}>
                          <View style={styles.premiumPromptIconContainer}>
                            <Ionicons name="diamond" size={40} color="#FFFFFF" />
                          </View>
                          <View style={styles.premiumPromptTextContainer}>
                            <Text style={styles.premiumPromptTitle}>
                              Purchase Premium
                            </Text>
                            <Text style={styles.premiumPromptSubtitle}>
                              See your position with 1000's of other users
                            </Text>
                          </View>
                          <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  <View style={styles.leaderboardList}>
                    {displayLeaderboard.map((entry, index) => {
                  const gradient = getRankGradient(entry.rank, entry.isCurrentUser);
                  const isTopThree = entry.rank <= 3;
                  const rankIcon =
                    entry.rank === 1
                      ? 'trophy'
                      : entry.rank === 2
                        ? 'medal'
                        : entry.rank === 3
                          ? 'medal-outline'
                          : null;

                  return (
                    <Animated.View
                      key={entry.id}
                      style={{
                        opacity: fadeAnim,
                        transform: [
                          {
                            translateY: slideAnim.interpolate({
                              inputRange: [0, 30],
                              outputRange: [0, 20 + index * 5],
                            }),
                          },
                        ],
                      }}
                    >
                      {gradient ? (
                        <LinearGradient
                          colors={gradient as [string, string, ...string[]]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.entryGradient}
                        >
                          <View style={styles.entryContent}>
                            <View style={styles.rankContainer}>
                              {rankIcon ? (
                                <View style={styles.rankIconContainer}>
                                  <Ionicons name={rankIcon as any} size={28} color="#FFFFFF" />
                                </View>
                              ) : (
                                <View style={styles.rankBadge}>
                                  <Text style={styles.rankNumber}>{entry.rank}</Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.userInfo}>
                              <View style={styles.userInfoContent}>
                                {entry.isCurrentUser && (
                                  <View style={styles.currentUserBadge}>
                                    <Ionicons name="person" size={12} color="#FFFFFF" />
                                  </View>
                                )}
                                <Text style={styles.userName} numberOfLines={1}>{entry.name}</Text>
                              </View>
                            </View>
                            <View style={styles.scoreContainer}>
                              <Text style={styles.userScore}>{entry.score}</Text>
                              <Text style={styles.scoreLabel}>pts</Text>
                            </View>
                          </View>
                        </LinearGradient>
                      ) : (
                        <View style={styles.entryCard}>
                          <View style={styles.entryContent}>
                            <View style={styles.rankContainer}>
                              <View style={styles.rankBadgeDefault}>
                                <Text style={styles.rankNumberDefault}>{entry.rank}</Text>
                              </View>
                            </View>
                            <View style={styles.userInfo}>
                              <View style={styles.userInfoContent}>
                                {entry.isCurrentUser && (
                                  <View style={styles.currentUserBadgeDefault}>
                                    <Ionicons name="person" size={12} color={colors.primary} />
                                  </View>
                                )}
                                <Text style={styles.userNameDefault} numberOfLines={1}>{entry.name}</Text>
                              </View>
                            </View>
                            <View style={styles.scoreContainer}>
                              <Text style={styles.userScoreDefault}>{entry.score}</Text>
                              <Text style={styles.scoreLabelDefault}>pts</Text>
                            </View>
                          </View>
                        </View>
                      )}
                    </Animated.View>
                  );
                    })}
                  </View>
                </>
              );
            })()}
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  backgroundGradient: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: '#6B7280',
    fontSize: 14,
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
    fontSize: 14,
  },
  retryButton: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginTop: spacing.md,
    ...shadow.lg,
  },
  retryGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  retryText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerGradient: {
    borderRadius: radius.xl + 6,
    padding: spacing.xxl,
    marginBottom: spacing.xxl,
    ...shadow.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.xl + 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    ...typography.h1,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: spacing.xs,
    fontSize: 26,
  },
  subtitle: {
    ...typography.subtitle,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.xl + 2,
    padding: spacing.xs + 2,
    marginBottom: spacing.xl,
    gap: spacing.xs,
    ...shadow.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  tabGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    ...shadow.md,
  },
  tabText: {
    ...typography.subtitle,
    color: '#6B7280',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  leaderboardList: {
    gap: spacing.sm,
  },
  entryGradient: {
    borderRadius: radius.xl + 4,
    padding: spacing.lg,
    ...shadow.xl,
    marginBottom: spacing.xs,
  },
  entryCard: {
    borderRadius: radius.xl + 2,
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    ...shadow.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: spacing.xs,
  },
  entryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rankContainer: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankIconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  rankBadgeDefault: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  rankNumberDefault: {
    ...typography.subtitle,
    color: '#6366F1',
    fontWeight: '800',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  userInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  currentUserBadge: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  currentUserBadgeDefault: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  userName: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    flex: 1,
  },
  userNameDefault: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 18,
  },
  scoreContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  userScore: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 24,
  },
  userScoreDefault: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: '800',
    fontSize: 24,
  },
  scoreLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: spacing.xs / 2,
    fontWeight: '500',
    fontSize: 11,
  },
  scoreLabelDefault: {
    ...typography.caption,
    color: '#6B7280',
    marginTop: spacing.xs / 2,
    fontWeight: '500',
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  emptySubtext: {
    ...typography.caption,
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 12,
  },
  premiumPromptCard: {
    marginBottom: spacing.xl,
    borderRadius: radius.xl + 4,
    overflow: 'hidden',
    ...shadow.lg,
  },
  premiumPromptGradient: {
    padding: spacing.xl,
  },
  premiumPromptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  premiumPromptIconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.xl + 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  premiumPromptTextContainer: {
    flex: 1,
  },
  premiumPromptTitle: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: spacing.xs,
    fontSize: 22,
  },
  premiumPromptSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 15,
    lineHeight: 22,
  },
});
