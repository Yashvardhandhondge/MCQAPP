import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing, typography, shadow } from '../theme';
import { getLeaderboard, getMockTestLeaderboard, getAvailableMockTests } from '../services/mcq.service';
import type { LeaderboardEntry } from '../types/mcq';
import ModernCard from '../components/ui/ModernCard';

type Timeframe = 'all-time' | 'mocktest';

export default function LeaderboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();
  const isPremium = user?.subscription === 'premium';
  const [timeframe, setTimeframe] = useState<Timeframe>('all-time');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [availableMockTests, setAvailableMockTests] = useState<Array<{ mockTestNumber: number; name: string }>>([]);
  const [selectedMockTestNumber, setSelectedMockTestNumber] = useState<number | null>(null);
  const [loadingMockTests, setLoadingMockTests] = useState(false);
  const [showMockTestModal, setShowMockTestModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Fetch available mock tests when switching to mocktest tab
  useEffect(() => {
    if (timeframe === 'mocktest') {
      let isMounted = true;

      async function fetchMockTests() {
        setLoadingMockTests(true);
        try {
          const response = await getAvailableMockTests();
          if (isMounted) {
            const mockTests = response.data.map((test: any) => ({
              mockTestNumber: test.mockTestNumber,
              name: test.name,
            }));
            setAvailableMockTests(mockTests);
            // Auto-select first mock test if available and none selected
            if (mockTests.length > 0 && selectedMockTestNumber === null) {
              setSelectedMockTestNumber(mockTests[0].mockTestNumber);
            }
          }
        } catch (requestError) {
          if (isMounted) {
            console.error('Failed to load mock tests:', requestError);
            setAvailableMockTests([]);
          }
        } finally {
          if (isMounted) {
            setLoadingMockTests(false);
          }
        }
      }

      fetchMockTests();

      return () => {
        isMounted = false;
      };
    }
  }, [timeframe]);

  useEffect(() => {
    let isMounted = true;

    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);
      try {
        if (timeframe === 'mocktest') {
          if (selectedMockTestNumber === null) {
            setLoading(false);
            return;
          }
          const response = await getMockTestLeaderboard(selectedMockTestNumber);
          if (isMounted) {
            setLeaderboard(response.data);
          }
        } else {
          const response = await getLeaderboard(timeframe);
          if (isMounted) {
            setLeaderboard(response.data);
          }
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
  }, [timeframe, selectedMockTestNumber, retryTrigger]);

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
      <SafeAreaView edges={['top']} style={styles.safeArea}>
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
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.backgroundGradient}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => {
                setError(null);
                setRetryTrigger((prev) => prev + 1);
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
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.backgroundGradient}>
        {/* Sticky Header */}
        <View style={styles.stickyHeader}>
          <LinearGradient
            colors={['#FFFFFF', '#F9FAFB']}
            style={styles.stickyHeaderGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeftSection}>
                <View style={styles.headerIconContainer}>
                  <LinearGradient
                    colors={colors.gradientGold as [string, string, ...string[]]}
                    style={styles.headerIconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="trophy" size={24} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.title}>Leaderboard</Text>
                  <Text style={styles.subtitle}>Compete with peers and track your progress</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

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

            {/* Timeframe Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, timeframe === 'all-time' && styles.tabActive]}
                onPress={() => {
                  setTimeframe('all-time');
                  setSelectedMockTestNumber(null);
                }}
                activeOpacity={0.8}
              >
                {timeframe === 'all-time' ? (
                  <LinearGradient
                    colors={colors.gradientPrimary as [string, string, ...string[]]}
                    style={styles.tabGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.tabTextActive}>All Time</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.tabGradient}>
                    <Text style={styles.tabText}>All Time</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, timeframe === 'mocktest' && styles.tabActive]}
                onPress={() => setTimeframe('mocktest')}
                activeOpacity={0.8}
              >
                {timeframe === 'mocktest' ? (
                  <LinearGradient
                    colors={colors.gradientPrimary as [string, string, ...string[]]}
                    style={styles.tabGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.tabTextActive}>MockTest</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.tabGradient}>
                    <Text style={styles.tabText}>MockTest</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Mock Test Selector - shown when mocktest tab is active */}
            {timeframe === 'mocktest' && (
              <View style={styles.mockTestSelectorContainer}>
                {loadingMockTests ? (
                  <View style={styles.mockTestSelectorLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.mockTestSelectorLoadingText}>Loading mock tests...</Text>
                  </View>
                ) : availableMockTests.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => setShowMockTestModal(true)}
                    activeOpacity={0.8}
                    style={styles.mockTestSelectorButton}
                  >
                    <View style={styles.mockTestSelectorButtonContent}>
                      <View style={styles.mockTestSelectorButtonLeft}>
                        <Ionicons name="document-text" size={20} color={colors.primary} />
                        <View style={styles.mockTestSelectorButtonTextContainer}>
                          <Text style={styles.mockTestSelectorButtonLabel}>Mock Test</Text>
                          <Text style={styles.mockTestSelectorButtonValue} numberOfLines={1}>
                            {selectedMockTestNumber
                              ? availableMockTests.find((t) => t.mockTestNumber === selectedMockTestNumber)?.name || 'Select Mock Test'
                              : 'Select Mock Test'}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-down" size={20} color="#6B7280" />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.mockTestSelectorEmpty}>
                    <Ionicons name="document-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.mockTestSelectorEmptyText}>No mock tests available</Text>
                  </View>
                )}
              </View>
            )}

            {/* Mock Test Selection Modal */}
            <Modal
              visible={showMockTestModal}
              transparent
              animationType="fade"
              onRequestClose={() => {
                setShowMockTestModal(false);
                setSearchQuery('');
              }}
            >
              <View style={styles.modalOverlay}>
                <TouchableOpacity
                  style={styles.modalBackdrop}
                  activeOpacity={1}
                  onPress={() => {
                    setShowMockTestModal(false);
                    setSearchQuery('');
                  }}
                />
                <View style={styles.modalContainer}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Mock Test</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowMockTestModal(false);
                        setSearchQuery('');
                      }}
                      style={styles.modalCloseButton}
                    >
                      <Ionicons name="close" size={24} color="#6B7280" />
                    </TouchableOpacity>
                  </View>

                  {/* Search Input */}
                  <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search mock tests..."
                      placeholderTextColor="#9CA3AF"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSearchQuery('')}
                        style={styles.searchClearButton}
                      >
                        <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Mock Test List */}
                  <ScrollView
                    style={styles.modalScrollView}
                    contentContainerStyle={styles.modalScrollContent}
                    showsVerticalScrollIndicator={true}
                  >
                    {availableMockTests
                      .filter((mockTest) =>
                        mockTest.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((mockTest) => (
                        <TouchableOpacity
                          key={mockTest.mockTestNumber}
                          onPress={() => {
                            setSelectedMockTestNumber(mockTest.mockTestNumber);
                            setShowMockTestModal(false);
                            setSearchQuery('');
                          }}
                          activeOpacity={0.7}
                          style={[
                            styles.modalMockTestItem,
                            selectedMockTestNumber === mockTest.mockTestNumber && styles.modalMockTestItemActive,
                          ]}
                        >
                          <View style={styles.modalMockTestItemContent}>
                            <View style={styles.modalMockTestItemLeft}>
                              <Ionicons
                                name="document-text"
                                size={20}
                                color={selectedMockTestNumber === mockTest.mockTestNumber ? colors.primary : '#6B7280'}
                              />
                              <Text
                                style={[
                                  styles.modalMockTestItemText,
                                  selectedMockTestNumber === mockTest.mockTestNumber && styles.modalMockTestItemTextActive,
                                ]}
                              >
                                {mockTest.name}
                              </Text>
                            </View>
                            {selectedMockTestNumber === mockTest.mockTestNumber && (
                              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    {availableMockTests.filter((mockTest) =>
                      mockTest.name.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 && (
                      <View style={styles.modalEmptyState}>
                        <Ionicons name="search-outline" size={48} color="#9CA3AF" />
                        <Text style={styles.modalEmptyText}>No mock tests found</Text>
                        <Text style={styles.modalEmptySubtext}>Try a different search term</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              </View>
            </Modal>

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
                  const shouldHideRank = !isPremium && entry.isCurrentUser;
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
                              {shouldHideRank ? (
                                <View style={styles.rankBadge}>
                                  <View style={styles.blurOverlay}>
                                    <Ionicons name="lock-closed" size={16} color="rgba(255, 255, 255, 0.7)" />
                                  </View>
                                </View>
                              ) : rankIcon ? (
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
                              <Text style={styles.scoreLabel}>{timeframe === 'mocktest' ? 'marks' : 'pts'}</Text>
                            </View>
                          </View>
                        </LinearGradient>
                      ) : (
                        <View style={styles.entryCard}>
                          <View style={styles.entryContent}>
                            <View style={styles.rankContainer}>
                              {shouldHideRank ? (
                                <View style={styles.rankBadgeDefault}>
                                  <View style={styles.blurOverlayDefault}>
                                    <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
                                  </View>
                                </View>
                              ) : (
                                <View style={styles.rankBadgeDefault}>
                                  <Text style={styles.rankNumberDefault}>{entry.rank}</Text>
                                </View>
                              )}
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
                              <Text style={styles.scoreLabelDefault}>{timeframe === 'mocktest' ? 'marks' : 'pts'}</Text>
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
    backgroundColor: '#F3E8FF',
  },
  backgroundGradient: {
    flex: 1,
    backgroundColor: '#F3E8FF',
  },
  stickyHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...shadow.sm,
  },
  stickyHeaderGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  headerIconContainer: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },
  headerIconGradient: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
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
  title: {
    ...typography.h2,
    color: '#111827',
    fontWeight: '700',
    fontSize: 24,
    marginBottom: spacing.xs / 2,
  },
  subtitle: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 13,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.xs + 2,
    marginBottom: spacing.lg,
    gap: spacing.xs,
    ...shadow.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  tabGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    ...shadow.sm,
  },
  tabText: {
    ...typography.subtitle,
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  leaderboardList: {
    gap: spacing.sm,
  },
  entryGradient: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.md,
    marginBottom: spacing.sm,
  },
  entryCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    ...shadow.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: spacing.sm,
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
    fontSize: 16,
    flex: 1,
  },
  userNameDefault: {
    ...typography.h3,
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
  },
  scoreContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  userScore: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 22,
  },
  userScoreDefault: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: '800',
    fontSize: 22,
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
    fontSize: 15,
  },
  emptySubtext: {
    ...typography.caption,
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 13,
  },
  premiumPromptCard: {
    marginBottom: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.md,
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
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: spacing.xs,
    fontSize: 18,
  },
  premiumPromptSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 14,
    lineHeight: 20,
  },
  blurOverlay: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  blurOverlayDefault: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  mockTestSelectorContainer: {
    marginBottom: spacing.lg,
  },
  mockTestSelectorLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mockTestSelectorLoadingText: {
    ...typography.body,
    color: '#6B7280',
    fontSize: 14,
  },
  mockTestSelectorButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mockTestSelectorButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mockTestSelectorButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  mockTestSelectorButtonTextContainer: {
    flex: 1,
  },
  mockTestSelectorButtonLabel: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 12,
    marginBottom: spacing.xs / 2,
  },
  mockTestSelectorButtonValue: {
    ...typography.subtitle,
    color: '#111827',
    fontWeight: '600',
    fontSize: 15,
  },
  mockTestSelectorEmpty: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mockTestSelectorEmptyText: {
    ...typography.body,
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '80%',
    ...shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    ...typography.h3,
    color: '#111827',
    fontWeight: '700',
    fontSize: 18,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: '#111827',
    fontSize: 15,
    paddingVertical: spacing.md,
  },
  searchClearButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalScrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  modalMockTestItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalMockTestItemActive: {
    backgroundColor: '#EEF2FF',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  modalMockTestItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalMockTestItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  modalMockTestItemText: {
    ...typography.body,
    color: '#6B7280',
    fontSize: 15,
    flex: 1,
  },
  modalMockTestItemTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  modalEmptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  modalEmptyText: {
    ...typography.subtitle,
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 16,
  },
  modalEmptySubtext: {
    ...typography.caption,
    color: '#9CA3AF',
    fontSize: 14,
  },
});
