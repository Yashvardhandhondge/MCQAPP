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
import { generateChapterPractice } from '../services/mcq.service';
import { colors, radius, spacing, typography, shadow } from '../theme';
import BackHeader from '../components/ui/BackHeader';
import PremiumLockModal from '../components/ui/PremiumLockModal';
import { safeGoBack } from '../utils/navigation';

export type ChapterDetailScreenProps = NativeStackScreenProps<AppStackParamList, 'ChapterDetail'>;

export default function ChapterDetailScreen({ route, navigation }: ChapterDetailScreenProps) {
  const { subject, chapter, standard, chapterNumber } = route.params;
  const [generatingPractice, setGeneratingPractice] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const { user } = useAuth();
  const isPremium = user?.subscription === 'premium';
  // Non-premium users can access:
  // - 11th standard: chapters with chapterNumber 1 and 2 (chapterNumber <= 2)
  // - 12th standard: chapter with chapterNumber 1 (chapterNumber <= 1)
  const isWithinFreeChapters = isPremium || (
    standard === '11' && chapterNumber !== undefined && chapterNumber <= 2
  ) || (
    standard === '12' && chapterNumber !== undefined && chapterNumber <= 1
  );

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


  const handleSolveAll = async () => {
    // Enforce free limit for non-premium users:
    // Only the first 3 chapters (by order in the chapters list) are fully unlocked.
    if (!isWithinFreeChapters) {
      setPremiumModalVisible(true);
      return;
    }

    setGeneratingPractice(true);
    try {
      // Generate random practice test with unattempted questions and create test session
      const response = await generateChapterPractice(subject, chapter, 20);
      
      if (response.data && response.data.sessionId && response.data.questions) {
        // Navigate to CBT Simulator screen with test session
        navigation.navigate('CBT', {
          testId: response.data.sessionId,
          questions: response.data.questions, // Question IDs
        });
      } else {
        // Fallback to regular mode if no questions
        navigation.navigate('Questions', {
          subject,
          chapter,
          mode: 'all',
        });
      }
    } catch (error) {
      console.error('Failed to generate practice:', error);

      // If backend indicates this chapter is premium-only, show premium modal
      const message =
        (error as Error)?.message?.toLowerCase?.() ?? '';
      if (message.includes('premium')) {
        setPremiumModalVisible(true);
      } else {
        // Fallback to regular mode on non-premium-related errors
        navigation.navigate('Questions', {
          subject,
          chapter,
          mode: 'all',
        });
      }
    } finally {
      setGeneratingPractice(false);
    }
  };

  const handlePracticeByYear = () => {
    navigation.navigate('PracticeByYear', {
      subject,
      chapter,
      standard,
      chapterNumber,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGradient}>
        <BackHeader
          title={chapter}
          subtitle={
            <View style={styles.subtitleContainer}>
              <View style={styles.pyqBadge}>
                <Ionicons name="document-text" size={14} color="#FFFFFF" />
                <Text style={styles.pyqBadgeText}>{subject} PYQ</Text>
              </View>
            </View>
          }
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
            {/* Full Chapter Practice Card */}
            <TouchableOpacity
              onPress={handleSolveAll}
              disabled={generatingPractice}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={colors.gradientAccent as [string, string, ...string[]]}
                style={styles.fullPracticeCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.fullPracticeContent}>
                  <View style={styles.fullPracticeLeft}>
                    <View style={styles.fullPracticeIconContainer}>
                      <Ionicons name="play-circle" size={36} color="#FFFFFF" />
                    </View>
                    <View style={styles.fullPracticeText}>
                      <Text style={styles.fullPracticeTitle}>Full Chapter Practice</Text>
                      <Text style={styles.fullPracticeSubtitle}>
                        Solve all questions from this chapter
                      </Text>
                    </View>
                  </View>
                  <View style={styles.fullPracticeRight}>
                    {generatingPractice ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Ionicons name="arrow-forward-circle" size={32} color="#FFFFFF" />
                    )}
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Practice by Year - Flowing Design */}
            <TouchableOpacity
              onPress={handlePracticeByYear}
              activeOpacity={0.85}
            >
              <View style={styles.practiceByYearItem}>
                <View style={styles.practiceByYearContent}>
                  <View style={styles.practiceByYearLeft}>
                    <View style={styles.practiceByYearIconContainer}>
                      <LinearGradient
                        colors={colors.gradientPrimary as [string, string, ...string[]]}
                        style={styles.practiceByYearIconGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Ionicons name="calendar" size={28} color="#FFFFFF" />
                      </LinearGradient>
                    </View>
                    <View style={styles.practiceByYearText}>
                      <Text style={styles.practiceByYearTitle}>Practice by Year</Text>
                      <Text style={styles.practiceByYearSubtitle}>
                        Focus on a specific year's papers
                      </Text>
                    </View>
                  </View>
                  <View style={styles.practiceByYearRight}>
                    <Ionicons name="chevron-forward" size={22} color={colors.primary} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
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
    gap: spacing.lg,
  },
  fullPracticeCard: {
    borderRadius: radius.xl + 6,
    padding: spacing.xxl,
    marginBottom: spacing.lg,
    ...shadow.xl,
    minHeight: 130,
  },
  practiceByYearItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl + 2,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadow.md,
  },
  practiceByYearContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  practiceByYearLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  practiceByYearIconContainer: {
    marginRight: spacing.lg,
  },
  practiceByYearIconGradient: {
    width: 68,
    height: 68,
    borderRadius: radius.xl + 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.sm,
  },
  practiceByYearText: {
    flex: 1,
  },
  practiceByYearTitle: {
    ...typography.h2,
    color: '#111827',
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 20,
  },
  practiceByYearSubtitle: {
    ...typography.body,
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
  },
  practiceByYearRight: {
    marginLeft: spacing.md,
    opacity: 0.7,
  },
  fullPracticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fullPracticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fullPracticeIconContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.xl + 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  fullPracticeText: {
    flex: 1,
  },
  fullPracticeTitle: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 22,
  },
  fullPracticeSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
  },
  fullPracticeRight: {
    marginLeft: spacing.md,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs / 2,
  },
  pyqBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    ...shadow.sm,
  },
  pyqBadgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
