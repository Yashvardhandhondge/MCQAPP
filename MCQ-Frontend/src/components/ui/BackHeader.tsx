import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NavigationProp } from '@react-navigation/native';
import type { AppStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography, shadow } from '../../theme';
import { safeGoBack } from '../../utils/navigation';

interface BackHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode;
  onBack?: () => void;
  navigation?: NavigationProp<AppStackParamList> | { goBack: () => void; canGoBack?: () => boolean; navigate?: (screen: string) => void };
  showGradient?: boolean;
}

export default function BackHeader({ title, subtitle, onBack, navigation, showGradient = false }: BackHeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation) {
      safeGoBack(navigation);
    }
  };

  return (
    <View style={styles.container}>
      {showGradient && (
        <LinearGradient
          colors={colors.gradientAuthLight}
          style={styles.gradientBackground}
        />
      )}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <View style={styles.backIconContainer}>
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </View>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.backButtonPlaceholder} />
      </View>
      {subtitle && (
        <View style={styles.subtitleContainer}>
          {typeof subtitle === 'string' ? (
            <Text style={styles.subtitle}>{subtitle}</Text>
          ) : (
            subtitle
          )}
        </View>
      )}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
  },
  backIconContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  backButtonPlaceholder: {
    width: 32,
  },
  title: {
    ...typography.h1,
    color: colors.authText,
    fontWeight: '700',
  },
  subtitleContainer: {
    marginTop: spacing.xs,
    alignItems: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.authTextSecondary,
    textAlign: 'center',
  },
});








