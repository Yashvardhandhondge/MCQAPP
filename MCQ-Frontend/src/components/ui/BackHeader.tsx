import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, typography, shadow } from '../../theme';

interface BackHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode;
  onBack: () => void;
  showGradient?: boolean;
}

export default function BackHeader({ title, subtitle, onBack, showGradient = false }: BackHeaderProps) {
  return (
    <View style={styles.container}>
      {showGradient && (
        <LinearGradient
          colors={colors.gradientAuthLight}
          style={styles.gradientBackground}
        />
      )}
      <TouchableOpacity
        onPress={onBack}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <View style={styles.backIconContainer}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
        </View>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && (
          typeof subtitle === 'string' ? (
            <Text style={styles.subtitle}>{subtitle}</Text>
          ) : (
            subtitle
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.authSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.authBorder,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  backIconContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  backText: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '600',
  },
  titleContainer: {
    marginTop: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.authTextSecondary,
  },
});








