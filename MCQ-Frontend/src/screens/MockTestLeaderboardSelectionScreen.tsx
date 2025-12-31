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
import { getAvailableMockTests } from '../services/mcq.service';
import { colors, radius, spacing, typography, shadow } from '../theme';
import BackHeader from '../components/ui/BackHeader';

export type MockTestLeaderboardSelectionScreenProps = NativeStackScreenProps<AppStackParamList, 'MockTestLeaderboardSelection'>;

interface MockTest {
  mockTestNumber: number;
  name: string;
  sourceFile: string;
  questionCount: number;
  physicsCount: number;
  chemistryCount: number;
  mathsCount: number;
}

export default function MockTestLeaderboardSelectionScreen({ navigation }: MockTestLeaderboardSelectionScreenProps) {
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
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

  const handleSelectMockTest = (mockTestNumber: number) => {
    navigation.navigate('MockTestLeaderboard', { mockTestNumber });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.backgroundGradient}>
          <BackHeader title="MockTest Leaderboard" onBack={() => navigation.goBack()} />
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
          <BackHeader title="MockTest Leaderboard" onBack={() => navigation.goBack()} />
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
        <BackHeader title="MockTest Leaderboard" onBack={() => navigation.goBack()} />
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {mockTests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="trophy-outline" size={64} color={colors.authTextMuted} />
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
                    onPress={() => handleSelectMockTest(mockTest.mockTestNumber)}
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
                            <Ionicons name="trophy" size={24} color="#FFFFFF" />
                          </View>
                          <View style={styles.mockTestInfo}>
                            <Text style={styles.mockTestTitle}>{mockTest.name}</Text>
                            <View style={styles.mockTestStats}>
                              <View style={styles.statItem}>
                                <Ionicons name="document-text" size={12} color="rgba(255, 255, 255, 0.9)" />
                                <Text style={styles.statText}>
                                  {mockTest.questionCount} Questions
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                        <View style={styles.mockTestRight}>
                          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
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
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.md,
    minHeight: 90,
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
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  mockTestInfo: {
    flex: 1,
  },
  mockTestTitle: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    marginBottom: spacing.xs,
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
    justifyContent: 'center',
  },
});

