import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    type GestureResponderEvent,
    type StyleProp,
    type TextStyle,
    type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface AppButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: AppButtonProps) {
  const variantStyle = buttonVariants[variant] ?? buttonVariants.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.base, variantStyle.container, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.label.color ?? colors.surface} />
      ) : (
        <Text style={[styles.label, variantStyle.label, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: {
    color: colors.surface,
    fontSize: typography.subtitle.fontSize,
    fontWeight: typography.subtitle.fontWeight,
  },
  disabled: {
    opacity: 0.5,
  },
});

const buttonVariants: Record<ButtonVariant, { container: ViewStyle; label: TextStyle }> = {
  primary: {
    container: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    label: {
      color: colors.surface,
    },
  },
  secondary: {
    container: {
      backgroundColor: colors.surface,
      borderColor: colors.primary,
    },
    label: {
      color: colors.primary,
    },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
    },
    label: {
      color: colors.text,
    },
  },
  danger: {
    container: {
      backgroundColor: colors.danger,
      borderColor: colors.danger,
    },
    label: {
      color: colors.surface,
    },
  },
};
