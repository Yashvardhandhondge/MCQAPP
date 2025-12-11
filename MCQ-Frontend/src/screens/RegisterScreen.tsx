import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import type { AuthStackParamList } from '../navigation/types';
import ModernInput from '../components/ui/ModernInput';
import { colors, radius, spacing, typography, shadow } from '../theme';

export default function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { register, loading, user } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (user) {
      setSuccess(true);
    }
  }, [user]);

  const handleRegister = useCallback(async () => {
    setError(null);
    setSuccess(false);

    // Validation
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      await register(fullName.trim(), email.trim(), password);
      setSuccess(true);
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Unable to register';
      setError(message);
    }
  }, [email, fullName, password, register]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={colors.gradientAuthLight}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                },
              ]}
            >
              {/* Logo/Brand Section */}
              <Animated.View 
                style={[
                  styles.logoSection,
                  {
                    opacity: fadeAnim,
                    transform: [{ 
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, -10],
                      }),
                    }],
                  },
                ]}
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        scale: scaleAnim.interpolate({
                          inputRange: [0.95, 1],
                          outputRange: [0.9, 1],
                        }),
                      },
                    ],
                  }}
                >
                  <LinearGradient
                    colors={colors.gradientPrimary}
                    style={styles.logoContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.logoText}>MHT</Text>
                  </LinearGradient>
                </Animated.View>
                <Text style={styles.brandText}>MHT-CET Prep</Text>
                <Text style={styles.tagline}>Start Your Journey Today</Text>
              </Animated.View>

              {/* Welcome Section */}
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeTitle}>Create Account ✨</Text>
                <Text style={styles.welcomeSubtitle}>
                  Join thousands of students preparing for MHT-CET
                </Text>
              </View>

              {/* Form Card */}
              <Animated.View 
                style={[
                  styles.card,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 50],
                          outputRange: [0, 20],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <ModernInput
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  textContentType="name"
                  returnKeyType="next"
                  editable={!loading && !success}
                />

                <ModernInput
                  label="Email Address"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="next"
                  editable={!loading && !success}
                />

                <ModernInput
                  label="Password"
                  placeholder="Create a password (min 8 characters)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  textContentType="password"
                  returnKeyType="done"
                  editable={!loading && !success}
                  error={error || undefined}
                />

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {success && (
                  <View style={styles.successContainer}>
                    <Text style={styles.successText}>
                      ✅ Account created successfully! Redirecting...
                    </Text>
                  </View>
                )}

                <Animated.View
                  style={{
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 50],
                          outputRange: [0, 10],
                        }),
                      },
                    ],
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.registerButton,
                      (loading || success) && styles.buttonDisabled,
                    ]}
                    onPress={handleRegister}
                    disabled={loading || success}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={success ? colors.gradientAccent : colors.gradientPrimary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.registerButtonText}>
                        {loading
                          ? 'Creating Account...'
                          : success
                          ? 'Account Created!'
                          : 'Create Account'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>

              {/* Login Link */}
              <Animated.View 
                style={[
                  styles.switchRow,
                  {
                    opacity: fadeAnim,
                  },
                ]}
              >
                <Text style={styles.switchLabel}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  disabled={loading}
                  activeOpacity={0.6}
                >
                  <Text style={styles.switchAction}>Sign In</Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
  },
  content: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: radius.xl + 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadow.xl,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  brandText: {
    ...typography.h1,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.subtitle,
    color: colors.authTextMuted,
  },
  welcomeSection: {
    marginBottom: spacing.xxl,
  },
  welcomeTitle: {
    ...typography.h2,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    ...typography.body,
    color: colors.authTextSecondary,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.xl + 4,
    padding: spacing.xxl + 4,
    marginBottom: spacing.xxl,
    ...shadow.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
    fontWeight: '500',
  },
  successContainer: {
    backgroundColor: '#D1FAE5',
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  successText: {
    ...typography.caption,
    color: colors.success,
    textAlign: 'center',
    fontWeight: '500',
  },
  registerButton: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginTop: spacing.lg,
    ...shadow.lg,
  },
  buttonGradient: {
    paddingVertical: spacing.lg + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchLabel: {
    ...typography.body,
    color: colors.authTextSecondary,
  },
  switchAction: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});
