import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  StatusBar,
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import type { AppStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography, shadow } from '../theme';
import { getPremiumContent } from '../services/mcq.service';

export default function PremiumPurchaseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user, upgradeSubscription, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const [purchasing, setPurchasing] = useState(false);
  const [content, setContent] = useState<{
    heroBadgeText: string;
    heroTitle: string;
    heroSubtitle: string;
    valueTitle: string;
    valueDescription: string;
    features: Array<{ icon: string; text: string }>;
    pricingPlans: Array<{
      id: string;
      name: string;
      description: string;
      price: number;
      gradient: [string, string];
      icon: string;
      isPopular: boolean;
      discountPrice?: number | null;
      discountEndDate?: string | null;
    }>;
  } | null>(null);
  const [contentLoading, setContentLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Enable LayoutAnimation on Android
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const toggleFaq = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  // FAQ data
  const faqData = [
    {
      question: 'What\'s included in the premium plan?',
      answer: 'Premium gives you unlimited access to 20,000+ questions across all subjects, complete PYQ database from 2015 onwards, AI-powered detailed solutions for every question, comprehensive analytics to track your progress, 10-20 full-length mock tests per subject, leaderboard access to compete with peers, and saved questions feature for revision. It\'s everything you need to ace your competitive exams!',
      icon: 'help-circle',
    },
    {
      question: 'How is this different from free content?',
      answer: 'Free users get limited access with basic questions. Premium unlocks the complete question bank (20K+ vs limited), all previous year questions from 2015, AI-analyzed step-by-step solutions, advanced performance analytics with detailed insights, unlimited mock tests, and priority support. Think of it as getting a complete coaching institute\'s question bank at 80-90% less cost than physical books!',
      icon: 'star',
    },
    {
      question: 'Is this a one-time payment or subscription?',
      answer: 'It\'s a one-time payment! Once you purchase premium, you get lifetime access to all premium features for your selected stream (PCM, PCB, or PCMB). No monthly fees, no recurring charges. Pay once and study forever. This makes it incredibly cost-effective compared to buying multiple books or paying for coaching classes.',
      icon: 'card',
    },
    {
      question: 'Can I change my stream later?',
      answer: 'Yes! If you need to switch streams (e.g., from PCM to PCB), you can upgrade to a different plan. The system will update your access accordingly. However, we recommend choosing the stream that matches your exam requirements from the start to get the most value. If you\'re unsure, PCMB gives you access to all subjects.',
      icon: 'swap-horizontal',
    },
  ];

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Helper function to check if discount is active
  const isDiscountActive = (plan: { discountPrice?: number | null; discountEndDate?: string | null }) => {
    if (!plan.discountPrice || !plan.discountEndDate) return false;
    const endDate = new Date(plan.discountEndDate);
    const now = new Date();
    return endDate > now;
  };

  useEffect(() => {
    // Fetch premium content
    async function loadContent() {
      try {
        setContentLoading(true);
        const response = await getPremiumContent();
        setContent(response.data);
      } catch (error) {
        console.error('Failed to load premium content:', error);
        // Fallback to default content
        setContent({
          heroBadgeText: 'Ace Your 2026 Exams',
          heroTitle: 'Your Complete\nMCQ Preparation Solution',
          heroSubtitle: 'Join 1,000+ students preparing for Maharashtra competitive exams',
          valueTitle: 'Save 80-90% on Study Materials',
          valueDescription: 'Get comprehensive question banks, PYQs, and solutions at a fraction of book costs',
          features: [
            { icon: 'library', text: '4000+ questions for each subject' },
            { icon: 'calendar', text: 'Include all PYQ from 2015' },
            { icon: 'analytics', text: 'Solid analytics' },
            { icon: 'trophy', text: 'Compete with your peers' },
            { icon: 'sparkles', text: 'AI analyzed solutions for all questions' },
          ],
          pricingPlans: [
            {
              id: 'PCM',
              name: 'PCM',
              description: 'Physics, Chemistry, Mathematics',
              price: 399,
              gradient: ['#6366F1', '#4F46E5'],
              icon: 'calculator',
              isPopular: false,
            },
            {
              id: 'PCB',
              name: 'PCB',
              description: 'Physics, Chemistry, Biology',
              price: 399,
              gradient: ['#8B5CF6', '#7C3AED'],
              icon: 'flask',
              isPopular: false,
            },
            {
              id: 'PCMB',
              name: 'PCMB',
              description: 'Physics, Chemistry, Mathematics, Biology',
              price: 499,
              gradient: ['#10B981', '#059669'],
              icon: 'school',
              isPopular: true,
            },
          ],
        });
      } finally {
        setContentLoading(false);
      }
    }
    loadContent();
  }, []);

  useEffect(() => {
    if (content) {
      // Entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [content]);

  const handlePurchase = useCallback(async (planId: string) => {
    if (purchasing || loading || !content) return;

    const plan = content.pricingPlans.find(p => p.id === planId);
    const planName = plan?.name || planId;

    Alert.alert(
      'Upgrade to Premium',
      `Are you sure you want to purchase ${planName} premium plan?${planId !== user?.group ? ` This will update your stream to ${planName}.` : ''}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Purchase Now',
          onPress: async () => {
            setPurchasing(true);
            try {
              await upgradeSubscription(planId as 'PCM' | 'PCB' | 'PCMB');
              Alert.alert(
                'Success!',
                `You have successfully upgraded to premium${planId !== user?.group ? ` and your stream has been updated to ${planName}` : ''}!`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to upgrade subscription'
              );
            } finally {
              setPurchasing(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [purchasing, loading, upgradeSubscription, navigation, user?.group, content]);

  if (contentLoading || !content) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.backgroundGradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const selectedPlan = user?.group ? content.pricingPlans.find(p => p.id === user.group) : content.pricingPlans[0];

  // Calculate tab bar height (56px tab bar + padding + safe area)
  const tabBarHeight = 56 + spacing.xs * 2 + insets.bottom;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.backgroundGradient, { paddingBottom: tabBarHeight }]}>
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
            <View style={styles.headerContainer}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={24} color={colors.authText} />
              </TouchableOpacity>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>Premium Access</Text>
                <Text style={styles.titleSubtitle}>Unlock everything in one upgrade</Text>
              </View>
            </View>

            {/* Hero Section - Premium Banner */}
            <View style={styles.heroSection}>
              <LinearGradient
                colors={['#667EEA', '#764BA2', '#F093FB', '#4FACFE'] as [string, string, string, string]}
                style={styles.heroGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Decorative elements */}
                <View style={styles.heroCircle1} />
                <View style={styles.heroCircle2} />
                <View style={styles.heroCircle3} />

                <View style={styles.heroContent}>
                  <View style={styles.heroTopRow}>
                    <View style={styles.heroBadgeOuter}>
                      <LinearGradient
                        colors={['rgba(255,255,255,0.32)', 'rgba(255,255,255,0.14)'] as [string, string]}
                        style={styles.heroBadge}
                      >
                        <Ionicons name="rocket" size={16} color="#FFFFFF" />
                        <Text style={styles.heroBadgeText}>{content.heroBadgeText}</Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.heroCrown}>
                      <Text style={styles.heroCrownEmoji}>👑</Text>
                    </View>
                  </View>

                  <Text style={styles.heroTitle}>
                    {content.heroTitle.replace(/\\n/g, '\n')}
                  </Text>
                  <Text style={styles.heroSubtitle}>
                    {content.heroSubtitle}
                  </Text>

                  {/* Quick premium highlights */}
                  <View style={styles.heroHighlightsRow}>
                    <View style={styles.heroHighlightPill}>
                      <Text style={styles.heroHighlightNumber}>20K+</Text>
                      <Text style={styles.heroHighlightLabel}>Questions</Text>
                    </View>
                    <View style={styles.heroHighlightPill}>
                      <Text style={styles.heroHighlightNumber}>10-20</Text>
                      <Text style={styles.heroHighlightLabel}>Mock Tests</Text>
                    </View>
                    <View style={styles.heroHighlightPill}>
                      <Text style={styles.heroHighlightNumber}>Smart</Text>
                      <Text style={styles.heroHighlightLabel}>Analytics</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Value Proposition - Flowing Gradient Section */}
            <View style={styles.valueSection}>
              <LinearGradient
                colors={['#EEF2FF', '#F5F3FF', '#FFFFFF'] as [string, string, string]}
                style={styles.valueGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.valueContent}>
                  <View style={styles.valueIconContainer}>
                    <LinearGradient
                      colors={colors.gradientPrimary as [string, string]}
                      style={styles.valueIconGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="wallet" size={28} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                  <View style={styles.valueTextContainer}>
                    <Text style={styles.valueTitle}>{content.valueTitle}</Text>
                    <Text style={styles.valueDescription}>
                      {content.valueDescription}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Features - Flowing List Design */}
            <View style={styles.featuresSection}>
              <View style={styles.featuresList}>
                {content.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureItemLeft}>
                      <View style={styles.featureIconWrapper}>
                        <LinearGradient
                          colors={[`${colors.primary}20`, `${colors.primary}08`] as [string, string]}
                          style={styles.featureIconGradient}
                        >
                          <Ionicons name={feature.icon as any} size={22} color={colors.primary} />
                        </LinearGradient>
                      </View>
                      <Text style={styles.featureText}>{feature.text}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={styles.featureCheck} />
                  </View>
                ))}
              </View>
            </View>

            {/* Pricing Plans - Stream Selector */}
            <View style={styles.pricingSection}>
              <View style={styles.pricingTitleContainer}>
                <Text style={styles.pricingTitle}>Select Your Stream</Text>
                <Text style={styles.pricingSubtitle}>Choose the plan that matches your exam preparation</Text>
              </View>
              {content.pricingPlans.map((plan, index) => {
                const isSelected = user?.group === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planChip,
                      isSelected && styles.planChipSelected,
                    ]}
                    activeOpacity={0.9}
                    onPress={() => handlePurchase(plan.id)}
                    disabled={purchasing || loading}
                  >
                    <View style={styles.planChipContent}>
                      <View style={styles.planChipLeft}>
                        <View
                          style={[
                            styles.planChipIcon,
                            { borderColor: `${plan.gradient[0]}33` },
                            isSelected && { backgroundColor: `${plan.gradient[0]}14` },
                          ]}
                        >
                          <Ionicons
                            name={plan.icon as any}
                            size={22}
                            color={plan.gradient[0]}
                          />
                        </View>
                        <View style={styles.planChipTextContainer}>
                          <View style={styles.planNameRow}>
                            <Text
                              style={[
                                styles.planName,
                                isSelected && styles.planNameSelected,
                              ]}
                            >
                              {plan.name}
                            </Text>
                            {isSelected && (
                              <View style={styles.selectedBadge}>
                                <Ionicons name="checkmark-circle" size={18} color={colors.primaryDark} />
                                <Text style={styles.selectedBadgeText}>Current</Text>
                              </View>
                            )}
                            {plan.isPopular && !isSelected && (
                              <View style={styles.popularBadge}>
                                <Text style={styles.popularBadgeText}>Popular</Text>
                              </View>
                            )}
                          </View>
                          {/* <Text
                            style={[
                              styles.planDescription,
                              isSelected && styles.planDescriptionSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {plan.description}
                          </Text> */}
                        </View>
                      </View>

                      <View style={styles.planChipRight}>
                        {isDiscountActive(plan) ? (
                          <View style={styles.discountPriceContainer}>
                            <View style={styles.priceRow}>
                              <Text
                                style={[
                                  styles.planChipPriceOriginal,
                                  isSelected && styles.planChipPriceOriginalSelected,
                                ]}
                              >
                                ₹{plan.price}
                              </Text>
                              <Text
                                style={[
                                  styles.planChipPrice,
                                  isSelected && styles.planChipPriceSelected,
                                ]}
                              >
                                ₹{plan.discountPrice}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.planChipOneTime,
                                isSelected && styles.planChipOneTimeSelected,
                              ]}
                            >
                              one-time
                            </Text>
                          </View>
                        ) : (
                          <>
                            <Text
                              style={[
                                styles.planChipPrice,
                                isSelected && styles.planChipPriceSelected,
                              ]}
                            >
                              ₹{plan.price}
                            </Text>
                            <Text
                              style={[
                                styles.planChipOneTime,
                                isSelected && styles.planChipOneTimeSelected,
                              ]}
                            >
                              one-time
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* FAQ Section */}
            <View style={styles.faqSection}>
              <View style={styles.faqTitleContainer}>
                <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
                <Text style={styles.faqSubtitle}>Everything you need to know about premium</Text>
              </View>
              <View style={styles.faqList}>
                {faqData.map((faq, index) => {
                  const isExpanded = expandedFaq === index;
                  return (
                    <View key={index} style={styles.faqItem}>
                      <TouchableOpacity
                        style={styles.faqQuestionContainer}
                        onPress={() => toggleFaq(index)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.faqQuestionLeft}>
                          <View style={styles.faqIconWrapper}>
                            <LinearGradient
                              colors={[`${colors.primary}20`, `${colors.primary}08`] as [string, string]}
                              style={styles.faqIconGradient}
                            >
                              <Ionicons name={faq.icon as any} size={20} color={colors.primary} />
                            </LinearGradient>
                          </View>
                          <Text style={styles.faqQuestionText}>{faq.question}</Text>
                        </View>
                        <View
                          style={[
                            styles.faqChevron,
                            isExpanded && styles.faqChevronExpanded,
                          ]}
                        >
                          <Ionicons
                            name="chevron-down"
                            size={22}
                            color={isExpanded ? colors.primary : colors.authTextMuted}
                          />
                        </View>
                      </TouchableOpacity>
                      {isExpanded && (
                        <View style={styles.faqAnswerContainer}>
                          <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
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
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
    paddingBottom: 100,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.authSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    ...shadow.sm,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    ...typography.h1,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 24,
    letterSpacing: -0.3,
  },
  titleSubtitle: {
    ...typography.caption,
    color: colors.authTextMuted,
    marginTop: spacing.xs / 2,
    fontSize: 12,
  },
  featuresSection: {
    marginBottom: spacing.xxl,
  },
  featuresList: {
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadow.sm,
  },
  featureItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  featureIconWrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  featureIconGradient: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    ...typography.body,
    color: colors.authText,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  featureCheck: {
    opacity: 0.7,
  },
  pricingSection: {
    gap: spacing.md,
  },
  pricingTitleContainer: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  pricingTitle: {
    ...typography.h2,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 26,
    marginBottom: spacing.xs,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  pricingSubtitle: {
    ...typography.body,
    color: colors.authTextMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  planChip: {
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  planChipSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EEF2FF',
  },
  planChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  planChipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  planChipIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4FF',
  },
  planChipTextContainer: {
    flex: 1,
  },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs / 2,
  },
  planName: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 22,
  },
  planNameSelected: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  planDescription: {
    ...typography.body,
    color: colors.authTextMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  planDescriptionSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  currentBadge: {
    display: 'none',
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  selectedBadgeText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  popularBadge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.md,
  },
  popularBadgeText: {
    ...typography.caption,
    color: colors.accentDark,
    fontWeight: '700',
    fontSize: 11,
  },
  planChipRight: {
    alignItems: 'flex-end',
  },
  planChipPrice: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 18,
  },
  planChipPriceSelected: {
    color: colors.primaryDark,
  },
  planChipOneTime: {
    ...typography.caption,
    color: colors.authTextMuted,
    fontSize: 11,
  },
  planChipOneTimeSelected: {
    color: colors.primaryDark,
  },
  discountPriceContainer: {
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  planChipPriceOriginal: {
    ...typography.h3,
    color: colors.authTextMuted,
    fontWeight: '500',
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  planChipPriceOriginalSelected: {
    color: colors.primaryDark,
    opacity: 0.6,
  },
  heroSection: {
    marginBottom: spacing.xxxl,
  },
  heroGradient: {
    borderRadius: radius.xl + 6,
    padding: spacing.xxl,
    overflow: 'hidden',
    ...shadow.lg,
  },
  heroCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    top: -60,
    right: -50,
  },
  heroCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -50,
    left: -40,
  },
  heroCircle3: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    top: '45%',
    right: 10,
  },
  heroContent: {
    position: 'relative',
    zIndex: 5,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroBadgeOuter: {
    borderRadius: radius.full,
    overflow: 'hidden',
    ...shadow.sm,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    gap: spacing.xs,
  },
  heroBadgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroCrown: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  heroCrownEmoji: {
    fontSize: 24,
  },
  heroTitle: {
    ...typography.h1,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 32,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  heroSubtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.95)',
    fontSize: 15,
    textAlign: 'left',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  heroHighlightsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroHighlightPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  heroHighlightNumber: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: spacing.xs / 2,
  },
  heroHighlightLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  valueSection: {
    marginBottom: spacing.xxl,
    borderRadius: radius.xl + 6,
    overflow: 'hidden',
    ...shadow.lg,
  },
  valueGradient: {
    padding: spacing.xxl,
  },
  valueContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  valueIconContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.md,
  },
  valueIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueTextContainer: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  valueTitle: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  valueDescription: {
    ...typography.body,
    color: colors.authTextMuted,
    fontSize: 14,
    lineHeight: 20,
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
  faqSection: {
    marginTop: spacing.xxxl,
    marginBottom: spacing.xl,
  },
  faqTitleContainer: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  faqTitle: {
    ...typography.h2,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 26,
    marginBottom: spacing.xs,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  faqSubtitle: {
    ...typography.body,
    color: colors.authTextMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  faqList: {
    gap: spacing.md,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadow.sm,
  },
  faqQuestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    gap: spacing.md,
  },
  faqQuestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  faqIconWrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  faqIconGradient: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqQuestionText: {
    ...typography.body,
    color: colors.authText,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
  },
  faqAnswerContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: spacing.xs,
  },
  faqAnswerText: {
    ...typography.body,
    color: colors.authTextMuted,
    fontSize: 14,
    lineHeight: 22,
    paddingLeft: spacing.xl + spacing.md,
  },
  faqChevron: {
    transform: [{ rotate: '0deg' }],
  },
  faqChevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
});

