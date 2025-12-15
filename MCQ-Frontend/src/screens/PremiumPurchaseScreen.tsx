import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import type { AppStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography, shadow } from '../theme';
import ModernCard from '../components/ui/ModernCard';

const PRICING_PLANS = [
  {
    id: 'PCM',
    name: 'PCM',
    description: 'Physics, Chemistry, Mathematics',
    price: 399,
    gradient: ['#6366F1', '#4F46E5'],
    icon: 'calculator',
  },
  {
    id: 'PCB',
    name: 'PCB',
    description: 'Physics, Chemistry, Biology',
    price: 399,
    gradient: ['#8B5CF6', '#7C3AED'],
    icon: 'flask',
  },
  {
    id: 'PCMB',
    name: 'PCMB',
    description: 'Physics, Chemistry, Mathematics, Biology',
    price: 499,
    gradient: ['#10B981', '#059669'],
    icon: 'school',
  },
];

const FEATURES = [
  { icon: 'library', text: '4000+ questions for each subject' },
  { icon: 'calendar', text: 'Include all PYQ from 2015' },
  { icon: 'analytics', text: 'Solid analytics' },
  { icon: 'trophy', text: 'Compete with your peers' },
  { icon: 'sparkles', text: 'AI analyzed solutions for all questions' },
];

export default function PremiumPurchaseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user, upgradeSubscription, loading } = useAuth();
  const [purchasing, setPurchasing] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
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
  }, []);

  const handlePurchase = useCallback(async (planId: string) => {
    if (purchasing || loading) return;

    const plan = PRICING_PLANS.find(p => p.id === planId);
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
  }, [purchasing, loading, upgradeSubscription, navigation, user?.group]);

  const selectedPlan = user?.group ? PRICING_PLANS.find(p => p.id === user.group) : PRICING_PLANS[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
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
            <View style={styles.headerContainer}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={24} color={colors.authText} />
              </TouchableOpacity>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>Upgrade to Premium</Text>
              </View>
            </View>

            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.heroBadge}>
                <Ionicons name="rocket" size={16} color={colors.primary} />
                <Text style={styles.heroBadgeText}>Ace Your 2026 Exams</Text>
              </View>
              <Text style={styles.heroTitle}>
                Your Complete{'\n'}MCQ Preparation Solution
              </Text>
              <Text style={styles.heroSubtitle}>
                Join 1,000+ students preparing for Maharashtra competitive exams
              </Text>
            </View>

            {/* Value Proposition Card */}
            <ModernCard variant="elevated" padding="lg" style={styles.valueCard}>
              <View style={styles.valueCardContent}>
                <View style={styles.valueIconWrapper}>
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    style={styles.valueIconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="wallet" size={28} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                <View style={styles.valueTextWrapper}>
                  <Text style={styles.valueTitle}>Save 80-90% on Study Materials</Text>
                  <Text style={styles.valueDescription}>
                    Get comprehensive question banks, PYQs, and solutions at a fraction of book costs
                  </Text>
                </View>
              </View>
            </ModernCard>

            {/* Features Grid */}
            <View style={styles.featuresGrid}>
              {FEATURES.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons name={feature.icon as any} size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.featureCardText}>{feature.text}</Text>
                </View>
              ))}
            </View>

            {/* Pricing Plans */}
            <View style={styles.pricingSection}>
              <View style={styles.pricingTitleContainer}>
                <Text style={styles.pricingTitle}>Select Your Stream</Text>
                <Text style={styles.pricingSubtitle}>Choose the plan that matches your exam preparation</Text>
              </View>
              {PRICING_PLANS.map((plan, index) => {
                const isSelected = user?.group === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planCard,
                      isSelected && styles.planCardSelected,
                    ]}
                    activeOpacity={0.9}
                    onPress={() => handlePurchase(plan.id)}
                    disabled={purchasing || loading}
                  >
                    <View style={styles.planCardInner}>
                      <View style={styles.planHeader}>
                        <View style={styles.planHeaderLeft}>
                          <View style={[styles.planIconWrapper, { backgroundColor: `${plan.gradient[0]}15` }]}>
                            <Ionicons name={plan.icon as any} size={24} color={plan.gradient[0]} />
                          </View>
                          <View style={styles.planTitleSection}>
                            <Text style={styles.planName}>{plan.name}</Text>
                            <Text style={styles.planDescription}>{plan.description}</Text>
                          </View>
                        </View>
                        {isSelected && (
                          <View style={styles.currentBadge}>
                            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                          </View>
                        )}
                        {plan.id === 'PCMB' && !isSelected && (
                          <View style={styles.popularBadge}>
                            <Text style={styles.popularBadgeText}>Popular</Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.planFooter}>
                        <View style={styles.priceSection}>
                          <Text style={styles.priceSymbol}>₹</Text>
                          <Text style={styles.priceAmount}>{plan.price}</Text>
                          <Text style={styles.pricePeriod}>one-time</Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.purchaseButton,
                            isSelected && styles.purchaseButtonActive,
                            (purchasing || loading) && styles.purchaseButtonDisabled,
                          ]}
                          onPress={(e) => {
                            e.stopPropagation();
                            handlePurchase(plan.id);
                          }}
                          disabled={purchasing || loading}
                          activeOpacity={0.8}
                        >
                          {purchasing && isSelected ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text style={[
                              styles.purchaseButtonText,
                              isSelected && styles.purchaseButtonTextActive
                            ]}>
                              {isSelected ? 'Current Plan' : 'Upgrade Now'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
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
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  featureCard: {
    width: '48%',
    backgroundColor: colors.authSurface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.authBorder,
    alignItems: 'center',
    ...shadow.sm,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  featureCardText: {
    ...typography.body,
    color: colors.authText,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },
  pricingSection: {
    gap: spacing.lg,
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
  planCard: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.authBorder,
    overflow: 'hidden',
    ...shadow.md,
  },
  planCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadow.lg,
  },
  planCardInner: {
    padding: spacing.xl,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  planHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  planIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitleSection: {
    flex: 1,
  },
  planName: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 20,
    marginBottom: spacing.xs / 2,
  },
  planDescription: {
    ...typography.body,
    color: colors.authTextMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  currentBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
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
  planFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.authBorder,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs / 2,
  },
  priceSymbol: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 18,
  },
  priceAmount: {
    ...typography.h1,
    color: colors.authText,
    fontWeight: '800',
    fontSize: 32,
    letterSpacing: -0.5,
  },
  pricePeriod: {
    ...typography.caption,
    color: colors.authTextMuted,
    fontSize: 11,
    marginLeft: spacing.xs,
  },
  purchaseButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  purchaseButtonActive: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  purchaseButtonTextActive: {
    color: colors.primary,
  },
  heroSection: {
    marginBottom: spacing.xxl,
    alignItems: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  heroBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.authText,
    fontWeight: '800',
    fontSize: 32,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.authTextMuted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  valueCard: {
    marginBottom: spacing.xxl,
    backgroundColor: colors.authSurface,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    borderRadius: radius.xl + 2,
    ...shadow.md,
  },
  valueCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  valueIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: radius.lg + 2,
    overflow: 'hidden',
    ...shadow.sm,
  },
  valueIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueTextWrapper: {
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
});

