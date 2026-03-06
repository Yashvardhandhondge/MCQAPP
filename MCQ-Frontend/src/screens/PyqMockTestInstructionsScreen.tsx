import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { AppStackParamList } from '../navigation/types';
import { startPyqMockTestSession } from '../services/mcq.service';
import { colors, radius, spacing, typography, shadow } from '../theme';
import BackHeader from '../components/ui/BackHeader';
import { safeGoBack } from '../utils/navigation';

type PyqMockTestInstructionsScreenProps = NativeStackScreenProps<
  AppStackParamList,
  'PyqMockTestInstructions'
>;

const INSTRUCTION_ITEMS = [
  'This is a full-length PYQ mock test based on the selected previous year paper.',
  'The test duration is 180 minutes. The timer starts as soon as the test begins.',
  'Questions appear one at a time with four options. Tap an option to save your answer for that question.',
  'Use Prev and Save & Next to move between questions during the exam.',
  'Use the question list button on the test screen to jump to any question directly.',
  'Use Mark for Review to flag questions that you want to revisit before submission.',
  'For mock tests, questions are shown in exam-style sections so you can track the paper structure clearly.',
  'Your test will be auto-submitted when the timer ends. You can also finish and submit earlier.',
  'Submit only after reviewing your answers carefully, because the result is generated after final submission.',
];

export default function PyqMockTestInstructionsScreen({
  navigation,
  route,
}: PyqMockTestInstructionsScreenProps) {
  const { test } = route.params;
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subjectsLabel = useMemo(() => {
    if (!Array.isArray(test.subjects) || test.subjects.length === 0) {
      return 'Physics, Chemistry and Mathematics';
    }
    return test.subjects.join(' • ');
  }, [test.subjects]);

  const testTitle = test.year ? `${test.title} • ${test.year}` : test.title;

  const handleStartTest = async () => {
    setStarting(true);
    setError(null);

    try {
      const response = await startPyqMockTestSession(test.title, test.year);

      if (response.data?.sessionId && response.data?.questions) {
        navigation.replace('CBT', {
          testId: response.data.sessionId,
          questions: response.data.questions,
          testType: 'pyq-mocktest',
          testTitle: `${test.title} • ${test.year ? `Year ${test.year}` : 'PYQ Mock Test'}`,
        });
        return;
      }

      setError('Failed to start PYQ mock test');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to start PYQ mock test');
    } finally {
      setStarting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.background}>
        <BackHeader title="General Instructions" onBack={() => safeGoBack(navigation)} />

        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="document-text" size={24} color={colors.primary} />
              </View>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroTitle}>{testTitle}</Text>
                <Text style={styles.heroSubtitle}>Read the instructions carefully before starting.</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Ionicons name="help-circle-outline" size={16} color={colors.primary} />
                <Text style={styles.metaChipText}>{test.questionCount} Questions</Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={styles.metaChipText}>180 Minutes</Text>
              </View>
            </View>

            <View style={styles.subjectRow}>
              <Ionicons name="albums-outline" size={16} color={colors.authTextSecondary} />
              <Text style={styles.subjectText}>{subjectsLabel}</Text>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.instructionsCard}>
            <Text style={styles.sectionTitle}>General Instructions</Text>
            <Text style={styles.sectionSubtitle}>
              Follow these points for a smooth test experience inside the app.
            </Text>

            <View style={styles.instructionsList}>
              {INSTRUCTION_ITEMS.map((item, index) => (
                <View key={`${index}-${item}`} style={styles.instructionRow}>
                  <View style={styles.bulletWrap}>
                    <Text style={styles.bulletText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.noticeCard}>
            <Ionicons name="information-circle" size={18} color={colors.warning} />
            <Text style={styles.noticeText}>
              Once you tap start, the session opens immediately and the timer begins on the test screen.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleStartTest}
            disabled={starting}
            style={styles.startButtonWrap}
          >
            <LinearGradient
              colors={colors.gradientPrimary as [string, string, ...string[]]}
              style={styles.startButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {starting ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.startButtonText}>Starting Test...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="play" size={18} color="#FFFFFF" />
                  <Text style={styles.startButtonText}>Start Test</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
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
  background: {
    flex: 1,
    backgroundColor: '#F3E8FF',
  },
  container: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: 100,
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.authTextSecondary,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  metaChipText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  subjectText: {
    ...typography.body,
    color: colors.authTextSecondary,
    fontSize: 13,
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.danger}12`,
    borderWidth: 1,
    borderColor: `${colors.danger}30`,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    fontSize: 13,
    flex: 1,
  },
  instructionsCard: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.authTextSecondary,
    fontSize: 13,
    marginBottom: spacing.lg,
  },
  instructionsList: {
    gap: spacing.md,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    marginTop: 1,
  },
  bulletText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  instructionText: {
    ...typography.body,
    color: colors.authText,
    fontSize: 14,
    lineHeight: 21,
    flex: 1,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#FEF3C7',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  noticeText: {
    ...typography.body,
    color: '#92400E',
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  startButtonWrap: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.md,
  },
  startButton: {
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  startButtonText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
