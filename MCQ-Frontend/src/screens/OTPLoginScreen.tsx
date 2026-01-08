import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import type { AuthStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography, shadow } from '../theme';
import { formatPhoneNumber, validatePhoneNumber } from '../utils/phoneValidation';

const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const RESEND_COOLDOWN_SECONDS = 30;

export default function OTPLoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { sendOTP, loginWithOTP, loading } = useAuth();

  const [step, setStep] = useState<1 | 2>(1); // 1: Phone input, 2: OTP verification
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState(OTP_EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sendingOTP, setSendingOTP] = useState(false);

  // Refs for OTP inputs
  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
    ]).start();
  }, []);

  // OTP expiry countdown timer
  useEffect(() => {
    if (step === 2 && otpExpiry > 0) {
      const timer = setInterval(() => {
        setOtpExpiry((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, otpExpiry]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const handlePhoneChange = useCallback((text: string) => {
    setError(null);
    setShowSignupPrompt(false);
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

  const handleSendOTP = useCallback(async () => {
    setError(null);
    setSendingOTP(true);

    const finalPhone = formattedPhone || formatPhoneNumber(phoneNumber);
    
    if (!validatePhoneNumber(finalPhone)) {
      setError('Please enter a valid Indian phone number (+91 followed by 10 digits)');
      setSendingOTP(false);
      return;
    }

    try {
      await sendOTP(finalPhone);
      setPhoneNumber(finalPhone.slice(3)); // Store without +91 for display
      setFormattedPhone(finalPhone);
      setOtpExpiry(OTP_EXPIRY_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setStep(2);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(message);
    } finally {
      setSendingOTP(false);
    }
  }, [phoneNumber, formattedPhone, sendOTP]);

  const handleOTPChange = useCallback((index: number, value: string) => {
    setError(null);
    
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newOtp.every((digit) => digit !== '') && newOtp.join('').length === 6) {
      handleVerifyOTP(newOtp.join(''));
    }
  }, [otp]);

  const handleOTPKeyPress = useCallback((index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handleVerifyOTP = useCallback(async (otpValue?: string) => {
    setError(null);
    setShowSignupPrompt(false);
    const finalOtp = otpValue || otp.join('');

    if (finalOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    if (!validatePhoneNumber(formattedPhone)) {
      setError('Invalid phone number');
      return;
    }

    try {
      await loginWithOTP(formattedPhone, finalOtp);
      // Navigation will happen automatically via AuthContext
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid OTP. Please try again.';
      
      // Check if error indicates user needs to sign up
      const isSignupRequired = message.toLowerCase().includes('sign up') || 
                               message.toLowerCase().includes('signup') ||
                               message.toLowerCase().includes('no account found');
      
      if (isSignupRequired) {
        setShowSignupPrompt(true);
        setError(null);
      } else {
        setError(message);
      }
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    }
  }, [otp, formattedPhone, loginWithOTP]);

  const handleResendOTP = useCallback(async () => {
    if (resendCooldown > 0) {
      return;
    }

    setError(null);
    setSendingOTP(true);
    setOtp(['', '', '', '', '', '']);
    setOtpExpiry(OTP_EXPIRY_SECONDS);

    try {
      await sendOTP(formattedPhone);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend OTP';
      setError(message);
    } finally {
      setSendingOTP(false);
    }
  }, [formattedPhone, resendCooldown, sendOTP]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


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
              {/* Step 1: Phone Number Input */}
              {step === 1 && (
                <View style={styles.card}>
                  {/* Icon and Title */}
                  <View style={styles.iconSection}>
                    <LinearGradient
                      colors={['#6366F1', '#8B5CF6']}
                      style={styles.iconContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="lock-closed-outline" size={40} color="#FFFFFF" />
                    </LinearGradient>
                    <Text style={styles.title}>Welcome</Text>
                    <Text style={styles.subtitle}>Sign in to continue your journey</Text>
                  </View>

                  {/* Phone Input */}
                  <View style={styles.formSection}>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.label}>Phone Number</Text>
                      <View style={[styles.inputContainer, error && styles.inputError]}>
                        <Ionicons name="call-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                        <Text style={styles.phonePrefix}>+91</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="98765 43210"
                          placeholderTextColor="#9CA3AF"
                          value={phoneNumber}
                          onChangeText={handlePhoneChange}
                          keyboardType="phone-pad"
                          maxLength={10}
                          autoFocus
                          editable={!sendingOTP && !loading}
                        />
                      </View>
                    </View>

                    {/* Info Message */}
                    <View style={styles.infoBox}>
                      <Ionicons name="phone-portrait-outline" size={20} color="#6366F1" />
                      <Text style={styles.infoText}>
                        We'll send you a one-time password (OTP) to verify your number
                      </Text>
                    </View>

                    {error && (
                      <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    )}

                    {/* Send OTP Button */}
                    <TouchableOpacity
                      style={[styles.primaryButton, (sendingOTP || loading || !phoneNumber || phoneNumber.length !== 10) && styles.buttonDisabled]}
                      onPress={handleSendOTP}
                      disabled={sendingOTP || loading || !phoneNumber || phoneNumber.length !== 10}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={['#6366F1', '#8B5CF6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                      >
                        {sendingOTP ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text style={styles.primaryButtonText}>Send OTP</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  {/* Sign Up Link */}
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Don't have an account? </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Register')}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.switchAction}>Sign Up</Text>
                    </TouchableOpacity>
                  </View>

                  
                </View>
              )}

              {/* Step 2: OTP Verification */}
              {step === 2 && (
                <View style={styles.card}>
                  {/* Back Button */}
                  <TouchableOpacity
                    onPress={() => {
                      setStep(1);
                      setOtp(['', '', '', '', '', '']);
                      setError(null);
                      setShowSignupPrompt(false);
                      setOtpExpiry(OTP_EXPIRY_SECONDS);
                    }}
                    style={styles.backButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.backButtonText}>&lt; Back</Text>
                  </TouchableOpacity>

                  {/* Icon and Title */}
                  <View style={styles.iconSection}>
                    <LinearGradient
                      colors={['#6366F1', '#8B5CF6']}
                      style={styles.iconContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.lockEmoji}>🔐</Text>
                    </LinearGradient>
                    <Text style={styles.title}>Verify OTP</Text>
                    <Text style={styles.subtitle}>
                      Enter the 6-digit code sent to
                    </Text>
                    <Text style={styles.phoneNumberText}>
                      {formattedPhone || '+91 98765 43210'}
                    </Text>
                  </View>

                  {/* OTP Input Boxes */}
                  <View style={styles.otpSection}>
                    <View style={styles.otpContainer}>
                      {otp.map((digit, index) => (
                        <TextInput
                          key={index}
                          ref={(ref) => {
                            otpInputRefs.current[index] = ref;
                          }}
                          style={[
                            styles.otpInput,
                            digit && styles.otpInputFilled,
                            error && styles.otpInputError,
                          ]}
                          value={digit}
                          onChangeText={(value) => handleOTPChange(index, value)}
                          onKeyPress={({ nativeEvent }) => handleOTPKeyPress(index, nativeEvent.key)}
                          keyboardType="number-pad"
                          maxLength={1}
                          selectTextOnFocus
                          editable={!loading}
                        />
                      ))}
                    </View>

                    {showSignupPrompt && (
                      <View style={styles.signupPromptContainer}>
                        <View style={styles.signupPromptIcon}>
                          <Ionicons name="person-add-outline" size={32} color="#6366F1" />
                        </View>
                        <Text style={styles.signupPromptTitle}>Account Not Found</Text>
                        <Text style={styles.signupPromptMessage}>
                          This phone number is not registered.{'\n'}
                          Please sign up to create an account first.
                        </Text>
                        <TouchableOpacity
                          style={styles.signupPromptButton}
                          onPress={() => {
                            setShowSignupPrompt(false);
                            setError(null);
                            setOtp(['', '', '', '', '', '']);
                            navigation.navigate('Register');
                          }}
                          activeOpacity={0.85}
                        >
                          <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.signupButtonGradient}
                          >
                            <Ionicons name="person-add" size={20} color="#FFFFFF" />
                            <Text style={styles.signupPromptButtonText}>Sign Up Now</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    )}

                    {error && !showSignupPrompt && (
                      <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    )}

                    {/* Resend OTP */}
                    <View style={styles.resendSection}>
                      <Text style={styles.resendLabel}>Didn't receive the code?</Text>
                      <TouchableOpacity
                        onPress={handleResendOTP}
                        disabled={resendCooldown > 0 || sendingOTP}
                        activeOpacity={0.6}
                      >
                        <Text
                          style={[
                            styles.resendText,
                            (resendCooldown > 0 || sendingOTP) && styles.resendTextDisabled,
                          ]}
                        >
                          {sendingOTP
                            ? 'Sending...'
                            : resendCooldown > 0
                            ? `Resend OTP (${resendCooldown})`
                            : 'Resend OTP'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Verify Button */}
                  <TouchableOpacity
                    style={[styles.primaryButton, (!otp.every((d) => d) || loading) && styles.buttonDisabled]}
                    onPress={() => handleVerifyOTP()}
                    disabled={!otp.every((d) => d) || loading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#6366F1', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Security Message */}
                  <View style={styles.securityBox}>
                    <Ionicons name="lock-closed" size={16} color="#6366F1" />
                    <Text style={styles.securityText}>Your data is secure and encrypted</Text>
                  </View>
                </View>
              )}

              
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
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xxl + 4,
    padding: spacing.xxl + 8,
    ...shadow.xl,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  backButton: {
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  backButtonText: {
    ...typography.body,
    color: '#6B7280',
    fontWeight: '500',
    fontSize: 14,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.xl + 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadow.lg,
  },
  lockEmoji: {
    fontSize: 36,
  },
  title: {
    ...typography.h1,
    color: '#111827',
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 26,
  },
  subtitle: {
    ...typography.body,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontSize: 14,
    lineHeight: 20,
  },
  phoneNumberText: {
    ...typography.subtitle,
    color: '#6366F1',
    fontWeight: '600',
    fontSize: 16,
    marginTop: spacing.xs,
  },
  formSection: {
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  inputWrapper: {
    marginBottom: spacing.lg,
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
    marginRight: spacing.sm,
  },
  phonePrefix: {
    ...typography.body,
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
    marginRight: spacing.xs,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: '#6366F1',
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
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
  otpSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    width: '100%',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
    width: '100%',
  },
  otpInput: {
    flex: 1,
    maxWidth: 48,
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
    ...typography.h2,
    color: '#111827',
    fontWeight: '700',
    fontSize: 22,
    minWidth: 44,
  },
  otpInputFilled: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  otpInputError: {
    borderColor: colors.danger,
    backgroundColor: '#FEE2E2',
  },
  resendSection: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  resendLabel: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  resendText: {
    ...typography.subtitle,
    color: '#6366F1',
    fontWeight: '600',
    fontSize: 14,
  },
  resendTextDisabled: {
    color: '#9CA3AF',
  },
  signupPromptContainer: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  signupPromptIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  signupPromptTitle: {
    ...typography.h3,
    color: '#111827',
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontSize: 20,
  },
  signupPromptMessage: {
    ...typography.body,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
    fontSize: 15,
  },
  signupPromptButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    width: '100%',
    ...shadow.md,
  },
  signupButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.lg,
  },
  signupPromptButtonText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  primaryButton: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginTop: spacing.lg,
    ...shadow.lg,
  },
  buttonGradient: {
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    gap: spacing.xs,
  },
  securityText: {
    ...typography.caption,
    color: '#6366F1',
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
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
  footerTextCard: {
    ...typography.caption,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: spacing.lg,
    fontSize: 13,
  },
});

