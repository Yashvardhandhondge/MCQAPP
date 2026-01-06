import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useEffect } from 'react';
import {  ScrollView, StyleSheet, Text, TouchableOpacity, View, Animated, StatusBar, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { openBrowserAsync } from 'expo-web-browser';
import { useAuth } from '../context/AuthContext';
import type { AppStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography, shadow } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const SOCIAL_MEDIA_LINKS: Array<{ name: string; url: string; icon: string; gradient: string[] }> = [
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/@Yash_Aradhye',
    icon: 'logo-youtube',
    gradient: ['#FF0000', '#CC0000'],
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/Yash_aradhye/',
    icon: 'logo-instagram',
    gradient: ['#E4405F', '#C13584'],
  },
  {
    name: 'Facebook',
    url: 'https://facebook.com/yourpage',
    icon: 'logo-facebook',
    gradient: ['#1877F2', '#0C63D4'],
  },
  {
    name: 'Twitter',
    url: 'https://twitter.com/yourhandle',
    icon: 'logo-twitter',
    gradient: ['#1DA1F2', '#0D8BD9'],
  },
];

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

  const handleSocialMediaPress = useCallback(async (url: string) => {
    try {
      await openBrowserAsync(url);
    } catch (error) {
      console.error('Error opening social media link:', error);
    }
  }, []);

  const groupInfo = user?.group ? GROUP_INFO[user.group] : null;

  const selectedStreamLabel = groupInfo?.label ?? 'Select your stream';
  const selectedStreamDescription = groupInfo?.description ?? 'PCM / PCB / PCMB';
  const hasAvatar = !!user?.avatarUrl;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.backgroundGradient}>
        {/* Sticky Header */}
        <View style={styles.stickyHeader}>
          <LinearGradient
            colors={['#FFFFFF', '#F9FAFB']}
            style={styles.stickyHeaderGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.headerBackButton}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={22} color={colors.primary} />
              </TouchableOpacity>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Profile</Text>
                <Text style={styles.headerSubtitle}>Manage your account</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

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
            {/* Main profile card */}
            <View style={styles.profilePanel}>
              {/* Avatar Section */}
              <View style={styles.avatarSection}>
                {hasAvatar ? (
                  <View style={styles.avatarOuter}>
                    <Image
                      source={{ uri: user?.avatarUrl ?? undefined }}
                      style={styles.avatarImage}
                      contentFit="cover"
                    />
                  </View>
                ) : (
                  <View style={styles.avatarOuter}>
                    <LinearGradient
                      colors={colors.gradientPrimary as [string, string, ...string[]]}
                      style={styles.avatarPlaceholder}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="person" size={48} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                )}
                <View style={styles.nameSection}>
                  <Text style={styles.panelNameText}>{user?.fullName || 'User'}</Text>
                  <Text style={styles.panelEmailText}>{user?.email || 'user@example.com'}</Text>
                </View>
              </View>

              {/* Info Section */}
              <View style={styles.infoSection}>
                {/* Stream row (PCM / PCB / PCMB) */}
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <LinearGradient
                      colors={colors.gradientPrimary as [string, string, ...string[]]}
                      style={styles.infoIconContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="school" size={20} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={styles.infoCardContent}>
                      <Text style={styles.infoCardLabel}>Stream</Text>
                      <Text style={styles.infoCardValue}>{selectedStreamLabel}</Text>
                      <Text style={styles.infoCardSubtext}>{selectedStreamDescription}</Text>
                    </View>
                  </View>
                </View>

                {/* Subscription row */}
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <LinearGradient
                      colors={user?.subscription === 'premium' ? colors.gradientGold as [string, string, ...string[]] : ['#94A3B8', '#64748B'] as [string, string, ...string[]]}
                      style={styles.infoIconContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name={user?.subscription === 'premium' ? 'diamond' : 'diamond-outline'} size={20} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={styles.infoCardContent}>
                      <Text style={styles.infoCardLabel}>Subscription</Text>
                      <Text style={styles.infoCardValue}>
                        {user?.subscription === 'premium' ? 'Premium Member' : 'Free Plan'}
                      </Text>
                      {user?.subscription !== 'premium' && (
                        <TouchableOpacity
                          onPress={() => navigation.navigate('PremiumPurchase')}
                          activeOpacity={0.8}
                          style={styles.premiumButton}
                        >
                          <Text style={styles.premiumButtonText}>Upgrade Now</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>

                {/* Saved questions row */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('SavedQuestions')}
                  activeOpacity={0.8}
                  style={styles.infoCard}
                >
                  <View style={styles.infoCardHeader}>
                    <LinearGradient
                      colors={colors.gradientAccent as [string, string, ...string[]]}
                      style={styles.infoIconContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="bookmark" size={20} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={styles.infoCardContent}>
                      <Text style={styles.infoCardLabel}>Saved Questions</Text>
                      <Text style={styles.infoCardSubtext}>View your bookmarked questions</Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.authTextMuted}
                    />
                  </View>
                </TouchableOpacity>

                {/* Social media row */}
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <LinearGradient
                      colors={colors.gradientPrimary as [string, string, ...string[]]}
                      style={styles.infoIconContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="share-social" size={20} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={styles.infoCardContent}>
                      <Text style={styles.infoCardLabel}>Follow us on</Text>
                      <View style={styles.socialIconsContainer}>
                        {SOCIAL_MEDIA_LINKS.map((social) => (
                          <TouchableOpacity
                            key={social.name}
                            onPress={() => handleSocialMediaPress(social.url)}
                            activeOpacity={0.8}
                            style={styles.socialIconButton}
                          >
                            <LinearGradient
                              colors={social.gradient as [string, string, ...string[]]}
                              style={styles.socialIconContainer}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                            >
                              <Ionicons name={social.icon as any} size={20} color="#FFFFFF" />
                            </LinearGradient>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Actions Section */}
              <View style={styles.actionsSection}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3E8FF',
  },
  backgroundGradient: {
    flex: 1,
    backgroundColor: '#F3E8FF',
  },
  stickyHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...shadow.sm,
  },
  stickyHeaderGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    color: '#111827',
    fontWeight: '700',
    fontSize: 24,
    marginBottom: spacing.xs / 2,
  },
  headerSubtitle: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 13,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  profilePanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadow.sm,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    ...shadow.lg,
    marginBottom: spacing.md,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameSection: {
    alignItems: 'center',
  },
  panelNameText: {
    ...typography.h2,
    color: '#111827',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  panelEmailText: {
    ...typography.body,
    color: '#6B7280',
    fontSize: 14,
  },
  infoSection: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardLabel: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 12,
    marginBottom: spacing.xs / 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCardValue: {
    ...typography.subtitle,
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: spacing.xs / 2,
  },
  infoCardSubtext: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 13,
  },
  premiumButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
  },
  premiumButtonText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  actionsSection: {
    marginTop: spacing.md,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingVertical: spacing.md,
    backgroundColor: '#FEF2F2',
  },
  logoutButtonText: {
    ...typography.subtitle,
    color: colors.danger,
    fontWeight: '700',
    fontSize: 15,
  },
  socialIconsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  socialIconButton: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  socialIconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
});
