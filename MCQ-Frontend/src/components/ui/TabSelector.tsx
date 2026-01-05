import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, typography, shadow } from '../../theme';

type TabType = 'signup' | 'login' | 'otp';

interface TabSelectorProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function TabSelector({ activeTab, onTabChange }: TabSelectorProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabChange('signup')}
        activeOpacity={0.7}
      >
        {activeTab === 'signup' ? (
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.activeTab}
          >
            <Text style={styles.activeTabText}>Signup</Text>
          </LinearGradient>
        ) : (
          <View style={styles.inactiveTab}>
            <Text style={styles.inactiveTabText}>Signup</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabChange('login')}
        activeOpacity={0.7}
      >
        {activeTab === 'login' ? (
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.activeTab}
          >
            <Text style={styles.activeTabText}>Login</Text>
          </LinearGradient>
        ) : (
          <View style={styles.inactiveTab}>
            <Text style={styles.inactiveTabText}>Login</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabChange('otp')}
        activeOpacity={0.7}
      >
        {activeTab === 'otp' ? (
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.activeTab}
          >
            <Text style={styles.activeTabText}>OTP</Text>
          </LinearGradient>
        ) : (
          <View style={styles.inactiveTab}>
            <Text style={styles.inactiveTabText}>OTP</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    ...shadow.lg,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
  },
  activeTab: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  inactiveTab: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveTabText: {
    ...typography.subtitle,
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 14,
  },
});

