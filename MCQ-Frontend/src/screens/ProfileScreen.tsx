import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={colors.gradientAuthLight as [string, string, ...string[]]} style={styles.backgroundGradient}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Header */}
            <LinearGradient
              colors={colors.gradientPrimary as [string, string, ...string[]]}
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.headerContent}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerIconContainer}>
                  <Ionicons name="person" size={36} color="#FFFFFF" />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.title}>Profile</Text>
                  <Text style={styles.subtitle}>Your account information</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Profile Card */}
            <ModernCard variant="elevated" padding="lg" style={styles.profileCard}>
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.avatar}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.avatarText}>
                    {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </LinearGradient>
              </View>

              {/* User Name */}
              <Text style={styles.userName}>{user?.fullName || 'User'}</Text>

              {/* Email */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="mail-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.infoText}>{user?.email || 'No email'}</Text>
              </View>

              {/* Category/Group */}
              {groupInfo ? (
                <View style={styles.groupContainer}>
                  <LinearGradient
                    colors={groupInfo.gradient as [string, string, ...string[]]}
                    style={styles.groupBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <View style={styles.groupIconContainer}>
                      <Ionicons name={groupInfo.icon as any} size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.groupTextContainer}>
                      <Text style={styles.groupLabel}>{groupInfo.label}</Text>
                      <Text style={styles.groupDescription}>{groupInfo.description}</Text>
                    </View>
                  </LinearGradient>
                </View>
              ) : (
                <View style={styles.noGroupContainer}>
                  <View style={styles.noGroupIconContainer}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.authTextMuted} />
                  </View>
                  <Text style={styles.noGroupText}>No category selected</Text>
                </View>
              )}
            </ModernCard>

            {/* Logout Button */}
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#EF4444', '#DC2626'] as [string, string, ...string[]]}
                style={styles.logoutGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                <Text style={styles.logoutText}>Logout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.authBackground,
  },
  backgroundGradient: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
    paddingBottom: 100,
  },
  headerGradient: {
    borderRadius: radius.xl + 6,
    padding: spacing.xxl,
    marginBottom: spacing.xxl,
    ...shadow.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerIconContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.xl + 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    ...typography.h1,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: spacing.xs,
    fontSize: 28,
  },
  subtitle: {
    ...typography.subtitle,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
  },
  profileCard: {
    marginBottom: spacing.xl,
    backgroundColor: colors.authSurface,
    borderWidth: 1,
    borderColor: colors.authBorder,
    borderRadius: radius.xl + 2,
  },
  avatarContainer: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lg,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    ...typography.h2,
    color: colors.authText,
    marginBottom: spacing.lg,
    textAlign: 'center',
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.authInputBg,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    ...typography.body,
    color: colors.authText,
    flex: 1,
    fontWeight: '500',
  },
  groupContainer: {
    width: '100%',
    marginTop: spacing.sm,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.xl,
    gap: spacing.md,
    ...shadow.md,
  },
  groupIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTextContainer: {
    flex: 1,
  },
  groupLabel: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: spacing.xs / 2,
  },
  groupDescription: {
    ...typography.body,
    color: '#FFFFFF',
    opacity: 0.9,
    fontSize: 14,
  },
  noGroupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.authInputBg,
    borderRadius: radius.lg,
    gap: spacing.md,
    justifyContent: 'center',
  },
  noGroupIconContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noGroupText: {
    ...typography.body,
    color: colors.authTextMuted,
    fontWeight: '500',
  },
  logoutButton: {
    borderRadius: radius.xl + 2,
    overflow: 'hidden',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    ...shadow.lg,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  logoutText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
