import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, Animated } from 'react-native';
import { colors, radius, spacing, typography, shadow } from '../../theme';

interface ModernInputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: any;
}

export default function ModernInput({
  label,
  error,
  containerStyle,
  onFocus,
  onBlur,
  ...textInputProps
}: ModernInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));
  const [labelAnim] = useState(new Animated.Value(0));
  const [shadowAnim] = useState(new Animated.Value(0));

  const handleFocus = (e: any) => {
    setIsFocused(true);
    Animated.parallel([
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: false,
        tension: 150,
        friction: 7,
      }),
      Animated.timing(labelAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    Animated.parallel([
      Animated.spring(animatedValue, {
        toValue: 0,
        useNativeDriver: false,
        tension: 150,
        friction: 7,
      }),
      Animated.timing(labelAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
    onBlur?.(e);
  };

  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.authBorder, colors.authBorderFocus],
  });

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.002],
  });

  const labelScale = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.95],
  });

  const shadowOpacity = shadowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  const shadowRadius = shadowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  // Use static color for error state, animated for normal state
  const borderColorStyle = error
    ? { borderColor: colors.danger }
    : { borderColor };

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.Text 
        style={[
          styles.label,
          {
            transform: [{ scale: labelScale }],
          },
          isFocused && styles.labelFocused,
        ]}
      >
        {label}
      </Animated.Text>
      <Animated.View
        style={[
          styles.inputContainer,
          borderColorStyle,
          {
            transform: [{ scale }],
            shadowOpacity,
            shadowRadius,
            elevation: shadowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 8],
            }),
          },
          isFocused && !error && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.authTextMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...textInputProps}
        />
      </Animated.View>
      {error && (
        <Animated.View 
          style={[
            styles.errorContainer,
            {
              opacity: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1],
              }),
            },
          ]}
        >
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.subtitle,
    color: colors.authText,
    fontWeight: '600',
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  labelFocused: {
    color: colors.primary,
  },
  inputContainer: {
    borderWidth: 2,
    borderRadius: radius.lg,
    backgroundColor: colors.authSurface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 58,
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
  },
  inputContainerFocused: {
    backgroundColor: '#FFFFFF',
  },
  inputContainerError: {
    borderColor: colors.danger,
    backgroundColor: '#FFF5F5',
  },
  input: {
    ...typography.body,
    color: colors.authText,
    padding: 0,
    fontSize: 16,
    lineHeight: 22,
  },
  errorContainer: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '500',
    fontSize: 13,
  },
});

