import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import type { AuthStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';
import { axiosInstance } from '../services/http';
import { validatePhoneNumber } from '../utils/phoneValidation';

interface CoachingClass {
  _id: string;
  name: string;
  logoUrl?: string;
}

export default function ClassLoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { loginWithClass, loading } = useAuth();

  const [classes, setClasses] = useState<CoachingClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [fetchingClasses, setFetchingClasses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneInputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        setFetchingClasses(true);
        setError(null);
        const { data } = await axiosInstance.get<{ success: boolean; data: CoachingClass[] }>('/api/mcq/classes');
        if (data?.success && Array.isArray(data.data)) {
          setClasses(data.data);
          if (data.data.length > 0) {
            setSelectedClassId(data.data[0]._id);
          }
        } else {
          setError('Unable to load classes. Please try again later.');
        }
      } catch (err) {
        console.error('[CLASS LOGIN] Failed to load classes', err);
        setError('Unable to load classes. Please try again later.');
      } finally {
        setFetchingClasses(false);
      }
    };

    loadClasses();
  }, []);

  const handlePhoneChange = useCallback((text: string) => {
    setError(null);
    let digits = text.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length > 10) {
      digits = digits.substring(2);
    }
    if (digits.length <= 10) {
      setPhoneNumber(digits);
      const formatted = digits.length > 0 ? `+91${digits}` : '';
      setFormattedPhone(formatted);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (!selectedClassId) {
      setError('Please select your class');
      return;
    }
    const finalPhone = formattedPhone || (phoneNumber ? `+91${phoneNumber}` : '');
    if (!validatePhoneNumber(finalPhone)) {
      setError('Please enter a valid Indian phone number (+91 followed by 10 digits)');
      return;
    }

    try {
      setSubmitting(true);
      await loginWithClass(selectedClassId, finalPhone);
      // AuthContext will navigate to main app on success
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to login with class';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [formattedPhone, phoneNumber, selectedClassId, loginWithClass]);

  const canSubmit = !!selectedClassId && phoneNumber.length === 10 && !submitting && !loading;

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
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              {/* Back */}
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>&lt; Back</Text>
              </TouchableOpacity>

              {/* Header */}
              <View style={styles.iconSection}>
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  style={styles.iconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="school-outline" size={40} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.title}>Login with Your Class</Text>
                <Text style={styles.subtitle}>
                  If your coaching class has given you access, use this screen to login and get premium automatically.
                </Text>
              </View>

              {/* Class Selector */}
              <View style={styles.formSection}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Select Your Class</Text>
                  <View style={styles.dropdownContainer}>
                    {fetchingClasses ? (
                      <View style={styles.dropdownInner}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.dropdownPlaceholder}>Loading classes...</Text>
                      </View>
                    ) : classes.length === 0 ? (
                      <View style={styles.dropdownInner}>
                        <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                        <Text style={styles.dropdownPlaceholder}>
                          No classes available. Please contact your class admin.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.dropdownInner}>
                        <Ionicons name="business-outline" size={18} color="#6366F1" />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={styles.classChipsRow}>
                            {classes.map((klass) => {
                              const isSelected = klass._id === selectedClassId;
                              return (
                                <TouchableOpacity
                                  key={klass._id}
                                  onPress={() => setSelectedClassId(klass._id)}
                                  activeOpacity={0.7}
                                  style={[
                                    styles.classChip,
                                    isSelected && styles.classChipSelected,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.classChipText,
                                      isSelected && styles.classChipTextSelected,
                                    ]}
                                  >
                                    {klass.name}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>

                {/* Phone Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Registered Mobile Number</Text>
                  <View style={[styles.inputContainer, error && styles.inputError]}>
                    <Ionicons name="call-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                    <Text style={styles.phonePrefix}>+91</Text>
                    <TextInput
                      ref={phoneInputRef}
                      style={styles.input}
                      placeholder="98765 43210"
                      placeholderTextColor="#9CA3AF"
                      value={phoneNumber}
                      onChangeText={handlePhoneChange}
                      keyboardType="phone-pad"
                      maxLength={10}
                      editable={!submitting && !loading}
                    />
                  </View>
                  <Text style={styles.helperText}>
                    Use the same mobile number that you gave to your class.
                  </Text>
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Submit */}
                <TouchableOpacity
                  style={[styles.primaryButton, !canSubmit && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {submitting || loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Continue</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Info */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={18} color="#6366F1" />
                <Text style={styles.infoText}>
                  This login is only for students whose numbers are added by their coaching class. Others should
                  login using OTP.
                </Text>
              </View>
            </View>
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
  title: {
    ...typography.h1,
    color: '#111827',
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 24,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontSize: 14,
    lineHeight: 20,
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
  dropdownContainer: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    minHeight: 56,
    justifyContent: 'center',
  },
  dropdownInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  dropdownPlaceholder: {
    ...typography.body,
    color: '#6B7280',
    fontSize: 13,
    flex: 1,
  },
  classChipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  classChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  classChipSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  classChipText: {
    ...typography.caption,
    color: '#374151',
    fontSize: 13,
    fontWeight: '500',
  },
  classChipTextSelected: {
    color: '#4338CA',
    fontWeight: '600',
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
  helperText: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 12,
    marginTop: spacing.xs,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  infoText: {
    ...typography.caption,
    color: '#4B5563',
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});

