import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AppStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '../theme';
import BackHeader from '../components/ui/BackHeader';

export default function PrivacyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList, 'Privacy'>>();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.background}>
        <BackHeader
          title="Privacy Policy"
          subtitle="How we handle your data"
          navigation={navigation}
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.lastUpdated}>Last updated: February 2025</Text>

          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            MHTCET Saarthi ("we", "our", or "the app") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our MHT CET preparation app.
          </Text>

          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          <Text style={styles.paragraph}>
            We may collect: (a) account information you provide (name, email, phone for OTP); (b) usage data such as practice progress, test scores, and performance analytics; (c) device information (e.g. device ID for push notifications). We do not sell your personal data.
          </Text>

          <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            Your information is used to provide and improve the app (personalized practice, leaderboards, analytics), to send you notifications (e.g. study reminders, exam updates), and to process payments if you subscribe to premium features.
          </Text>

          <Text style={styles.sectionTitle}>4. Data Storage & Security</Text>
          <Text style={styles.paragraph}>
            Data is stored on secure servers. We use industry-standard measures to protect your data. Payment processing is handled by third-party providers (e.g. Razorpay) in accordance with their privacy policies.
          </Text>

          <Text style={styles.sectionTitle}>5. Third-Party Services</Text>
          <Text style={styles.paragraph}>
            We may use third-party services for analytics, push notifications (e.g. OneSignal), and payments. These services have their own privacy policies governing their use of data.
          </Text>

          <Text style={styles.sectionTitle}>6. Your Rights</Text>
          <Text style={styles.paragraph}>
            You can request access to, correction of, or deletion of your personal data. You may opt out of push notifications in your device settings. For requests or questions, contact us at the email below.
          </Text>

          <Text style={styles.sectionTitle}>7. Contact</Text>
          <Text style={styles.paragraph}>
            For privacy-related queries: yasharadhyeapp@gmail.com
          </Text>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  background: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 80,
  },
  lastUpdated: {
    ...typography.caption,
    color: colors.authTextMuted,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  paragraph: {
    ...typography.body,
    color: colors.authTextSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  bottomSpacer: { height: 40 },
});
