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
import { getAvailableMockTests, startMockTestSession, getMockTestResults } from '../services/mcq.service';
import { colors, radius, spacing, typography, shadow } from '../theme';
import BackHeader from '../components/ui/BackHeader';
import PremiumLockModal from '../components/ui/PremiumLockModal';
import { safeGoBack } from '../utils/navigation';

const FREE_MOCK_TESTS_COUNT = 2;

export type MockTestSelectionScreenProps = NativeStackScreenProps<AppStackParamList, 'MockTestSelection'>;

interface MockTest {
  mockTestNumber: number;
  name: string;
  sourceFile: string;
  questionCount: number;
  physicsCount: number;
  chemistryCount: number;
  mathsCount: number;
}

interface MockTestResult {
  marks: number;
  totalQuestions: number;
  completedAt: string;
}

export default function MockTestSelectionScreen({ navigation }: MockTestSelectionScreenProps) {
  const { user } = useAuth();
  const isPremium = user?.subscription === 'premium';
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [startingTest, setStartingTest] = useState<number | null>(null);
  const [mockTestResults, setMockTestResults] = useState<Map<number, MockTestResult>>(new Map());
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);

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
  }, [retryTrigger]);

  useEffect(() => {
    let isMounted = true;

    async function fetchMockTests() {
      setLoading(true);
      setError(null);
      try {
        const response = await getAvailableMockTests();
        console.log('[MockTestSelection] getAvailableMockTests response:', response);
        console.log('[MockTestSelection] mock tests count:', response?.data?.length ?? 0);
        if (isMounted) {
          setMockTests(response.data);
          console.log('[MockTestSelection] mock tests list:', response.data);
          
          // Fetch results for each mock test
          const resultsMap = new Map<number, MockTestResult>();
          await Promise.all(
            response.data.map(async (mockTest) => {
              try {
                const resultResponse = await getMockTestResults(mockTest.mockTestNumber);
                if (resultResponse.data) {
                  resultsMap.set(mockTest.mockTestNumber, {
                    marks: resultResponse.data.marks,
                    totalQuestions: resultResponse.data.totalQuestions,
                    completedAt: resultResponse.data.completedAt,
                  });
                }
              } catch (err) {
                // Silently fail for individual result fetches
                console.log(`No results found for MockTest ${mockTest.mockTestNumber}`);
              }
            })
          );
          if (isMounted) {
            setMockTestResults(resultsMap);
          }
        }
      } catch (requestError) {
        if (isMounted) {
          const message =
            requestError instanceof Error ? requestError.message : 'Failed to load mock tests';
          setError(message);
          setMockTests([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchMockTests();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartMockTest = async (mockTestNumber: number) => {
    setStartingTest(mockTestNumber);
    setError(null);
    try {
      const response = await startMockTestSession(mockTestNumber);
      if (response.data && response.data.sessionId && response.data.questions) {
        navigation.navigate('CBT', {
          testId: response.data.sessionId,
          questions: response.data.questions,
          testType: 'mocktest',
          mockTestNumber: response.data.mockTestNumber,
        });
      }
    } catch (err) {
      console.error('Failed to start mock test:', err);
      setError(err instanceof Error ? err.message : 'Failed to start mock test');
    } finally {
      setStartingTest(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.backgroundGradient}>
          <BackHeader title="Mock Tests" navigation={navigation} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading mock tests...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error && mockTests.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.backgroundGradient}>
          <BackHeader title="Mock Tests" navigation={navigation} />
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
              <LinearGradient
                colors={colors.gradientPrimary as [string, string, ...string[]]}
                style={styles.retryGradient}
              >
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
        <BackHeader title="Mock Tests" onBack={() => safeGoBack(navigation)} />
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {mockTests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={colors.authTextMuted} />
              <Text style={styles.emptyText}>No mock tests available</Text>
              <Text style={styles.emptySubtext}>
                Check back later for new mock tests
              </Text>
            </View>
          ) : (
            <View style={styles.contentCard}>
              <View style={styles.mockTestList}>
                {mockTests.map((mockTest, index) => {
                  const hasResult = mockTestResults.has(mockTest.mockTestNumber);
                  const result = hasResult ? mockTestResults.get(mockTest.mockTestNumber) : null;
                  const isLocked = !isPremium && index >= FREE_MOCK_TESTS_COUNT;
                  return (
                    <Animated.View
                      key={mockTest.mockTestNumber}
                      style={[
                        {
                          opacity: fadeAnim,
                          transform: [
                            {
                              translateY: slideAnim.interpolate({
                                inputRange: [0, 30],
                                outputRange: [0, 30 + index * 10],
                              }),
                            },
                          ],
                        },
                        isLocked && styles.mockTestCardLocked,
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          if (isLocked) {
                            setPremiumModalVisible(true);
                            return;
                          }
                          handleStartMockTest(mockTest.mockTestNumber);
                        }}
                        disabled={!isLocked && startingTest === mockTest.mockTestNumber}
                        activeOpacity={0.7}
                        style={styles.mockTestCard}
                      >
                        <View style={styles.cardContent}>
                          <View style={styles.cardLeft}>
                            <View style={[styles.iconContainer, isLocked && styles.iconContainerLocked]}>
                              <Ionicons
                                name={isLocked ? 'lock-closed' : 'calendar'}
                                size={24}
                                color={isLocked ? colors.authTextMuted : colors.primary}
                              />
                            </View>
                            <View style={styles.cardInfo}>
                              <View style={styles.titleRow}>
                                <Text style={[styles.mockTestTitle, isLocked && styles.mockTestTitleLocked]}>
                                  {mockTest.name}
                                </Text>
                                {isLocked && (
                                  <View style={styles.premiumBadge}>
                                    <Text style={styles.premiumBadgeText}>Premium</Text>
                                  </View>
                                )}
                                {!isLocked && hasResult && (
                                  <View style={styles.completedBadge}>
                                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                                  </View>
                                )}
                              </View>
                              {hasResult && !isLocked ? (
                                <View style={styles.resultInfo}>
                                  <View style={styles.resultRow}>
                                    <Ionicons name="star" size={14} color={colors.warning} />
                                    <Text style={styles.resultText}>
                                      {Math.round(result?.marks || 0)} marks out of 200
                                    </Text>
                                  </View>
                                  <Text style={styles.resultSubtext}>
                                    Completed
                                  </Text>
                                </View>
                              ) : (
                                <Text style={[styles.cardDescription, isLocked && styles.cardDescriptionLocked]}>
                                  {mockTest.questionCount} questions • {mockTest.physicsCount + mockTest.chemistryCount} P&C • {mockTest.mathsCount} Maths
                                  {isLocked ? ' • Unlock with Premium' : ''}
                                </Text>
                              )}
                            </View>
                          </View>
                          <View style={styles.cardRight}>
                            {startingTest === mockTest.mockTestNumber ? (
                              <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                              <Ionicons
                                name={isLocked ? 'lock-closed' : hasResult ? 'refresh' : 'chevron-forward'}
                                size={20}
                                color={isLocked ? colors.authTextMuted : colors.authTextMuted}
                              />
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
        <PremiumLockModal
          visible={premiumModalVisible}
          onClose={() => setPremiumModalVisible(false)}
          onBuyPremium={() => {
            setPremiumModalVisible(false);
            navigation.navigate('PremiumPurchase');
          }}
          title="Premium Mock Test"
          message="Free users get 2 mock tests. Unlock all mock tests with Premium. Purchase to access this and more."
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
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },
  contentCard: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.authTextSecondary,
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
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: spacing.md,
    ...shadow.md,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.authTextSecondary,
    fontWeight: '600',
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.authTextMuted,
  },
  mockTestList: {
    gap: spacing.md,
  },
  mockTestCard: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.authBorder,
    ...shadow.sm,
  },
  mockTestCardLocked: {
    opacity: 0.9,
  },
  iconContainerLocked: {
    backgroundColor: colors.authInputBg,
  },
  mockTestTitleLocked: {
    color: colors.authTextSecondary,
  },
  cardDescriptionLocked: {
    color: colors.authTextMuted,
  },
  premiumBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginLeft: spacing.xs,
  },
  premiumBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 11,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  mockTestTitle: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 17,
  },
  completedBadge: {
    marginLeft: spacing.xs,
  },
  cardDescription: {
    ...typography.body,
    color: colors.authTextSecondary,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  resultInfo: {
    marginTop: spacing.xs,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  resultText: {
    ...typography.body,
    color: colors.authText,
    fontSize: 14,
    fontWeight: '600',
  },
  resultSubtext: {
    ...typography.caption,
    color: colors.success,
    fontSize: 12,
    fontWeight: '500',
  },
  cardRight: {
    marginLeft: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

