import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadow } from '../../theme';
import type { ReportType } from '../../types/mcq';
import { reportQuestion } from '../../services/mcq.service';

interface ReportQuestionModalProps {
  visible: boolean;
  questionId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const REPORT_TYPES: Array<{ type: ReportType; label: string; icon: string; description: string }> = [
  {
    type: 'wrong-question',
    label: 'Wrong Question',
    icon: 'alert-circle',
    description: 'The question itself is incorrect or unclear',
  },
  {
    type: 'wrong-options',
    label: 'Wrong Options',
    icon: 'close-circle',
    description: 'The options or correct answer is incorrect',
  },
  {
    type: 'invalid-question',
    label: 'Invalid Question',
    icon: 'ban',
    description: 'The question is invalid or inappropriate',
  },
];

export default function ReportQuestionModal({
  visible,
  questionId,
  onClose,
  onSuccess,
}: ReportQuestionModalProps) {
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDetailsForm, setShowDetailsForm] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedReportType(null);
      setDetails('');
      setShowDetailsForm(false);
    }
  }, [visible]);

  const handleReportTypeSelect = (type: ReportType) => {
    setSelectedReportType(type);
    setShowDetailsForm(true);
  };

  const handleSubmit = async () => {
    if (!questionId) {
      Alert.alert('Error', 'Question ID is missing');
      return;
    }

    if (!selectedReportType) {
      Alert.alert('Error', 'Please select a report type');
      return;
    }

    if (!details.trim()) {
      Alert.alert('Error', 'Please provide details about the issue');
      return;
    }

    setSubmitting(true);
    try {
      await reportQuestion(questionId, {
        reportType: selectedReportType,
        details: details.trim(),
      });

      Alert.alert('Success', 'Question reported successfully. Thank you for your feedback!', [
        {
          text: 'OK',
          onPress: () => {
            handleClose();
            if (onSuccess) {
              onSuccess();
            }
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to report question. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReportType(null);
    setDetails('');
    setShowDetailsForm(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="flag" size={24} color={colors.primary} />
              </View>
              <Text style={styles.headerTitle}>Report Question</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={colors.authText} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {!showDetailsForm ? (
              <>
                <Text style={styles.subtitle}>
                  Please select the type of issue you found with this question:
                </Text>
                <View style={styles.reportTypesContainer}>
                  {REPORT_TYPES.map((reportType) => (
                    <TouchableOpacity
                      key={reportType.type}
                      style={styles.reportTypeCard}
                      onPress={() => handleReportTypeSelect(reportType.type)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.reportTypeContent}>
                        <View style={styles.reportTypeIconContainer}>
                          <Ionicons name={reportType.icon as any} size={28} color={colors.primary} />
                        </View>
                        <View style={styles.reportTypeInfo}>
                          <Text style={styles.reportTypeLabel}>{reportType.label}</Text>
                          <Text style={styles.reportTypeDescription}>{reportType.description}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.authTextMuted} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <>
                <View style={styles.selectedTypeContainer}>
                  <Ionicons
                    name={REPORT_TYPES.find((r) => r.type === selectedReportType)?.icon as any}
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.selectedTypeText}>
                    {REPORT_TYPES.find((r) => r.type === selectedReportType)?.label}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowDetailsForm(false);
                      setDetails('');
                    }}
                    style={styles.changeButton}
                  >
                    <Text style={styles.changeButtonText}>Change</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.detailsLabel}>Please provide details:</Text>
                <TextInput
                  style={styles.detailsInput}
                  placeholder="Describe the issue in detail..."
                  placeholderTextColor={colors.authTextMuted}
                  multiline
                  numberOfLines={6}
                  value={details}
                  onChangeText={setDetails}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={submitting || !details.trim()}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      submitting || !details.trim()
                        ? ([colors.authBorder, colors.authBorder] as [string, string, ...string[]])
                        : (colors.gradientPrimary as [string, string, ...string[]])
                    }
                    style={styles.submitGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {submitting ? (
                      <>
                        <ActivityIndicator color="#FFFFFF" size="small" />
                        <Text style={styles.submitButtonText}>Submitting...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="send" size={18} color="#FFFFFF" />
                        <Text style={styles.submitButtonText}>Submit Report</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContainer: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.xl + 4,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    ...shadow.xl,
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.authBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.authText,
    fontWeight: '700',
    fontSize: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.authInputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.xl,
  },
  subtitle: {
    ...typography.body,
    color: colors.authTextSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  reportTypesContainer: {
    gap: spacing.md,
  },
  reportTypeCard: {
    backgroundColor: colors.authInputBg,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.authBorder,
    ...shadow.sm,
  },
  reportTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  reportTypeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTypeInfo: {
    flex: 1,
  },
  reportTypeLabel: {
    ...typography.subtitle,
    color: colors.authText,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  reportTypeDescription: {
    ...typography.caption,
    color: colors.authTextMuted,
    lineHeight: 18,
  },
  selectedTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  selectedTypeText: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  changeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  changeButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  detailsLabel: {
    ...typography.subtitle,
    color: colors.authText,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  detailsInput: {
    backgroundColor: colors.authInputBg,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...typography.body,
    color: colors.authText,
    borderWidth: 1,
    borderColor: colors.authBorder,
    minHeight: 120,
    marginBottom: spacing.xl,
  },
  submitButton: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.md,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  submitButtonText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

