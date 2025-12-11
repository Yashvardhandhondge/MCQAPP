import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, type GestureResponderEvent, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface GradientButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'accent' | 'gold' | 'purple';
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const gradientMap: Record<string, string[]> = {
  primary: colors.gradientPrimary,
  accent: colors.gradientAccent,
  gold: colors.gradientGold,
  purple: colors.gradientPurple,
};

export default function GradientButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  size = 'md',
  icon,
}: GradientButtonProps) {
  const sizeStyles = {
    sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, fontSize: typography.small.fontSize },
    md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, fontSize: typography.subtitle.fontSize },
    lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, fontSize: typography.title.fontSize },
  };

  // Ensure we have valid gradient colors
  const gradientColors = gradientMap[variant] || colors.gradientPrimary;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.container, disabled && styles.disabled]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, sizeStyles[size]]}
      >
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <View style={styles.content}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={[styles.text, { fontSize: sizeStyles[size].fontSize }]}>{title}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: radius.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
  text: {
    color: colors.text,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
