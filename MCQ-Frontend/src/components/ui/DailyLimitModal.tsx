import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography, shadow } from '../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type LimitType = 'questions' | 'tests';

interface DailyLimitModalProps {
  visible: boolean;
  type: LimitType;
  onClose: () => void;
  onUpgrade: () => void;
  /** For questions: how many views remain (0 when limit hit) */
  remaining?: number;
}

const CONFIG = {
  questions: {
    icon: 'time-outline' as const,
    iconColor: '#F59E0B',
    gradientColors: ['#FEF3C7', '#FDE68A'] as [string, string],
    title: 'Daily Limit Reached',
    subtitle: "You've used all 25 free questions for today.",
    resetNote: 'Resets at midnight',
    benefits: [
      { icon: 'infinity-outline', text: 'Unlimited questions every day' },
      { icon: 'book-outline', text: 'All chapters unlocked' },
      { icon: 'sparkles-outline', text: 'AI-analyzed solutions' },
    ],
  },
  tests: {
    icon: 'document-text-outline' as const,
    iconColor: '#6366F1',
    gradientColors: ['#EEF2FF', '#E0E7FF'] as [string, string],
    title: '3 Free Tests Used',
    subtitle: "You've completed all 3 free mock tests.",
    resetNote: 'One-time upgrade — no renewal',
    benefits: [
      { icon: 'infinite-outline', text: 'Unlimited mock tests' },
      { icon: 'trophy-outline', text: 'Compete on leaderboards' },
      { icon: 'analytics-outline', text: 'Detailed performance analytics' },
    ],
  },
};

export default function DailyLimitModal({
  visible,
  type,
  onClose,
  onUpgrade,
  remaining,
}: DailyLimitModalProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const cfg = CONFIG[type];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropAnim }]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + spacing.lg, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Drag indicator */}
        <View style={styles.dragHandle} />

        {/* Icon Badge */}
        <LinearGradient
          colors={cfg.gradientColors}
          style={styles.iconBadge}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={cfg.icon} size={30} color={cfg.iconColor} />
        </LinearGradient>

        {/* Title + subtitle */}
        <Text style={styles.title}>{cfg.title}</Text>
        <Text style={styles.subtitle}>{cfg.subtitle}</Text>

        {/* Reset hint */}
        <View style={styles.resetRow}>
          <Ionicons name="refresh-outline" size={14} color={colors.authTextMuted} />
          <Text style={styles.resetText}>{cfg.resetNote}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Benefits */}
        <Text style={styles.benefitsTitle}>Unlock with Premium — just ₹99</Text>
        {cfg.benefits.map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <LinearGradient
              colors={['#EEF2FF', '#E0E7FF'] as [string, string]}
              style={styles.benefitIconBg}
            >
              <Ionicons name={b.icon as any} size={16} color={colors.primary} />
            </LinearGradient>
            <Text style={styles.benefitText}>{b.text}</Text>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          </View>
        ))}

        {/* CTA */}
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={onUpgrade}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#667EEA', '#764BA2'] as [string, string]}
            style={styles.upgradeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="diamond" size={18} color="#FFFFFF" />
            <Text style={styles.upgradeText}>Get Premium — ₹99 one-time</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Dismiss */}
        <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.laterButton}>
          <Text style={styles.laterText}>Maybe later</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xl + 6,
    borderTopRightRadius: radius.xl + 6,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    alignItems: 'center',
    ...shadow.xl,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginBottom: spacing.xl,
  },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadow.md,
  },
  title: {
    ...typography.h2,
    color: '#111827',
    fontWeight: '800',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  subtitle: {
    ...typography.body,
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  resetText: {
    ...typography.caption,
    color: colors.authTextMuted,
    fontSize: 12,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: spacing.lg,
  },
  benefitsTitle: {
    ...typography.subtitle,
    color: '#111827',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    marginBottom: spacing.sm,
  },
  benefitIconBg: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  benefitText: {
    ...typography.body,
    color: '#374151',
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  upgradeButton: {
    width: '100%',
    marginTop: spacing.xl,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.lg,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md + 4,
    gap: spacing.sm,
  },
  upgradeText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  laterButton: {
    paddingVertical: spacing.lg,
  },
  laterText: {
    ...typography.body,
    color: colors.authTextMuted,
    fontSize: 14,
    fontWeight: '500',
  },
});
