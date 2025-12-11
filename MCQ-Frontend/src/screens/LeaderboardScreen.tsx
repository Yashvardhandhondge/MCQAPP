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
import { colors, radius, spacing, typography, shadow } from '../theme';
import { getLeaderboard } from '../services/mcq.service';
import type { LeaderboardEntry } from '../types/mcq';

type Timeframe = 'month' | 'all-time';

export default function LeaderboardScreen() {
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
        <LinearGradient colors={colors.gradientAuthLight as [string, string, ...string[]]} style={styles.backgroundGradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (error && leaderboard.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={colors.gradientAuthLight as [string, string, ...string[]]} style={styles.backgroundGradient}>
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
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={colors.gradientAuthLight as [string, string, ...string[]]} style={styles.backgroundGradient}>
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
            {leaderboard.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="trophy-outline" size={64} color={colors.authTextMuted} />
                <Text style={styles.emptyText}>No leaderboard data available</Text>
                <Text style={styles.emptySubtext}>Start practicing to appear on the leaderboard!</Text>
              </View>
            ) : (
              <View style={styles.leaderboardList}>
                {leaderboard.map((entry, index) => {
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
            )}
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
    backgroundColor: colors.authSurface,
    borderRadius: radius.xl + 2,
    padding: spacing.xs + 2,
    marginBottom: spacing.xl,
    gap: spacing.xs,
    ...shadow.md,
    borderWidth: 1,
    borderColor: colors.authBorder,
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
    color: colors.authTextMuted,
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
    backgroundColor: colors.authSurface,
    ...shadow.md,
    borderWidth: 1,
    borderColor: colors.authBorder,
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
    backgroundColor: colors.primarySoft,
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
    color: colors.primary,
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
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
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
    color: colors.authTextMuted,
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
    color: colors.authTextMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.authTextMuted,
    textAlign: 'center',
  },
});
