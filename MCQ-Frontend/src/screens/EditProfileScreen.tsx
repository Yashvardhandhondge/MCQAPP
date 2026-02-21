import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

import type { AppStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import ModernInput from '../components/ui/ModernInput';
import ModernCard from '../components/ui/ModernCard';
import { colors, radius, spacing, typography, shadow } from '../theme';

export type EditProfileScreenProps = NativeStackScreenProps<AppStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.fullName ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [saving, setSaving] = useState(false);

  // Animations for smooth entrance
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handlePickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Please allow photo library access to set your profile picture.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUrl(result.assets[0]?.uri ?? null);
      }
    } catch (error) {
      console.error('Error picking image', error);
      Alert.alert('Something went wrong', 'Unable to pick an image right now.');
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    try {
      setSaving(true);
      updateProfile({
        fullName: name.trim(),
        avatarUrl: avatarUrl ?? null,
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }, [avatarUrl, name, navigation, updateProfile]);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const hasAvatar = !!avatarUrl;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
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
              onPress={navigation.goBack}
              style={styles.headerBackButton}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit profile</Text>
          </View>

          <ModernCard variant="elevated" padding="lg" style={styles.card}>
              {/* Avatar section */}
              <View style={styles.avatarSection}>
                <View style={styles.avatarWrapper}>
                  {hasAvatar ? (
                    <View style={styles.avatarOuter}>
                      <Image
                        source={{ uri: avatarUrl ?? undefined }}
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

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.cameraButton}
                    onPress={handlePickImage}
                  >
                    <Ionicons name="camera" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.avatarHint}>Add a photo so your friends recognize you.</Text>
              </View>

              {/* Name input */}
              <ModernInput
                label="Full name"
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="done"
              />

              {/* Actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[styles.primaryButton, saving && styles.buttonDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <LinearGradient
                    colors={colors.gradientPrimary as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButtonGradient}
                  >
                    <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.secondaryButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
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
  card: {
    marginTop: 0,
    paddingTop: spacing.xxxl,
    borderRadius: radius.xxl,
    backgroundColor: colors.authSurface,
    borderWidth: 1,
    borderColor: colors.authBorder,
    ...shadow.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
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
  cameraButton: {
    position: 'absolute',
    bottom: 4,
    right: -4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarHint: {
    ...typography.small,
    color: colors.authTextMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  primaryButton: {
    flex: 1.2,
    borderRadius: radius.full,
    overflow: 'hidden',
    ...shadow.md,
  },
  primaryButtonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.authBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    ...typography.subtitle,
    color: colors.authText,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});


