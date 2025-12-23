import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Animated, StatusBar, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAuth } from '../context/AuthContext';
import type { AppStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography, shadow } from '../theme';
import ModernCard from '../components/ui/ModernCard';

const GROUP_INFO: Record<string, { label: string; description: string; gradient: string[]; icon: string }> = {
  PCM: {
    label: 'PCM',
    description: 'Physics, Chemistry, Mathematics',
    gradient: ['#6366F1', '#4F46E5'],
    icon: 'calculator',
  },
  PCB: {
    label: 'PCB',
    description: 'Physics, Chemistry, Biology',
    gradient: ['#8B5CF6', '#7C3AED'],
    icon: 'flask',
  },
  PCMB: {
    label: 'PCMB',
    description: 'Physics, Chemistry, Mathematics, Biology',
    gradient: ['#10B981', '#059669'],
    icon: 'school',
  },
};

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user, logout } = useAuth();

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

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ],
      { cancelable: true }
    );
  }, [logout]);

  const groupInfo = user?.group ? GROUP_INFO[user.group] : null;

  const selectedStreamLabel = groupInfo?.label ?? 'Select your stream';
  const selectedStreamDescription = groupInfo?.description ?? 'PCM / PCB / PCMB';
  const hasAvatar = !!user?.avatarUrl;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Simple header row */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerBackButton}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>

          {/* Main profile card */}
          <ModernCard variant="elevated" padding="lg" style={styles.profilePanel}>
              {/* Avatar overlapping the header */}
              <View style={styles.avatarWrapper}>
                {hasAvatar ? (
                  <View style={styles.avatarOuter}>
                    <Image
                      source={{ uri: user?.avatarUrl ?? undefined }}
                      style={styles.avatarImage}
                      contentFit="cover"
                    />
                  </View>
                ) : (
                  <LinearGradient
                    colors={colors.gradientPrimary as [string, string, ...string[]]}
                    style={styles.avatarPlaceholder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="person" size={42} color="#FFFFFF" />
                  </LinearGradient>
                )}
              </View>

              {/* Name under avatar */}
              <Text style={styles.panelNameText}>{user?.fullName || 'User'}</Text>

              {/* Info rows like the design */}
              <View style={styles.infoSection}>
                {/* Name row */}
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={20} color={colors.primary} />
                  <Text style={styles.infoRowText}>{user?.fullName || 'Add your name'}</Text>
                </View>

                {/* Stream row (PCM / PCB / PCMB) */}
                <View style={styles.infoRow}>
                  <Ionicons name="school-outline" size={20} color={colors.primary} />
                  <View style={styles.infoRowTextContainer}>
                    <Text style={styles.infoRowText}>{selectedStreamLabel}</Text>
                    <Text style={styles.infoRowSubText}>{selectedStreamDescription}</Text>
                  </View>
                </View>

                {/* Saved questions row */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('SavedQuestions')}
                  activeOpacity={0.8}
                  style={styles.infoRow}
                >
                  <Ionicons name="bookmark-outline" size={20} color={colors.primary} />
                  <Text style={styles.infoRowText}>Saved questions</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.authTextMuted}
                    style={styles.infoRowChevron}
                  />
                </TouchableOpacity>

                {/* Email row */}
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={20} color={colors.primary} />
                  <View style={styles.infoRowTextContainer}>
                    <Text style={styles.infoRowText}>{user?.email || 'Add your email'}</Text>
                  </View>
                </View>

                {/* Subscription row */}
                <View style={styles.infoRow}>
                  <Ionicons name="diamond-outline" size={20} color={colors.primary} />
                  <View style={styles.infoRowTextContainer}>
                    <Text style={styles.infoRowText}>Subscription</Text>
                    <Text style={styles.infoRowSubText}>
                      {user?.subscription === 'premium' ? 'Premium member' : 'Free plan'}
                    </Text>
                  </View>
                  {user?.subscription !== 'premium' && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('PremiumPurchase')}
                      activeOpacity={0.8}
                      style={styles.premiumButton}
                    >
                      <Text style={styles.premiumButtonText}>Purchase Premium</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Logout button only */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </ModernCard>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.authBackground,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.authSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.authText,
    fontWeight: '700',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  profilePanel: {
    marginTop: 0,
    paddingTop: spacing.xxxl,
    borderRadius: radius.xxl,
    backgroundColor: colors.authSurface,
    borderWidth: 1,
    borderColor: colors.authBorder,
    ...shadow.lg,
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  avatarOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: colors.authSurface,
    ...shadow.lg,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lg,
  },
  panelNameText: {
    ...typography.h2,
    color: colors.authText,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  infoSection: {
    marginTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.authBorder,
    paddingTop: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.authInputBg,
    marginBottom: spacing.md,
    minHeight: 56,
  },
  infoRowTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoRowText: {
    ...typography.body,
    color: colors.authText,
    fontWeight: '500',
  },
  infoRowSubText: {
    ...typography.small,
    color: colors.authTextMuted,
    marginTop: 2,
  },
  infoRowChevron: {
    marginLeft: 'auto',
  },
  premiumButton: {
    marginLeft: 'auto',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  premiumButtonText: {
    ...typography.small,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  logoutButton: {
    flex: 1,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.authBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: '#FFFFFF',
  },
  logoutButtonText: {
    ...typography.subtitle,
    color: colors.danger,
    fontWeight: '600',
  },
});
