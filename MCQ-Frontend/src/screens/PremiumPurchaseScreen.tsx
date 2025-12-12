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

    Alert.alert(
      'Upgrade to Premium',
      `Are you sure you want to purchase ${planId} premium plan?`,
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
              await upgradeSubscription();
              Alert.alert(
                'Success!',
                'You have successfully upgraded to premium!',
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
  }, [purchasing, loading, upgradeSubscription, navigation]);

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
            <LinearGradient
              colors={colors.gradientPrimary as [string, string, ...string[]]}
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.headerContent}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerIconContainer}>
                  <Ionicons name="diamond" size={36} color="#FFFFFF" />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.title}>Upgrade to Premium</Text>
                  <Text style={styles.subtitle}>Unlock all features</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Features Card */}
            <ModernCard variant="elevated" padding="lg" style={styles.featuresCard}>
              <View style={styles.sectionHeaderContainer}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="star" size={24} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>Premium Features</Text>
              </View>
              <View style={styles.featuresList}>
                {FEATURES.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureIconContainer}>
                      <Ionicons name={feature.icon as any} size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.featureText}>{feature.text}</Text>
                  </View>
                ))}
              </View>
            </ModernCard>

            {/* Pricing Plans */}
            <View style={styles.pricingSection}>
              <Text style={styles.pricingTitle}>Choose Your Plan</Text>
              {PRICING_PLANS.map((plan, index) => {
                const isSelected = user?.group === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={styles.planCard}
                    activeOpacity={0.8}
                    onPress={() => handlePurchase(plan.id)}
                    disabled={purchasing || loading}
                  >
                    <LinearGradient
                      colors={plan.gradient as [string, string, ...string[]]}
                      style={styles.planGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.planContent}>
                        <View style={styles.planHeader}>
                          <View style={styles.planIconContainer}>
                            <Ionicons name={plan.icon as any} size={28} color="#FFFFFF" />
                          </View>
                          <View style={styles.planInfo}>
                            <Text style={styles.planNameSelected}>
                              {plan.name}
                            </Text>
                            <Text style={styles.planDescriptionSelected}>
                              {plan.description}
                            </Text>
                          </View>
                          {isSelected && (
                            <View style={styles.selectedBadge}>
                              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                            </View>
                          )}
                        </View>
                        <View style={styles.planFooter}>
                          <View style={styles.priceContainer}>
                            <Text style={styles.priceSymbolSelected}>₹</Text>
                            <Text style={styles.priceAmountSelected}>
                              {plan.price}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.purchaseButtonSelected}
                            onPress={() => handlePurchase(plan.id)}
                            disabled={purchasing || loading}
                            activeOpacity={0.8}
                          >
                            {purchasing && isSelected ? (
                              <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                              <Text style={styles.purchaseButtonTextSelected}>
                                Purchase Now
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </LinearGradient>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
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
    fontSize: 28,
  },
  subtitle: {
    ...typography.subtitle,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
  },
  featuresCard: {
    marginBottom: spacing.xl,
    backgroundColor: colors.authSurface,
    borderWidth: 1,
    borderColor: colors.authBorder,
    borderRadius: radius.xl + 2,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    flex: 1,
  },
  featuresList: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    ...typography.body,
    color: colors.authText,
    flex: 1,
  },
  pricingSection: {
    gap: spacing.md,
  },
  pricingTitle: {
    ...typography.h2,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  planCard: {
    borderRadius: radius.xl + 2,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadow.lg,
  },
  planGradient: {
    padding: spacing.lg,
  },
  planContent: {
    gap: spacing.lg,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  planIconContainer: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    ...typography.h2,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.xs / 2,
  },
  planNameSelected: {
    color: '#FFFFFF',
  },
  planDescription: {
    ...typography.body,
    color: colors.authTextMuted,
  },
  planDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  selectedBadge: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs / 2,
  },
  priceSymbol: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
  },
  priceSymbolSelected: {
    color: '#FFFFFF',
  },
  priceAmount: {
    ...typography.h1,
    color: colors.authText,
    fontWeight: '800',
    fontSize: 32,
  },
  priceAmountSelected: {
    color: '#FFFFFF',
  },
  purchaseButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.authSurface,
    borderWidth: 2,
    borderColor: colors.primary,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonText: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '700',
  },
  purchaseButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

