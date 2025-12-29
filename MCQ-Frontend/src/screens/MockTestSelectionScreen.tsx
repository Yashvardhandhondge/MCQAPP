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
import { getAvailableMockTests, startMockTestSession } from '../services/mcq.service';
import { colors, radius, spacing, typography, shadow } from '../theme';
import BackHeader from '../components/ui/BackHeader';

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

export default function MockTestSelectionScreen({ navigation }: MockTestSelectionScreenProps) {
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingTest, setStartingTest] = useState<number | null>(null);

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

    async function fetchMockTests() {
      setLoading(true);
      setError(null);
      try {
        const response = await getAvailableMockTests();
        if (isMounted) {
          setMockTests(response.data);
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.backgroundGradient}>
          <BackHeader title="Mock Tests" onBack={() => navigation.goBack()} />
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.backgroundGradient}>
          <BackHeader title="Mock Tests" onBack={() => navigation.goBack()} />
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGradient}>
        <BackHeader title="Mock Tests" onBack={() => navigation.goBack()} />
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
            <View style={styles.mockTestList}>
              {mockTests.map((mockTest, index) => (
                <Animated.View
                  key={mockTest.mockTestNumber}
                  style={{
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 30],
                          outputRange: [0, 30 + index * 10],
                        }),
                      },
                    ],
                  }}
                >
                  <TouchableOpacity
                    onPress={() => handleStartMockTest(mockTest.mockTestNumber)}
                    disabled={startingTest === mockTest.mockTestNumber}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={colors.gradientPrimary as [string, string, ...string[]]}
                      style={styles.mockTestCard}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.mockTestContent}>
                        <View style={styles.mockTestLeft}>
                          <View style={styles.mockTestIconContainer}>
                            <Ionicons name="document-text" size={32} color="#FFFFFF" />
                          </View>
                          <View style={styles.mockTestInfo}>
                            <Text style={styles.mockTestTitle}>{mockTest.name}</Text>
                            <View style={styles.mockTestStats}>
                              <View style={styles.statItem}>
                                <Ionicons name="flask" size={14} color="rgba(255, 255, 255, 0.9)" />
                                <Text style={styles.statText}>
                                  {mockTest.physicsCount + mockTest.chemistryCount} P&C
                                </Text>
                              </View>
                              <View style={styles.statItem}>
                                <Ionicons name="calculator" size={14} color="rgba(255, 255, 255, 0.9)" />
                                <Text style={styles.statText}>
                                  {mockTest.mathsCount} Maths
                                </Text>
                              </View>
                              <View style={styles.statItem}>
                                <Ionicons name="document-text" size={14} color="rgba(255, 255, 255, 0.9)" />
                                <Text style={styles.statText}>
                                  {mockTest.questionCount} Q
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                        <View style={styles.mockTestRight}>
                          {startingTest === mockTest.mockTestNumber ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Ionicons name="arrow-forward-circle" size={32} color="#FFFFFF" />
                          )}
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
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
    paddingTop: spacing.xl,
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
    color: '#6B7280',
    fontWeight: '600',
  },
  emptySubtext: {
    ...typography.caption,
    color: '#6B7280',
  },
  mockTestList: {
    gap: spacing.md,
  },
  mockTestCard: {
    borderRadius: radius.xl + 4,
    padding: spacing.xl,
    marginBottom: spacing.sm,
    ...shadow.xl,
    minHeight: 120,
  },
  mockTestContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mockTestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mockTestIconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  mockTestInfo: {
    flex: 1,
  },
  mockTestTitle: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: spacing.sm,
    fontSize: 22,
  },
  mockTestStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  mockTestRight: {
    marginLeft: spacing.md,
  },
});

