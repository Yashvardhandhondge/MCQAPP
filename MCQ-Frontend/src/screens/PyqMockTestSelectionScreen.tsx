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
import { getPyqMockTests, getTestReports } from '../services/mcq.service';
import { colors, radius, spacing, typography, shadow } from '../theme';
import BackHeader from '../components/ui/BackHeader';
import PremiumLockModal from '../components/ui/PremiumLockModal';
import { safeGoBack } from '../utils/navigation';

const FREE_PYQ_PAPERS_COUNT = 2;

export type PyqMockTestSelectionScreenProps = NativeStackScreenProps<
  AppStackParamList,
  'PyqMockTestSelection'
>;

interface PyqMockTest {
  id: string;
  title: string;
  year: string;
  questionCount: number;
  subjects: string[];
}

export default function PyqMockTestSelectionScreen({
  navigation,
}: PyqMockTestSelectionScreenProps) {
  const { user } = useAuth();
  const isPremium = user?.subscription === 'premium';
  const [tests, setTests] = useState<PyqMockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [attemptedIds, setAttemptedIds] = useState<Set<string>>(new Set());
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

    async function fetchTests() {
      setLoading(true);
      setError(null);
      try {
        const response = await getPyqMockTests();
        if (isMounted) {
          setTests(response.data || []);
        }

        // After loading tests, fetch attempts to mark attempted PYQ papers
        try {
          const reportsResponse = await getTestReports({
            testType: 'pyq-mocktest',
          });
          if (isMounted) {
            const reports = reportsResponse.data || [];
            const attempted = new Set<string>();
            // match by title (stored in chapter) and year
            reports.forEach((rep: any) => {
              const key = `${rep.chapter || ''}__${rep.year || ''}`;
              attempted.add(key);
            });
            setAttemptedIds(attempted);
          }
        } catch {
          if (isMounted) {
            setAttemptedIds(new Set());
          }
        }
      } catch (requestError) {
        if (isMounted) {
          const message =
            requestError instanceof Error ? requestError.message : 'Failed to load PYQ mock tests';
          setError(message);
          setTests([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchTests();

    return () => {
      isMounted = false;
    };
  }, [retryTrigger]);

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.backgroundGradient}>
          <BackHeader title="PYQ Mock Tests" navigation={navigation} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading PYQ mock tests...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error && tests.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.backgroundGradient}>
          <BackHeader title="PYQ Mock Tests" navigation={navigation} />
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
        <BackHeader title="PYQ Mock Tests" onBack={() => safeGoBack(navigation)} />
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {tests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={colors.authTextMuted} />
              <Text style={styles.emptyText}>No PYQ mock tests available</Text>
              <Text style={styles.emptySubtext}>
                Check back later for newly added PYQ mock tests
              </Text>
            </View>
          ) : (
            <View style={styles.contentCard}>
              <View style={styles.headerInfo}>
                <Text style={styles.sectionTitle}>Previous Year Full Papers</Text>
                <Text style={styles.sectionSubTitle}>
                  Attempt full PYQ papers by year and shift-wise.
                </Text>
              </View>
              <View style={styles.testList}>
                {tests.map((test, index) => {
                  const isLocked = !isPremium && index >= FREE_PYQ_PAPERS_COUNT;
                  const isAttempted = attemptedIds.has(`${test.title}__${test.year}`);

                  return (
                    <Animated.View
                      key={test.id}
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
                        isLocked && styles.testCardLocked,
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          if (isLocked) {
                            setPremiumModalVisible(true);
                            return;
                          }
                          navigation.navigate('PyqMockTestInstructions', { test });
                        }}
                        activeOpacity={0.7}
                        style={styles.testCard}
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
                                <Text style={[styles.testTitle, isLocked && styles.testTitleLocked]}>
                                  {test.title}
                                </Text>
                              </View>
                              <Text style={[styles.testSubtitle, isLocked && styles.testSubtitleLocked]}>
                                {test.year ? `Year ${test.year}` : 'Previous Year Paper'} ·{' '}
                                {test.questionCount} questions
                                {isLocked ? ' • Unlock with Premium' : ''}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.cardRight}>
                            {!isLocked && isAttempted && (
                              <View style={styles.attemptBadge}>
                                <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                              </View>
                            )}
                            <Ionicons
                              name={isLocked ? 'lock-closed' : 'chevron-forward'}
                              size={20}
                              color={colors.authTextMuted}
                            />
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
          title="Premium PYQ Papers"
          message="Free users get access to 2 PYQ papers. Unlock all PYQ papers with Premium."
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
  headerInfo: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  sectionSubTitle: {
    ...typography.body,
    color: colors.authTextSecondary,
    fontSize: 13,
  },
  testList: {
    gap: spacing.md,
  },
  testCard: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.authBorder,
    ...shadow.sm,
  },
  testCardLocked: {
    opacity: 0.9,
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
  iconContainerLocked: {
    backgroundColor: colors.authInputBg,
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
  testTitle: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 17,
  },
  testTitleLocked: {
    color: colors.authTextSecondary,
  },
  testSubtitle: {
    ...typography.body,
    color: colors.authTextSecondary,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  testSubtitleLocked: {
    color: colors.authTextMuted,
  },
  cardRight: {
    marginLeft: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  attemptBadge: {
    marginRight: spacing.xs,
  },
});

