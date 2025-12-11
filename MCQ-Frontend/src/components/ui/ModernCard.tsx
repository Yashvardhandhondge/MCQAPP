import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadow } from '../../theme';

interface ModernCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
}

export default function ModernCard({
  children,
  style,
  variant = 'default',
  padding = 'md',
}: ModernCardProps) {
  const paddingStyles = {
    sm: { padding: 12 },
    md: { padding: 16 },
    lg: { padding: 20 },
  };

  const variantStyles = {
    default: {
      backgroundColor: colors.authSurface,
      borderWidth: 0,
      ...shadow.md,
    },
    elevated: {
      backgroundColor: colors.authSurface,
      borderWidth: 0,
      ...shadow.lg,
    },
    outlined: {
      backgroundColor: colors.authSurface,
      borderWidth: 1,
      borderColor: colors.authBorder,
    },
  };

  return (
    <View style={[styles.card, variantStyles[variant], paddingStyles[padding], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
  },
});

