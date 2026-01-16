import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Animated,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadow } from '../../theme';

interface AutoSignupModalProps {
  visible: boolean;
  phoneNumber: string;
  onClose: () => void;
  onComplete: () => void; // Called after successful registration and OTP sent
  onRegister: (fullName: string, email: string, phoneNumber: string) => Promise<void>;
  onSendOTP: (phoneNumber: string) => Promise<void>;
}

const { width } = Dimensions.get('window');

export default function AutoSignupModal({
  visible,
  phoneNumber,
  onClose,
  onComplete,
  onRegister,
  onSendOTP,
}: AutoSignupModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setFullName('');
      setEmail('');
      setError(null);
      
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleSubmit = async () => {
    setError(null);

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

    setLoading(true);

    try {
      // Step 1: Register the user
      await onRegister(fullName.trim(), email.trim(), phoneNumber);
      
      // Step 2: Automatically send OTP
      await onSendOTP(phoneNumber);
      
      // Step 3: Close modal and proceed to OTP verification
      onComplete();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: opacityAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
            disabled={loading}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalContent}>
              {/* Icon Header */}
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="person-add-outline" size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>

              {/* Title */}
              <Text style={styles.title}>Complete Your Profile</Text>

              {/* Message */}
              <Text style={styles.message}>
                Please provide your details to create an account and continue.
              </Text>

              {/* Form Fields */}
              <View style={styles.formSection}>
                {/* Full Name Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={[styles.inputContainer, error && styles.inputError]}>
                    <Ionicons name="person-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your full name"
                      placeholderTextColor="#9CA3AF"
                      value={fullName}
                      onChangeText={(text) => {
                        setFullName(text);
                        setError(null);
                      }}
                      autoCapitalize="words"
                      textContentType="name"
                      returnKeyType="next"
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Email Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={[styles.inputContainer, error && styles.inputError]}>
                    <Ionicons name="mail-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="your.email@example.com"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setError(null);
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="emailAddress"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                      editable={!loading}
                    />
                  </View>
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
              </View>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.cancelButton, loading && styles.buttonDisabled]}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  style={[styles.submitButton, loading && styles.buttonDisabled]}
                  activeOpacity={0.8}
                  disabled={loading || !fullName.trim() || !email.trim()}
                >
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    style={styles.submitButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.submitButtonText}>Continue</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 420,
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl + 4,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadow.xl,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: radius.xl + 4,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.lg,
  },
  title: {
    ...typography.h2,
    color: '#111827',
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontSize: 22,
  },
  message: {
    ...typography.body,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
    fontSize: 14,
  },
  formSection: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.lg,
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
    marginRight: spacing.sm,
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
    width: '100%',
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 13,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    marginTop: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...typography.subtitle,
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 15,
  },
  submitButton: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.md,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  submitButtonText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
