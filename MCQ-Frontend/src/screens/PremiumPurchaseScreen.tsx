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
import { createOrder, verifyPayment } from '../services/payment.service';
import RazorpayCheckoutWebView from '../components/RazorpayCheckoutWebView';

export default function PremiumPurchaseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user, applyUserUpdate, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const [purchasing, setPurchasing] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [orderDetails, setOrderDetails] = useState<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  } | null>(null);
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
      answer: 'Premium gives you unlimited access to 20,000+ questions across all subjects, complete PYQ database from 2015 onwards, AI-powered detailed solutions for every question, comprehensive analytics to track your progress, 15+ full-length mock tests, leaderboard access to compete with peers, and saved questions feature for revision. All streams (PCM, PCB, PCMB) are covered in one plan!',
      icon: 'help-circle',
    },
    {
      question: 'How is this different from free content?',
      answer: 'Free users get 25 questions per day and 3 free chapters per subject to explore. Premium unlocks the complete question bank (20K+), all previous year questions from 2015, AI-analyzed step-by-step solutions, advanced performance analytics, unlimited mock tests, and all chapter access. Think of it as getting a complete coaching institute\'s question bank at a fraction of the cost!',
      icon: 'star',
    },
    {
      question: 'Is this a one-time payment or subscription?',
      answer: 'It\'s a one-time payment of just ₹99! Once you purchase, you get lifetime access to all premium features — PCM, PCB, and PCMB all included. No monthly fees, no recurring charges. Pay once and study forever. This makes it incredibly cost-effective compared to buying physical books or paying for coaching.',
      icon: 'card',
    },
    {
      question: 'Can I switch my stream after buying?',
      answer: 'Yes! Since the ₹99 plan includes all three streams (PCM, PCB, PCMB), you can switch your active stream anytime from your Profile page. Go to Profile → Stream → Change. No extra charges. Whether you\'re in PCM, PCB, or PCMB, the same plan covers you completely.',
      icon: 'swap-horizontal',
    },
  ];

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
              price: 99,
              gradient: ['#6366F1', '#4F46E5'],
              icon: 'calculator',
              isPopular: false,
            },
            {
              id: 'PCB',
              name: 'PCB',
              description: 'Physics, Chemistry, Biology',
              price: 99,
              gradient: ['#8B5CF6', '#7C3AED'],
              icon: 'flask',
              isPopular: false,
            },
            {
              id: 'PCMB',
              name: 'PCMB',
              description: 'Physics, Chemistry, Mathematics, Biology',
              price: 99,
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

    Alert.alert(
      'Upgrade to Premium',
      'Get All Access for ₹99 — PCM, PCB & PCMB all included. One-time payment, lifetime access.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay ₹99',
          onPress: async () => {
            setPurchasing(true);
            try {
              const order = await createOrder(planId as 'PCM' | 'PCB' | 'PCMB');
              setOrderDetails({
                orderId: order.orderId,
                amount: order.amount,
                currency: order.currency || 'INR',
                keyId: order.keyId,
              });
              setCheckoutVisible(true);
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to start payment'
              );
            } finally {
              setPurchasing(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [purchasing, loading, content]);

  const handlePaymentSuccess = useCallback(
    async (payload: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => {
      setCheckoutVisible(false);
      setOrderDetails(null);
      setPurchasing(true);
      try {
        const data = await verifyPayment({
          razorpay_order_id: payload.razorpay_order_id,
          razorpay_payment_id: payload.razorpay_payment_id,
          razorpay_signature: payload.razorpay_signature,
        });
        if (data.user) {
          await applyUserUpdate(data.user as Parameters<typeof applyUserUpdate>[0]);
        }
        Alert.alert(
          'You\'re Premium!',
          'All Access unlocked — PCM, PCB & PCMB. Enjoy unlimited questions, mock tests, and more!',
          [{ text: 'Let\'s Go!', onPress: () => navigation.goBack() }]
        );
      } catch (error) {
        Alert.alert(
          'Verification failed',
          error instanceof Error ? error.message : 'Payment verification failed. If amount was deducted, contact support.'
        );
      } finally {
        setPurchasing(false);
      }
    },
    [applyUserUpdate, navigation]
  );

  const handleCheckoutDismiss = useCallback(() => {
    setCheckoutVisible(false);
    setOrderDetails(null);
  }, []);

  if (contentLoading || !content) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.backgroundGradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate tab bar height (56px tab bar + padding + safe area)
  const tabBarHeight = 56 + spacing.xs * 2 + insets.bottom;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
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

            {/* Pricing - Single All Access Bundle */}
            <View style={styles.pricingSection}>
              <View style={styles.pricingTitleContainer}>
                <Text style={styles.pricingTitle}>One Plan. Everything Included.</Text>
                <Text style={styles.pricingSubtitle}>PCM + PCB + PCMB — all streams, all subjects, one price</Text>
              </View>

              {/* All Access Bundle Card */}
              <View style={styles.allAccessCard}>
                <LinearGradient
                  colors={['#667EEA', '#764BA2', '#F093FB'] as [string, string, string]}
                  style={styles.allAccessGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Decorative circles */}
                  <View style={styles.allAccessCircle1} />
                  <View style={styles.allAccessCircle2} />

                  <View style={styles.allAccessContent}>
                    {/* Header row */}
                    <View style={styles.allAccessHeaderRow}>
                      <View style={styles.allAccessBadge}>
                        <Ionicons name="diamond" size={14} color="#FFFFFF" />
                        <Text style={styles.allAccessBadgeText}>ALL ACCESS BUNDLE</Text>
                      </View>
                      <Text style={styles.allAccessCrownEmoji}>👑</Text>
                    </View>

                    {/* Streams row */}
                    <View style={styles.allAccessStreamsRow}>
                      {['PCM', 'PCB', 'PCMB'].map((stream) => (
                        <View key={stream} style={styles.allAccessStreamPill}>
                          <Text style={styles.allAccessStreamPillText}>{stream}</Text>
                        </View>
                      ))}
                      <Text style={styles.allAccessStreamsPlus}>included</Text>
                    </View>

                    <Text style={styles.allAccessDesc}>
                      Physics · Chemistry · Mathematics · Biology{'\n'}Switch streams anytime from your Profile
                    </Text>

                    {/* Price + CTA row */}
                    <View style={styles.allAccessPriceRow}>
                      <View>
                        <Text style={styles.allAccessPrice}>₹99</Text>
                        <Text style={styles.allAccessOneTime}>one-time payment</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.allAccessBuyButton, (purchasing || loading) && { opacity: 0.6 }]}
                        onPress={() => handlePurchase((user?.group as 'PCM' | 'PCB' | 'PCMB') || 'PCMB')}
                        disabled={purchasing || loading}
                        activeOpacity={0.85}
                      >
                        {purchasing ? (
                          <ActivityIndicator size="small" color="#667EEA" />
                        ) : (
                          <>
                            <Text style={styles.allAccessBuyText}>Get Premium</Text>
                            <Ionicons name="arrow-forward" size={18} color="#667EEA" />
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* What's unlocked list */}
              <View style={styles.unlockedSection}>
                <Text style={styles.unlockedTitle}>What gets unlocked</Text>
                {[
                  { icon: 'book', text: '20,000+ chapter-wise questions' },
                  { icon: 'calendar', text: 'All PYQs from 2015 onwards' },
                  { icon: 'document-text', text: '15+ full-length mock tests' },
                  { icon: 'sparkles', text: 'AI-analyzed step-by-step solutions' },
                  { icon: 'analytics', text: 'Advanced performance analytics' },
                  { icon: 'trophy', text: 'Leaderboard & peer competition' },
                ].map((item, idx) => (
                  <View key={idx} style={styles.unlockedItem}>
                    <View style={styles.unlockedIconBg}>
                      <Ionicons name={item.icon as any} size={18} color={colors.primary} />
                    </View>
                    <Text style={styles.unlockedItemText}>{item.text}</Text>
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  </View>
                ))}
              </View>
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
      {orderDetails && (
        <RazorpayCheckoutWebView
          visible={checkoutVisible}
          orderId={orderDetails.orderId}
          amount={orderDetails.amount}
          currency={orderDetails.currency}
          keyId={orderDetails.keyId}
          userEmail={user?.email}
          userPhone={user?.phoneNumber}
          onSuccess={handlePaymentSuccess}
          onDismiss={handleCheckoutDismiss}
          onError={(msg) => {
            Alert.alert('Payment error', msg);
            handleCheckoutDismiss();
          }}
        />
      )}
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
  // All Access Bundle styles
  allAccessCard: {
    borderRadius: radius.xl + 4,
    overflow: 'hidden',
    ...shadow.xl,
    marginBottom: spacing.xl,
  },
  allAccessGradient: {
    padding: spacing.xxl,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 220,
  },
  allAccessCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -60,
    right: -50,
  },
  allAccessCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -40,
    left: -30,
  },
  allAccessContent: {
    position: 'relative',
    zIndex: 5,
  },
  allAccessHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  allAccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  allAccessBadgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  allAccessCrownEmoji: {
    fontSize: 28,
  },
  allAccessStreamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  allAccessStreamPill: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  allAccessStreamPillText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  allAccessStreamsPlus: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  allAccessDesc: {
    ...typography.body,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  allAccessPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  allAccessPrice: {
    ...typography.h1,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 36,
    letterSpacing: -1,
    lineHeight: 40,
  },
  allAccessOneTime: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  allAccessBuyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    ...shadow.md,
    minWidth: 140,
    justifyContent: 'center',
  },
  allAccessBuyText: {
    ...typography.subtitle,
    color: '#667EEA',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  unlockedSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadow.sm,
    gap: spacing.sm,
  },
  unlockedTitle: {
    ...typography.h3,
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  unlockedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  unlockedIconBg: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  unlockedItemText: {
    ...typography.body,
    color: '#374151',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
});

