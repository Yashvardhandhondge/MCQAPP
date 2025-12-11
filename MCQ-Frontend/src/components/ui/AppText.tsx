import React from 'react';
import { StyleSheet, Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { colors, typography } from '../../theme';

type TextVariant = 'title' | 'subtitle' | 'body' | 'small';
type TextTone = 'default' | 'muted' | 'danger' | 'accent';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  style?: StyleProp<TextStyle>;
}

export default function AppText({
  children,
  variant = 'body',
  tone = 'default',
  style,
  ...rest
}: AppTextProps) {
  const variantStyle = variantMap[variant] ?? typography.body;
  const toneStyle = toneMap[tone] ?? toneMap.default;

  return (
    <Text style={[styles.base, variantStyle, toneStyle, style]} {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
});

const variantMap: Record<TextVariant, TextStyle> = {
  title: typography.title,
  subtitle: typography.subtitle,
  body: typography.body,
  small: typography.small,
};

const toneMap: Record<TextTone, TextStyle> = {
  default: { color: colors.text },
  muted: { color: colors.muted },
  danger: { color: colors.danger },
  accent: { color: colors.accent },
};
