import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useEffect, useState } from 'react';
import {  ScrollView, StyleSheet, Text, TouchableOpacity, View, Animated, StatusBar, Alert, Platform, ActivityIndicator, AppState, AppStateStatus, Linking } from 'react-native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { openBrowserAsync } from 'expo-web-browser';
import { useAuth } from '../context/AuthContext';
import type { AppStackParamList } from '../navigation/types';
import { DISCLAIMER_TEXT, OFFICIAL_SOURCES } from '../constants/disclaimer';
import { colors, radius, spacing, typography, shadow } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
// React Native Code - Update functionality imports commented out
// import { getAppVersion, isVersionOutdated } from '../services/appVersion.service';
import { registerDeviceWithBackend, getPlayerId } from '../services/oneSignal.service';
import { getMyPaymentHistory, type PaymentHistoryItem } from '../services/payment.service';
// import UpdateRequiredModal from '../components/UpdateRequiredModal';

const GROUP_INFO: Record<string, { label: string; description: string; gradient: string[]; icon: string }> = {
  PCM: {
    label: 'PCM',
    description: 'Physics, Chemistry, Mathematics',
    gradient: ['#6366F1', '#4F46E5'],
    icon: 'calculator',
  },
  PCB: {
    label: 'PCB',
    description: 'Physics, Chemistry, Biology',
    gradient: ['#8B5CF6', '#7C3AED'],
    icon: 'flask',
  },
  PCMB: {
    label: 'PCMB',
    description: 'Physics, Chemistry, Mathematics, Biology',
    gradient: ['#10B981', '#059669'],
    icon: 'school',
  },
};

const SOCIAL_MEDIA_LINKS: Array<{ name: string; url: string; icon: string; gradient: string[] }> = [
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/@Yash_Aradhye',
    icon: 'logo-youtube',
    gradient: ['#FF0000', '#CC0000'],
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/Yash_aradhye/',
    icon: 'logo-instagram',
    gradient: ['#E4405F', '#C13584'],
  },
  {
    name: 'WhatsApp',
    url: 'https://wa.me/yournumber',
    icon: 'logo-whatsapp',
    gradient: ['#25D366', '#128C7E'],
  },
];

