import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import type { AppStackParamList } from '../navigation/types';
import { updateUserGroup } from '../services/auth.service';
import { colors, radius, spacing, typography, shadow } from '../theme';
import ModernCard from '../components/ui/ModernCard';

type GroupType = 'PCM' | 'PCB' | 'PCMB';

interface GroupOption {
  value: GroupType;
  label: string;
  description: string;
  subjects: string[];
  icon: string;
  gradient: string[];
}

const GROUP_OPTIONS: GroupOption[] = [
  {
    value: 'PCM',
    label: 'PCM',
    description: 'Physics, Chemistry, Mathematics',
    subjects: ['Physics', 'Chemistry', 'Maths'],
    icon: 'calculator',
    gradient: ['#6366F1', '#4F46E5'], // Purple/Indigo
  },
  {
    value: 'PCB',
    label: 'PCB',
    description: 'Physics, Chemistry, Biology',
    subjects: ['Physics', 'Chemistry', 'Biology'],
    icon: 'flask',
    gradient: ['#8B5CF6', '#7C3AED'], // Purple
  },
  {
    value: 'PCMB',
    label: 'PCMB',
    description: 'Physics, Chemistry, Mathematics, Biology (General)',
    subjects: ['Physics', 'Chemistry', 'Maths', 'Biology'],
    icon: 'school',
    gradient: ['#10B981', '#059669'], // Green
  },
];

export default function GroupSelectionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute();
  const editMode = (route.params as { editMode?: boolean } | undefined)?.editMode ?? false;
  
  const { user, updateUserGroup } = useAuth();

  const [selectedGroup, setSelectedGroup] = useState<GroupType | null>(user?.group || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // If user already has a group and NOT in edit mode, navigate to main tabs
  useEffect(() => {
    if (user?.group && !editMode) {
      navigation.replace('MainTabs');
    }
  }, [user?.group, navigation, editMode]);

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

  const handleSelectGroup = useCallback(async () => {
    if (!selectedGroup) {
      setError('Please select a group');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await updateUserGroup(selectedGroup);
      // If in edit mode, go back to previous screen; otherwise navigate to main tabs
      if (editMode) {
        navigation.goBack();
      } else {
        navigation.replace('MainTabs');
      }
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Failed to update group';
      setError(message);
      setLoading(false);
    }
  }, [selectedGroup, updateUserGroup, navigation, editMode]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={colors.gradientAuthLight} style={styles.gradientBackground}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
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
            <View style={styles.header}>
              {editMode && (
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.authText} />
                </TouchableOpacity>
              )}
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.headerIconGradient}
                >
                  <Ionicons name="school-outline" size={48} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={styles.title}>
                {editMode ? 'Change your stream' : 'Choose your subject combination'}
              </Text>
              <Text style={styles.subtitle}>
                {editMode 
                  ? 'Select a new stream to update your profile'
                  : 'Select your group to personalize your learning experience'}
              </Text>
            </View>

            <View style={styles.groupsContainer}>
              {GROUP_OPTIONS.map((option, index) => {
                const isSelected = selectedGroup === option.value;
                return (
                  <Animated.View
                    key={option.value}
                    style={{
                      opacity: fadeAnim,
                      transform: [
                        {
                          translateY: slideAnim.interpolate({
                            inputRange: [0, 50],
                            outputRange: [0, 20 + index * 10],
                          }),
                        },
                      ],
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedGroup(option.value);
                        setError(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <ModernCard
                        variant="elevated"
                        padding="lg"
                        style={[
                          styles.groupCard,
                          isSelected && styles.groupCardSelected,
                        ]}
                      >
                        <View style={styles.groupCardContent}>
                          <LinearGradient
                            colors={option.gradient as [string, string]}
                            style={styles.iconWrapper}
                          >
                            <Ionicons name={option.icon as any} size={28} color="#FFFFFF" />
                          </LinearGradient>
                          <View style={styles.groupInfo}>
                            <View style={styles.groupHeader}>
                              <Text style={styles.groupLabel}>{option.label}</Text>
                              {isSelected && (
                                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                              )}
                            </View>
                            <Text style={styles.groupDescription}>{option.description}</Text>
                            <View style={styles.subjectsContainer}>
                              {option.subjects.map((subject) => (
                                <View key={subject} style={styles.subjectChip}>
                                  <Text style={styles.subjectChipText}>{subject}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        </View>
                      </ModernCard>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleSelectGroup}
              disabled={!selectedGroup || loading}
              style={[
                styles.submitButton,
                (!selectedGroup || loading) && styles.submitButtonDisabled,
              ]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  selectedGroup && !loading
                    ? colors.gradientPrimary
                    : ['#CCCCCC', '#AAAAAA']
                }
                style={styles.submitButtonGradient}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Saving...' : editMode ? 'Save Changes' : 'Continue'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.lg,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.authSurface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  headerIconGradient: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.lg,
  },
  title: {
    ...typography.h1,
    fontSize: 24,
    color: colors.authText,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.body,
    fontSize: 15,
    color: colors.authTextSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 22,
  },
  groupsContainer: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  groupCard: {
    marginBottom: 0,
    backgroundColor: colors.authSurface,
  },
  groupCardSelected: {
    borderWidth: 1,
    borderColor: colors.primary + '40',
    backgroundColor: colors.primarySoft + '15',
  },
  groupCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  groupInfo: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  groupLabel: {
    ...typography.h3,
    fontSize: 20,
    fontWeight: '600',
    color: colors.authText,
    marginBottom: 0,
  },
  groupDescription: {
    ...typography.body,
    fontSize: 14,
    color: colors.authTextSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  subjectChip: {
    backgroundColor: colors.authText,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
  },
  subjectChipText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger + '15',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  errorText: {
    ...typography.body,
    fontSize: 14,
    color: colors.danger,
    flex: 1,
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

