import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadow } from '../../theme';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  delay?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  locked?: boolean;
  onPress?: () => void;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
  delay = 0,
  trend,
  trendValue,
  locked = false,
  onPress,
}: StatCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getTrendColor = () => {
    if (trend === 'up') return colors.accent;
    if (trend === 'down') return colors.danger;
    return colors.textMuted;
  };

  const getTrendIcon = () => {
    if (trend === 'up') return 'trending-up';
    if (trend === 'down') return 'trending-down';
    return 'remove';
  };

  const CardContent = (
    <LinearGradient colors={locked ? ['#64748B', '#475569'] : gradient} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={styles.topRow}>
        <View style={styles.flex} />
        {locked && (
          <View style={styles.lockIconContainer}>
            <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
          </View>
        )}
        {icon && !locked && (
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={20} color="#FFFFFF" />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {locked ? (
          <View style={styles.lockedContent}>
            <Ionicons name="lock-closed" size={24} color="#FFFFFF" />
            <Text style={styles.lockedText}>Premium</Text>
          </View>
        ) : (
          <>
            <Text style={styles.value}>{value}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </>
        )}
      </View>
      {trend && trendValue && !locked && (
        <View style={styles.trendContainer}>
          <Ionicons name={getTrendIcon()} size={14} color={getTrendColor()} />
          <Text style={[styles.trendText, { color: getTrendColor() }]}>{trendValue}</Text>
        </View>
      )}
      {!trend && <View style={styles.trendContainer} />}
    </LinearGradient>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {locked && onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
          {CardContent}
        </TouchableOpacity>
      ) : (
        CardContent
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.lg,
  },
  gradient: {
    padding: spacing.lg,
    height: 140,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radius.md,
    padding: spacing.sm,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.h1,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 28,
  },
  subtitle: {
    ...typography.small,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  trendText: {
    ...typography.caption,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  lockIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radius.md,
    padding: spacing.sm,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  lockedText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