const CONTACT_NUMBERS: Array<{ label: string; value: string; dial: string }> = [
  { label: 'Support', value: '+91 70207 81343', dial: '+917020781343' },
  { label: 'Assistance', value: '+91 80101 40176', dial: '+918010140176' },
];

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user, logout } = useAuth();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // React Native Code - Version state variables commented out
  /* COMMENTED OUT UPDATE FUNCTIONALITY - START
  const [currentVersion, setCurrentVersion] = useState('');
  const [requiredVersion, setRequiredVersion] = useState('');
  const [requiredVersionCode, setRequiredVersionCode] = useState<number | undefined>(undefined);
  const [currentVersionCode, setCurrentVersionCode] = useState<number | undefined>(undefined);
  const [updateMessage, setUpdateMessage] = useState('');
  const [playStoreUrl, setPlayStoreUrl] = useState('');
  const [updateUrl, setUpdateUrl] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isVersionCheckLoading, setIsVersionCheckLoading] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  */
  const [notificationStatus, setNotificationStatus] = useState<'checking' | 'registered' | 'not-registered' | 'error'>('checking');
  const [isRegistering, setIsRegistering] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
  const appState = useRef(AppState.currentState);

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

    // React Native Code - Version check calls commented out
    /* COMMENTED OUT - Version check on mount
    // Check app version on mount
    checkAppVersion();
    */
    
    // Check notification device registration status
    checkNotificationStatus();
    // Load payment history
    loadPaymentHistory();

    // React Native Code - App state listener for version check commented out
    /* COMMENTED OUT - Version check on app state change
    // Listen for app state changes to recheck version when app comes to foreground
    // This is important because after Play Store update, user returns to app
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('📱 [PROFILE VERSION CHECK] App came to foreground, rechecking version...');
        // Recheck version when app comes to foreground
        // This ensures that if user updates the app via Play Store and reopens, the check will run again
        checkAppVersion();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
    */
  }, []);

  const checkNotificationStatus = async () => {
    try {
      setNotificationStatus('checking');
      const currentPlayerId = await getPlayerId();
      setPlayerId(currentPlayerId);
      
      if (currentPlayerId) {
        // If we have a player ID, try to register/verify with backend
        // This will update the backend if the player ID changed, or confirm if it's the same
        const success = await registerDeviceWithBackend();
        setNotificationStatus(success ? 'registered' : 'not-registered');
      } else {
        // No player ID means OneSignal isn't initialized or requires native build
        setNotificationStatus('not-registered');
      }
    } catch (error) {
      console.error('Error checking notification status:', error);
      // If OneSignal isn't available (e.g., Expo Go), set to not-registered instead of error
      if (error instanceof Error && (error.message.includes('native') || error.message.includes('Expo'))) {
        setNotificationStatus('not-registered');
      } else {
        setNotificationStatus('error');
      }
    }
  };

  const handleRegisterDevice = async () => {
    try {
      setIsRegistering(true);
      const success = await registerDeviceWithBackend();
      
      if (success) {
        setNotificationStatus('registered');
        Alert.alert(
          'Success',
          'Your device has been registered for push notifications!',
          [{ text: 'OK' }]
        );
        // Recheck status to get updated player ID
        await checkNotificationStatus();
      } else {
        setNotificationStatus('not-registered');
        Alert.alert(
          'Registration Failed',
          Platform.OS === 'web' 
            ? 'Push notifications are not available on web. Please use the mobile app.'
            : 'Unable to register device. Make sure you are using a native build (not Expo Go). OneSignal requires native code to work.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error registering device:', error);
      setNotificationStatus('error');
      Alert.alert(
        'Error',
        'Failed to register device. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRegistering(false);
    }
  };

  // React Native Code - checkAppVersion function with API calls commented out
  /* COMMENTED OUT - Version check functionality
  const checkAppVersion = async () => {
    try {
      setIsVersionCheckLoading(true);
      
      // Get current app version
      const currentVer = Constants.expoConfig?.version || '1.0.0';
      const currentVerCode = Platform.OS === 'android' 
        ? Constants.expoConfig?.android?.versionCode 
        : undefined;
      
      console.log('📱 [PROFILE VERSION CHECK] Current app version:', currentVer);
      console.log('📱 [PROFILE VERSION CHECK] Current versionCode:', currentVerCode);
      
      setCurrentVersion(currentVer);
      setCurrentVersionCode(currentVerCode);

      // Fetch required version from backend
      const versionResponse = await getAppVersion();
      
      if (versionResponse.success && versionResponse.data.isUpdateRequired) {
        const { requiredVersion: reqVersion, requiredVersionCode, updateMessage: msg, playStoreUrl: url, updateUrl: update } = versionResponse.data;
        
        console.log('📱 [PROFILE VERSION CHECK] Required version:', reqVersion);
        console.log('📱 [PROFILE VERSION CHECK] Required versionCode:', requiredVersionCode);
        
        setRequiredVersion(reqVersion);
        setRequiredVersionCode(requiredVersionCode);
        setUpdateMessage(msg || 'A new version of the app is available. Please update to continue.');
        setPlayStoreUrl(url || '');
        setUpdateUrl(update || '');

        // Check if update is needed
        // This function returns true only if current version is LESS than required version
        // If current >= required, it returns false (no update needed)
        const needsUpdate = isVersionOutdated(currentVer, reqVersion, currentVerCode, requiredVersionCode);
        
        console.log('📱 [PROFILE VERSION CHECK] Update needed?', needsUpdate);
        console.log('📱 [PROFILE VERSION CHECK] Version comparison:', {
          currentVersion: currentVer,
          currentVersionCode,
          requiredVersion: reqVersion,
          requiredVersionCode,
          isOutdated: needsUpdate
        });
        
        setIsUpdateAvailable(needsUpdate);
      } else {
        console.log('📱 [PROFILE VERSION CHECK] No update required (isUpdateRequired is false)');
        setIsUpdateAvailable(false);
        // Clear version info if no update required
        setRequiredVersion('');
        setRequiredVersionCode(undefined);
        setUpdateMessage('');
        setPlayStoreUrl('');
        setUpdateUrl('');
      }
    } catch (error) {
      console.error('❌ [PROFILE VERSION CHECK] Failed to check app version:', error);
      setIsUpdateAvailable(false);
    } finally {
      setIsVersionCheckLoading(false);
    }
  };

  const handleUpdateClick = () => {
    // Show the update modal with all necessary info
    setShowUpdateModal(true);
  };

  const handleUpdateComplete = () => {
    setShowUpdateModal(false);
    // Recheck version after update
    setTimeout(() => {
      checkAppVersion();
    }, 1000);
  };
  COMMENTED OUT - Version check functionality - END */

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ],
      { cancelable: true }
    );
  }, [logout]);

  const handleSocialMediaPress = useCallback(async (url: string) => {
    try {
      await openBrowserAsync(url);
    } catch (error) {
      console.error('Error opening social media link:', error);
    }
  }, []);

  const handleContactPress = useCallback(async (phone: string) => {
    try {
      const url = `tel:${phone}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unavailable', 'Calling is not supported on this device.');
      }
    } catch (error) {
      console.error('Error opening dialer:', error);
      Alert.alert('Error', 'Unable to open the dialer right now.');
    }
  }, []);

  const handleEditStream = useCallback(() => {
    navigation.navigate('GroupSelection', { editMode: true });
  }, [navigation]);

  const loadPaymentHistory = useCallback(async () => {
    try {
      setPaymentHistoryLoading(true);
      const data = await getMyPaymentHistory({ limit: 20 });
      setPaymentHistory(data.history || []);
    } catch (e) {
      setPaymentHistory([]);
    } finally {
      setPaymentHistoryLoading(false);
    }
  }, []);

  const groupInfo = user?.group ? GROUP_INFO[user.group] : null;

  const selectedStreamLabel = groupInfo?.label ?? 'Select your stream';
  const selectedStreamDescription = groupInfo?.description ?? 'PCM / PCB / PCMB';
  const hasAvatar = !!user?.avatarUrl;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
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
                <Text style={styles.headerTitle}>Profile</Text>
                <Text style={styles.headerSubtitle}>Manage your account</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

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
            {/* Main profile card */}
            <View style={styles.profilePanel}>
              {/* Avatar Section */}
              <View style={styles.avatarSection}>
                {hasAvatar ? (
                  <View style={styles.avatarOuter}>
                    <Image
                      source={{ uri: user?.avatarUrl ?? undefined }}
                      style={styles.avatarImage}
                      contentFit="cover"
                    />
                  </View>
                ) : (
                  <View style={styles.avatarOuter}>
                    <LinearGradient
                      colors={colors.gradientPrimary as [string, string, ...string[]]}
                      style={styles.avatarPlaceholder}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="person" size={48} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                )}
                <View style={styles.nameSection}>
                  <Text style={styles.panelNameText}>{user?.fullName || 'User'}</Text>
                  <Text style={styles.panelEmailText}>{user?.email || 'user@example.com'}</Text>
                </View>
              </View>

              {/* Info Section */}
              <View style={styles.infoSection}>
                {/* Stream row (PCM / PCB / PCMB) */}
                <TouchableOpacity
                  onPress={handleEditStream}
                  activeOpacity={0.8}
                  style={styles.infoCard}
                >
                  <View style={styles.infoCardHeader}>
                    <LinearGradient
                      colors={colors.gradientPrimary as [string, string, ...string[]]}
                      style={styles.infoIconContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="school" size={20} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={styles.infoCardContent}>
                      <Text style={styles.infoCardLabel}>Stream</Text>
                      <Text style={styles.infoCardValue}>{selectedStreamLabel}</Text>
                      <Text style={styles.infoCardSubtext}>{selectedStreamDescription}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleEditStream}
                      activeOpacity={0.8}
                      style={styles.editIconButton}
                    >
                      <Ionicons name="pencil" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {/* Subscription row */}
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <LinearGradient
                      colors={user?.subscription === 'premium' ? colors.gradientGold as [string, string, ...string[]] : ['#94A3B8', '#64748B'] as [string, string, ...string[]]}
                      style={styles.infoIconContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name={user?.subscription === 'premium' ? 'diamond' : 'diamond-outline'} size={20} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={styles.infoCardContent}>
                      <Text style={styles.infoCardLabel}>Subscription</Text>
                      <Text style={styles.infoCardValue}>
                        {user?.subscription === 'premium' ? 'Premium Member' : 'Free Plan'}
                      </Text>
                      {user?.subscription !== 'premium' && (
                        <TouchableOpacity
                          onPress={() => navigation.navigate('PremiumPurchase')}
                          activeOpacity={0.8}
                          style={styles.premiumButton}
                        >
                          <Text style={styles.premiumButtonText}>Upgrade Now</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>

                {/* Payment history row */}
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <LinearGradient
                      colors={colors.gradientGold as [string, string, ...string[]]}
                      style={styles.infoIconContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="card" size={20} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={styles.infoCardContent}>
                      <Text style={styles.infoCardLabel}>Payment history</Text>
                      {paymentHistoryLoading ? (
                        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 4 }} />
                      ) : paymentHistory.length === 0 ? (
                        <Text style={styles.infoCardSubtext}>No payments yet</Text>
                      ) : (
                        <View style={styles.paymentHistoryList}>
                          {paymentHistory.slice(0, 5).map((item) => (
                            <View key={item._id} style={styles.paymentHistoryItem}>
                              <Text style={styles.paymentHistoryDate}>
                                {new Date(item.createdAt).toLocaleDateString()}
                              </Text>
                              <Text style={styles.paymentHistoryAmount}>
                                ₹{item.amount != null ? (item.amount / 100).toFixed(0) : '—'} • {item.planId || 'Premium'}
                              </Text>
                            </View>
                          ))}
                          {paymentHistory.length > 5 && (
                            <Text style={styles.paymentHistoryMore}>
                              +{paymentHistory.length - 5} more
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Saved questions row */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('SavedQuestions')}
                  activeOpacity={0.8}
                  style={styles.infoCard}
                >
                  <View style={styles.infoCardHeader}>
                    <LinearGradient
                      colors={colors.gradientAccent as [string, string, ...string[]]}
                      style={styles.infoIconContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="bookmark" size={20} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={styles.infoCardContent}>
                      <Text style={styles.infoCardLabel}>Saved Questions</Text>
                      <Text style={styles.infoCardSubtext}>View your bookmarked questions</Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.authTextMuted}
                    />
                  </View>
                </TouchableOpacity>

                {/* Privacy Policy */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('Privacy')}
                  activeOpacity={0.8}
                  style={styles.infoCard}
                >
                  <View style={styles.infoCardHeader}>
                    <LinearGradient
                      colors={['#0EA5E9', '#0284C7'] as [string, string, ...string[]]}
                      style={styles.infoIconContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={styles.infoCardContent}>
                      <Text style={styles.infoCardLabel}>Privacy Policy</Text>
                      <Text style={styles.infoCardSubtext}>How we collect and use your data</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.authTextMuted} />
                  </View>
                </TouchableOpacity>

                {/* React Native Code - App Version row with update functionality commented out */}
                {/* COMMENTED OUT - App Version card with update button
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <LinearGradient
                      colors={isUpdateAvailable ? ['#F59E0B', '#D97706'] : colors.gradientPrimary as [string, string, ...string[]]}
                      style={styles.infoIconContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name={isUpdateAvailable ? 'arrow-up-circle' : 'information-circle'} size={20} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={styles.infoCardContent}>
                      <Text style={styles.infoCardLabel}>App Version</Text>
                      {isVersionCheckLoading ? (
                        <View style={styles.versionLoadingContainer}>
                          <ActivityIndicator size="small" color={colors.primary} />
                          <Text style={styles.infoCardSubtext}>Checking version...</Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.infoCardValue}>Current: {currentVersion || '1.0.0'}</Text>
                          {requiredVersion && (
                            <Text style={[styles.infoCardSubtext, isUpdateAvailable && styles.updateAvailableText]}>
                              Required: {requiredVersion}
                            </Text>
                          )}
                          {isUpdateAvailable && (
                            <TouchableOpacity
                              onPress={handleUpdateClick}
                              activeOpacity={0.8}
                              style={styles.updateButtonInCard}
                            >
                              <LinearGradient
                                colors={['#F59E0B', '#D97706']}
                                style={styles.updateButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                              >
                                <Ionicons name="arrow-down-circle" size={16} color="#FFFFFF" />
                                <Text style={styles.updateButtonTextInCard}>Update Available</Text>
                              </LinearGradient>
                            </TouchableOpacity>
                          )}
                          {!isUpdateAvailable && !isVersionCheckLoading && requiredVersion && currentVersion === requiredVersion && (
                            <Text style={[styles.infoCardSubtext, styles.versionUpToDateText]}>
                              ✓ You're on the latest version
                            </Text>
                          )}
                        </>
                      )}
                    </View>
                  </View>
                </View>
                */}

                {/* Contact us row */}
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <LinearGradient
                      colors={colors.gradientPrimary as [string, string, ...string[]]}
                      style={styles.infoIconContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="call" size={20} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={styles.infoCardContent}>
                      <Text style={styles.infoCardLabel}>Contact us</Text>
                      <Text style={styles.infoCardSubtext}>Reach our support team directly</Text>
                      <Text style={styles.contactAvailability}>Available Mon–Sat • 10:00 AM – 6:00 PM</Text>
                      <View style={styles.contactList}>
                        {CONTACT_NUMBERS.map((item) => (
                          <TouchableOpacity
                            key={item.dial}
                            onPress={() => handleContactPress(item.dial)}
                            activeOpacity={0.8}
                            style={styles.contactItem}
                          >
                            <View style={styles.contactTextWrap}>
                              <Text style={styles.contactLabel}>{item.label}</Text>
                              <Text style={styles.contactNumber}>{item.value}</Text>
                            </View>
                            <Ionicons name="call-outline" size={18} color={colors.primary} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>

                {/* Official sources & disclaimer - Misleading Claims policy compliance */}
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <LinearGradient
                      colors={['#4338CA', '#6366F1'] as [string, string, ...string[]]}
                      style={styles.infoIconContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={styles.infoCardContent}>
                      <Text style={styles.infoCardLabel}>Official sources & disclaimer</Text>
                      <Text style={styles.disclaimerFullText}>{DISCLAIMER_TEXT}</Text>
                      <Text style={styles.officialSourcesLabel}>Official government/official sources:</Text>
                      {OFFICIAL_SOURCES.map((source) => (
                        <TouchableOpacity
                          key={source.url}
                          onPress={() => openBrowserAsync(source.url)}
                          activeOpacity={0.8}
                          style={styles.officialSourceLink}
                        >
                          <Ionicons name="open-outline" size={16} color={colors.primary} />
                          <View style={styles.officialSourceLinkTextWrap}>
                            <Text style={styles.officialSourceLinkTitle}>{source.name}</Text>
                            {source.description ? (
                              <Text style={styles.officialSourceLinkDesc}>{source.description}</Text>
                            ) : null}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Social media row */}
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <LinearGradient
                      colors={colors.gradientPrimary as [string, string, ...string[]]}
                      style={styles.infoIconContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="share-social" size={20} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={styles.infoCardContent}>
                      <Text style={styles.infoCardLabel}>Follow us on</Text>
                      <View style={styles.socialIconsContainer}>
                        {SOCIAL_MEDIA_LINKS.map((social) => (
                          <TouchableOpacity
                            key={social.name}
                            onPress={() => handleSocialMediaPress(social.url)}
                            activeOpacity={0.8}
                            style={styles.socialIconButton}
                          >
                            <LinearGradient
                              colors={social.gradient as [string, string, ...string[]]}
                              style={styles.socialIconContainer}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                            >
                              <Ionicons name={social.icon as any} size={20} color="#FFFFFF" />
                            </LinearGradient>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Actions Section */}
              <View style={styles.actionsSection}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
      
      {/* React Native Code - UpdateRequiredModal component commented out */}
      {/* COMMENTED OUT - Update Modal
      <UpdateRequiredModal
        visible={showUpdateModal}
        updateMessage={updateMessage}
        playStoreUrl={playStoreUrl}
        updateUrl={updateUrl}
        requiredVersion={requiredVersion}
        requiredVersionCode={requiredVersionCode}
        currentVersion={currentVersion}
        currentVersionCode={currentVersionCode}
        onUpdate={handleUpdateComplete}
      />
      */}
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
  profilePanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadow.sm,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    ...shadow.lg,
    marginBottom: spacing.md,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameSection: {
    alignItems: 'center',
  },
  panelNameText: {
    ...typography.h2,
    color: '#111827',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  panelEmailText: {
    ...typography.body,
    color: '#6B7280',
    fontSize: 14,
  },
  infoSection: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardLabel: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 12,
    marginBottom: spacing.xs / 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCardValue: {
    ...typography.subtitle,
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: spacing.xs / 2,
  },
  infoCardSubtext: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 13,
  },
  disclaimerFullText: {
    ...typography.caption,
    color: '#374151',
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  officialSourcesLabel: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  officialSourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: spacing.xs,
  },
  officialSourceLinkTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  officialSourceLinkTitle: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  officialSourceLinkDesc: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
  },
  paymentHistoryList: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  paymentHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentHistoryDate: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 12,
  },
  paymentHistoryAmount: {
    ...typography.caption,
    color: colors.authText,
    fontSize: 12,
    fontWeight: '600',
  },
  paymentHistoryMore: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  premiumButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
  },
  premiumButtonText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  registerDeviceButton: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  registerDeviceButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  registerDeviceButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  registerDeviceButtonText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  refreshButton: {
    padding: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  notificationRegistered: {
    color: colors.success,
    fontWeight: '700',
  },
  notificationRegisteredSubtext: {
    color: colors.success,
    fontSize: 12,
  },
  actionsSection: {
    marginTop: spacing.md,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingVertical: spacing.md,
    backgroundColor: '#FEF2F2',
  },
  logoutButtonText: {
    ...typography.subtitle,
    color: colors.danger,
    fontWeight: '700',
    fontSize: 15,
  },
  socialIconsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  contactList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  contactAvailability: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 12,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactTextWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.sm,
  },
  contactLabel: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  contactNumber: {
    ...typography.body,
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  socialIconButton: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  socialIconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  editIconButton: {
    padding: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  versionLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  updateAvailableText: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  versionUpToDateText: {
    color: '#10B981',
    fontWeight: '600',
    marginTop: spacing.xs / 2,
  },
  updateButtonInCard: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  updateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  updateButtonTextInCard: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
