import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useRef, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Animated, StatusBar, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { AppStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography, shadow } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getNotifications, markNotificationAsRead, type Notification } from '../services/notification.service';

type NotificationDetailRouteProp = RouteProp<AppStackParamList, 'NotificationDetail'>;

export default function NotificationDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<NotificationDetailRouteProp>();
  const { notificationId } = route.params;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // State
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Fetch notification details
    fetchNotification();
  }, [notificationId]);

  const fetchNotification = async () => {
    try {
      setError(null);
      const response = await getNotifications();
      if (response.success) {
        const foundNotification = response.data.notifications.find((n) => n._id === notificationId);
        if (foundNotification) {
          setNotification(foundNotification);

          // Mark as read if not already read
          if (!foundNotification.isRead) {
            try {
              await markNotificationAsRead(notificationId);
              setNotification({ ...foundNotification, isRead: true });
            } catch (err) {
              console.error('Error marking notification as read:', err);
            }
          }
        } else {
          setError('Notification not found');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notification');
      console.error('Error fetching notification:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.backgroundGradient}>
        {/* Sticky Header */}
        <View style={styles.stickyHeader}>
          <LinearGradient
            colors={['#FFFFFF', '#F9FAFB']}
            style={styles.stickyHeaderGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.headerBackButton}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={22} color={colors.primary} />
              </TouchableOpacity>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Notification</Text>
                <Text style={styles.headerSubtitle}>Details</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading notification...</Text>
          </View>
        ) : error || !notification ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
            <Text style={styles.errorText}>{error || 'Notification not found'}</Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.retryButton}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              {/* Notification Card */}
              <View style={styles.notificationPanel}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                  <LinearGradient
                    colors={colors.gradientPrimary as [string, string]}
                    style={styles.iconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="notifications" size={32} color="#FFFFFF" />
                  </LinearGradient>
                </View>

                {/* Title */}
                <Text style={styles.notificationTitle}>{notification.title}</Text>

                {/* Timestamp */}
                <View style={styles.timestampContainer}>
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <Text style={styles.timestampText}>{formatDate(notification.createdAt)}</Text>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Message */}
                <Text style={styles.notificationMessage}>{notification.message}</Text>

                {/* Target Audience Badge */}
                <View style={styles.badgeContainer}>
                  <View style={[styles.badge, notification.targetAudience === 'premium' && styles.badgePremium]}>
                    <Ionicons
                      name={notification.targetAudience === 'premium' ? 'diamond' : notification.targetAudience === 'non-premium' ? 'people-outline' : 'globe-outline'}
                      size={12}
                      color={notification.targetAudience === 'premium' ? '#F59E0B' : '#6B7280'}
                    />
                    <Text style={[styles.badgeText, notification.targetAudience === 'premium' && styles.badgeTextPremium]}>
                      {notification.targetAudience === 'premium' ? 'Premium Users' : notification.targetAudience === 'non-premium' ? 'Non-Premium Users' : 'All Users'}
                    </Text>
                  </View>
                </View>

                {/* Read Status */}
                {notification.isRead ? (
                  <View style={styles.readStatusContainer}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.readStatusText}>Read</Text>
                  </View>
                ) : (
                  <View style={styles.readStatusContainer}>
                    <View style={styles.unreadIndicator} />
                    <Text style={styles.unreadStatusText}>Unread</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3E8FF',
  },
  backgroundGradient: {
    flex: 1,
    backgroundColor: '#F3E8FF',
  },
  stickyHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...shadow.sm,
  },
  stickyHeaderGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    color: '#111827',
    fontWeight: '700',
    fontSize: 24,
    marginBottom: spacing.xs / 2,
  },
  headerSubtitle: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 13,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  retryButtonText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  notificationPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadow.sm,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadow.md,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationTitle: {
    ...typography.h2,
    color: '#111827',
    fontWeight: '700',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  timestampText: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 13,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: spacing.lg,
  },
  notificationMessage: {
    ...typography.body,
    color: '#374151',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
    width: '100%',
    marginBottom: spacing.lg,
  },
  badgeContainer: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  badgePremium: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  badgeText: {
    ...typography.caption,
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  badgeTextPremium: {
    color: '#92400E',
  },
  readStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  readStatusText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    fontSize: 13,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  unreadStatusText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
});
