import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useRef, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Animated, StatusBar, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { openBrowserAsync } from 'expo-web-browser';
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

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  // Get YouTube thumbnail URL
  const getYouTubeThumbnail = (videoId: string): string => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  // Check if URL is a YouTube URL
  const isYouTubeUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    return /(?:youtube\.com|youtu\.be)/.test(url);
  };

  // Handle URL press
  const handleUrlPress = async (url: string) => {
    try {
      await openBrowserAsync(url);
    } catch (error) {
      console.error('Error opening URL:', error);
    }
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
                {/* Simple Gradient Top Bar */}
                <LinearGradient
                  colors={colors.gradientPrimary as [string, string]}
                  style={styles.topBar}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />

                {/* Content */}
                <View style={styles.contentContainer}>
                  {/* Title */}
                  <Text style={styles.notificationTitle}>{notification.title}</Text>

                  {/* Timestamp */}
                  <View style={styles.timestampContainer}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.timestampText}>{formatDate(notification.createdAt)}</Text>
                  </View>

                  {/* Simple Divider */}
                  <View style={styles.divider} />

                  {/* Message */}
                  <Text style={styles.notificationMessage}>{notification.message}</Text>

                  {/* YouTube Video Thumbnail */}
                  {notification.url && isYouTubeUrl(notification.url) && (() => {
                    const videoId = getYouTubeVideoId(notification.url!);
                    return videoId ? (
                      <TouchableOpacity
                        style={styles.videoContainer}
                        onPress={() => handleUrlPress(notification.url!)}
                        activeOpacity={0.9}
                      >
                        <Image
                          source={{ uri: getYouTubeThumbnail(videoId) }}
                          style={styles.videoThumbnail}
                          contentFit="cover"
                          transition={200}
                        />
                        <View style={styles.videoOverlay}>
                          <LinearGradient
                            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)']}
                            style={styles.videoGradient}
                          >
                            <View style={styles.playButtonContainer}>
                              <View style={styles.playButton}>
                                <Ionicons name="play" size={32} color="#FFFFFF" />
                              </View>
                              <Text style={styles.watchVideoText}>Watch Video</Text>
                            </View>
                          </LinearGradient>
                        </View>
                      </TouchableOpacity>
                    ) : null;
                  })()}

                  {/* Generic URL Link (if not YouTube) */}
                  {notification.url && !isYouTubeUrl(notification.url) && (
                    <TouchableOpacity
                      style={styles.urlLinkContainer}
                      onPress={() => handleUrlPress(notification.url!)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={colors.gradientPrimary as [string, string]}
                        style={styles.urlLinkGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons name="link" size={20} color="#FFFFFF" />
                        <Text style={styles.urlLinkText}>Open Link</Text>
                        <Ionicons name="open-outline" size={18} color="#FFFFFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  {/* Footer Info */}
                  <View style={styles.footer}>
                    {/* Target Audience */}
                    <View style={[styles.badge, notification.targetAudience === 'premium' && styles.badgePremium]}>
                      <Ionicons
                        name={notification.targetAudience === 'premium' ? 'diamond' : notification.targetAudience === 'non-premium' ? 'people-outline' : 'globe-outline'}
                        size={12}
                        color={notification.targetAudience === 'premium' ? '#F59E0B' : '#6B7280'}
                      />
                      <Text style={[styles.badgeText, notification.targetAudience === 'premium' && styles.badgeTextPremium]}>
                        {notification.targetAudience === 'premium' ? 'Premium' : notification.targetAudience === 'non-premium' ? 'Non-Premium' : 'All Users'}
                      </Text>
                    </View>

                    {/* Read Status */}
                    {notification.isRead ? (
                      <View style={styles.statusBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                        <Text style={styles.statusText}>Read</Text>
                      </View>
                    ) : (
                      <View style={styles.statusBadge}>
                        <View style={styles.unreadIndicator} />
                        <Text style={styles.statusTextUnread}>New</Text>
                      </View>
                    )}
                  </View>
                </View>
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
    marginTop: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadow.md,
  },
  topBar: {
    width: '100%',
    height: 4,
  },
  contentContainer: {
    padding: spacing.xl,
  },
  notificationTitle: {
    ...typography.h2,
    color: '#111827',
    fontWeight: '700',
    fontSize: 22,
    marginBottom: spacing.sm,
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
    fontSize: 15,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
  },
  badgePremium: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    ...typography.caption,
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 12,
  },
  badgeTextPremium: {
    color: '#92400E',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    fontSize: 12,
  },
  statusTextUnread: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  videoContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000000',
    ...shadow.md,
  },
  videoThumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#E5E7EB',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.lg,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  watchVideoText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  urlLinkContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },
  urlLinkGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  urlLinkText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
