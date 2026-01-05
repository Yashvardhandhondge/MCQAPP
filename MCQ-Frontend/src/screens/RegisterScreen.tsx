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
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import type { AuthStackParamList } from '../navigation/types';
import TabSelector from '../components/ui/TabSelector';
import { colors, radius, spacing, typography, shadow } from '../theme';
import { formatPhoneNumber, validatePhoneNumber } from '../utils/phoneValidation';

export default function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { register, loading, user } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
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

  const handlePhoneChange = useCallback((text: string) => {
    setError(null);
    // Remove all non-digit characters and +91 prefix if present
    let digits = text.replace(/\D/g, '');
    
    // Remove +91 if user typed it
    if (digits.startsWith('91') && digits.length > 10) {
      digits = digits.substring(2);
    }
    
    // Limit to 10 digits
    if (digits.length <= 10) {
      setPhoneNumber(digits);
      // Format with +91 prefix
      const formatted = digits.length > 0 ? `+91${digits}` : '';
      setFormattedPhone(formatted);
    }
  }, []);

  const handleRegister = useCallback(async () => {
    setError(null);
    setSuccess(false);

    // Validation
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters');
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

    const finalPhone = formattedPhone || formatPhoneNumber(phoneNumber);
    if (!validatePhoneNumber(finalPhone)) {
      setError('Please enter a valid Indian phone number (+91 followed by 10 digits)');
      return;
    }

    try {
      await register(fullName.trim(), email.trim(), finalPhone);
      setSuccess(true);
      // Navigate to OTP login after successful registration
      setTimeout(() => {
        navigation.navigate('OTPLogin');
      }, 1500);
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Unable to register';
      setError(message);
    }
  }, [email, fullName, phoneNumber, formattedPhone, register, navigation]);

  const handleTabChange = useCallback((tab: 'signup' | 'login' | 'otp') => {
    if (tab === 'login' || tab === 'otp') {
      navigation.navigate('OTPLogin');
    }
  }, [navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#F5F3FF', '#EDE9FE', '#E0E7FF']}
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
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Tab Selector */}
              <TabSelector activeTab="signup" onTabChange={handleTabChange} />

              {/* Form Card */}
              <Animated.View 
                style={[
                  styles.card,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                {/* Icon and Title */}
                <View style={styles.iconSection}>
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    style={styles.iconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="sparkles" size={40} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.title}>Create Account</Text>
                  <Text style={styles.subtitle}>Join us and start your learning journey</Text>
                </View>

                {/* Form Fields */}
                <View style={styles.formSection}>
                  {/* Full Name */}
                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>Full Name</Text>
                    <View style={[styles.inputContainer, error && styles.inputError]}>
                      <Ionicons name="person-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your full name"
                        placeholderTextColor="#9CA3AF"
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                        textContentType="name"
                        returnKeyType="next"
                        editable={!loading && !success}
                      />
                    </View>
                  </View>

                  {/* Email */}
                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={[styles.inputContainer, error && styles.inputError]}>
                      <Ionicons name="mail-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="your.email@example.com"
                        placeholderTextColor="#9CA3AF"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        textContentType="emailAddress"
                        returnKeyType="next"
                        editable={!loading && !success}
                      />
                    </View>
                  </View>

                  {/* Phone Number */}
                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={[styles.inputContainer, error && styles.inputError]}>
                      <Ionicons name="call-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="+91 98765 43210"
                        placeholderTextColor="#9CA3AF"
                        value={phoneNumber}
                        onChangeText={handlePhoneChange}
                        keyboardType="phone-pad"
                        maxLength={10}
                        editable={!loading && !success}
                      />
                    </View>
                  </View>

                  {error && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  {success && (
                    <View style={styles.successContainer}>
                      <Text style={styles.successText}>
                        ✅ Account created successfully! Please login with OTP to continue.
                      </Text>
                    </View>
                  )}

                  {/* Create Account Button */}
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
                    colors={success ? colors.gradientAccent as [string, string] : colors.gradientPrimary as [string, string]}
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
                </View>

                {/* Login Link */}
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Already have an account? </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('OTPLogin')}
                    disabled={loading}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.switchAction}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Footer */}
              <Text style={styles.footerText}>Beautiful authentication experience ✨</Text>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xxl + 4,
    padding: spacing.xxl,
    ...shadow.xl,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.xl + 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadow.lg,
  },
  title: {
    ...typography.h1,
    color: '#111827',
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 28,
  },
  subtitle: {
    ...typography.body,
    color: '#6B7280',
    textAlign: 'center',
  },
  formSection: {
    gap: spacing.lg,
  },
  inputWrapper: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.subtitle,
    color: '#374151',
    fontWeight: '600',
    marginBottom: spacing.sm,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: spacing.md,
    minHeight: 56,
  },
  inputIcon: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: '#111827',
    fontSize: 16,
    padding: 0,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
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
    padding: spacing.md,
    marginTop: spacing.sm,
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
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  switchLabel: {
    ...typography.body,
    color: '#6B7280',
    fontSize: 14,
  },
  switchAction: {
    ...typography.body,
    color: '#6366F1',
    fontWeight: '600',
    fontSize: 14,
  },
  footerText: {
    ...typography.caption,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
