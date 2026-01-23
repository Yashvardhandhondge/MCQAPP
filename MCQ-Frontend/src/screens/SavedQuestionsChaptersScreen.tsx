import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { AppStackParamList } from '../navigation/types';
import { getSavedQuestionsByChapters } from '../services/mcq.service';
import type { SavedQuestionsByChapter } from '../types/mcq';
import { colors, radius, spacing, typography, shadow } from '../theme';
import ModernCard from '../components/ui/ModernCard';
import BackHeader from '../components/ui/BackHeader';
import { safeGoBack } from '../utils/navigation';

export type SavedQuestionsChaptersScreenProps = NativeStackScreenProps<AppStackParamList, 'SavedQuestionsChapters'>;

export default function SavedQuestionsChaptersScreen({ route, navigation }: SavedQuestionsChaptersScreenProps) {
  const { subject } = route.params;
  const [chapters, setChapters] = useState<SavedQuestionsByChapter[]>([]);
  const [loading, setLoading] = useState(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
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

  useEffect(() => {
    loadChapters();
  }, [subject]);

  const loadChapters = async () => {
    try {
      setLoading(true);
      const response = await getSavedQuestionsByChapters(subject);
      setChapters(response.data);
    } catch (error) {
      console.error('Failed to load saved questions by chapters:', error);
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChapterPress = (chapter: string) => {
    navigation.navigate('SavedQuestionsList', { subject, chapter });
  };

  const totalQuestions = chapters.reduce((sum, c) => sum + c.questionCount, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={colors.gradientAuthLight as [string, string, ...string[]]}
        style={styles.backgroundGradient}
      >
        <BackHeader
          title={subject}
          subtitle={totalQuestions > 0 ? `${totalQuestions} saved question${totalQuestions === 1 ? '' : 's'}` : 'No saved questions'}
          navigation={navigation}
        />
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.stateCard}>
              <Animated.View style={{ opacity: fadeAnim }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.stateText}>Loading chapters...</Text>
              </Animated.View>
            </View>
          ) : chapters.length === 0 ? (
            <View style={styles.stateCard}>
              <Animated.View style={{ opacity: fadeAnim }}>
                <Ionicons name="folder-outline" size={48} color={colors.authTextMuted} />
                <Text style={styles.emptyText}>No saved questions</Text>
                <Text style={styles.emptySubtext}>
                  No saved questions found for this subject
                </Text>
              </Animated.View>
            </View>
          ) : (
            <View style={styles.chaptersList}>
              {chapters.map((chapterData, index) => (
                <Animated.View
                  key={chapterData.chapter}
                  style={{
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 30],
                          outputRange: [0, 30 + index * 10],
                        }),
                      },
                    ],
                  }}
                >
                  <TouchableOpacity
                    onPress={() => handleChapterPress(chapterData.chapter)}
                    activeOpacity={0.8}
                  >
                    <ModernCard
                      variant="elevated"
                      padding="lg"
                      style={styles.chapterCard}
                    >
                      <View style={styles.chapterContent}>
                        <View style={styles.chapterIconContainer}>
                          <Ionicons name="folder" size={28} color={colors.primary} />
                        </View>
                        <View style={styles.chapterTextContainer}>
                          <Text style={styles.chapterName} numberOfLines={2}>
                            {chapterData.chapter}
                          </Text>
                          <Text style={styles.chapterCount}>
                            {chapterData.questionCount} {chapterData.questionCount === 1 ? 'question' : 'questions'}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={colors.authTextMuted} />
                      </View>
                    </ModernCard>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.authBackground,
  },
  backgroundGradient: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: 100,
  },
  chaptersList: {
    gap: spacing.md,
  },
  chapterCard: {
    marginBottom: spacing.sm,
    borderRadius: radius.xl + 2,
    backgroundColor: colors.authSurface,
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  chapterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  chapterIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterTextContainer: {
    flex: 1,
  },
  chapterName: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '600',
    fontSize: 18,
    marginBottom: spacing.xs / 2,
  },
  chapterCount: {
    ...typography.body,
    color: colors.authTextMuted,
    fontSize: 14,
  },
  stateCard: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.xl + 4,
    padding: spacing.xxxl,
    alignItems: 'center',
    marginTop: spacing.xl,
    ...shadow.lg,
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  stateText: {
    ...typography.body,
    color: colors.authTextMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.h3,
    color: colors.authText,
    marginTop: spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    ...typography.body,
    color: colors.authTextMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

