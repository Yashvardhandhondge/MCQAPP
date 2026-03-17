import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Platform,
} from 'react-native';
import { colors, typography } from '../theme';

/* ============================================
 * UPDATE FUNCTIONALITY TEMPORARILY DISABLED
 * This update facility is commented out for launch.
 * Will be re-enabled after launch.
 * ============================================ */

// import React, { useState } from 'react';
// import {
//   Modal,
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Platform,
//   Linking,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import Constants from 'expo-constants';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { colors, typography } from '../theme';
// import { initiateAppUpdate, updateDownloadStatus } from '../services/appUpdateInitiation.service';

// const UPDATE_INITIATED_KEY = '@update_initiated';
// const UPDATE_VERSION_KEY = '@update_version';

// // Try to import expo-updates if available (optional dependency)
// let Updates: any = null;
// try {
//   Updates = require('expo-updates');
// } catch (e) {
//   console.log('expo-updates not available');
// }

// // Try to import expo-file-system for file downloads
// let FileSystem: any = null;
// try {
//   FileSystem = require('expo-file-system');
// } catch (e) {
//   console.log('expo-file-system not available');
// }

interface UpdateRequiredModalProps {
  visible: boolean;
  updateMessage: string;
  playStoreUrl?: string;
  updateUrl?: string;
  requiredVersion?: string;
  requiredVersionCode?: number;
  currentVersion?: string;
  currentVersionCode?: number;
  onUpdate: () => void;
}

export default function UpdateRequiredModal({
  visible,
  updateMessage,
  playStoreUrl,
  updateUrl,
  requiredVersion,
  requiredVersionCode,
  currentVersion,
  currentVersionCode,
  onUpdate,
}: UpdateRequiredModalProps) {
  const [updating, setUpdating] = React.useState(false);

  const handleUpdatePress = async () => {
    setUpdating(true);
    try {
      const targetUrl = updateUrl || playStoreUrl;
      if (targetUrl && targetUrl.trim()) {
        const canOpen = await Linking.canOpenURL(targetUrl);
        if (canOpen) {
          await Linking.openURL(targetUrl);
        }
      } else if (Platform.OS === 'android') {
        // Fallback to market URL if no explicit URL provided
        const marketUrl = 'market://details?id=com.mcqfrontend.app';
        try {
          const canOpenMarket = await Linking.canOpenURL(marketUrl);
          if (canOpenMarket) {
            await Linking.openURL(marketUrl);
          }
        } catch {
          // ignore, we still keep the modal open
        }
      }
      onUpdate();
    } catch {
      // keep modal open on error
    } finally {
      setUpdating(false);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        // Block dismiss via back button; user must update
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Update Required</Text>
            <Text style={styles.message}>{updateMessage}</Text>
            {requiredVersion ? (
              <Text style={styles.versionText}>
                Required version code: {requiredVersionCode ?? '—'}
              </Text>
            ) : null}
            {currentVersion ? (
              <Text style={styles.versionText}>
                Current version code: {currentVersionCode ?? '—'}
              </Text>
            ) : null}
            <TouchableOpacity
              style={[styles.updateButton, updating && styles.updateButtonDisabled]}
              onPress={handleUpdatePress}
              activeOpacity={0.8}
              disabled={updating}
            >
              {updating ? (
                <View style={styles.downloadingContainer}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                </View>
              ) : (
                <Text style={styles.updateButtonText}>Update Now</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  /* COMMENTED OUT UPDATE FUNCTIONALITY - START
  const [updating, setUpdating] = useState(false);
  const [localVisible, setLocalVisible] = useState(visible);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Sync local visible state with prop
  React.useEffect(() => {
    setLocalVisible(visible);
  }, [visible]);

  // React Native Code - handleUpdate function with all API calls commented out
  const handleUpdate = async () => {
    setUpdating(true);
    
    try {
      // Get device info
      const deviceInfo = {
        platform: Platform.OS,
        osVersion: Platform.Version?.toString(),
        deviceModel: Constants.deviceName || Constants.expoConfig?.name || 'Unknown',
      };

      // 1. Save update initiation to database FIRST
      let initiationId: string | null = null;
      try {
        if (requiredVersion && currentVersion) {
          const initiationResponse = await initiateAppUpdate({
            requiredVersion,
            requiredVersionCode: requiredVersionCode || 1,
            currentVersion: currentVersion || '1.0.0',
            currentVersionCode: currentVersionCode,
            updateUrl: updateUrl || '',
            playStoreUrl: playStoreUrl || '',
            deviceInfo,
          });
          initiationId = initiationResponse.data.initiationId;
          console.log('✅ [UPDATE] Update initiation saved to database:', initiationId);
        }
      } catch (dbError) {
        console.error('❌ [UPDATE] Failed to save to database:', dbError);
        // Continue with download even if DB save fails
      }

      // 2. Mark update as initiated in AsyncStorage to prevent modal from showing again
      if (requiredVersion) {
        await AsyncStorage.setItem(UPDATE_INITIATED_KEY, 'true');
        await AsyncStorage.setItem(UPDATE_VERSION_KEY, requiredVersion);
        console.log('📱 [UPDATE] Marked update as initiated for version:', requiredVersion);
      }

      // 3. Close modal immediately after saving to DB
      setLocalVisible(false);
      onUpdate();

      // 4. Start the download/update process
      let updateSuccess = false;

      // Priority 1: Use updateUrl for in-app updates (if provided)
      if (updateUrl && updateUrl.trim()) {
        console.log('📱 [UPDATE] Starting download from URL:', updateUrl);
        
        // Update status to downloading
        if (initiationId) {
          try {
            await updateDownloadStatus(initiationId, 'downloading');
          } catch (e) {
            console.error('Failed to update download status:', e);
          }
        }

        // Try to use expo-updates for OTA update if available
        if (Updates && Updates.isEnabled) {
          try {
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
              await Updates.fetchUpdateAsync();
              if (initiationId) {
                await updateDownloadStatus(initiationId, 'downloaded');
              }
              Alert.alert(
                'Update Downloaded',
                'The update has been downloaded. The app will restart to apply the update.',
                [{ 
                  text: 'OK',
                  onPress: async () => {
                    await Updates.reloadAsync();
                  }
                }]
              );
              updateSuccess = true;
            }
          } catch (updateError) {
            console.log('📱 [UPDATE] Expo Updates not available, trying direct download:', updateError);
          }
        }

        // If OTA update didn't work, try file download
        if (!updateSuccess) {
          // Try to download file directly if expo-file-system is available
          if (FileSystem && FileSystem.createDownloadResumable && FileSystem.documentDirectory) {
            try {
              console.log('📱 [UPDATE] Downloading file using expo-file-system...');
              const fileName = `mcqapp-update-${requiredVersion || 'latest'}.apk`;
              const fileUri = `${FileSystem.documentDirectory}${fileName}`;
              
              const downloadResumable = FileSystem.createDownloadResumable(
                updateUrl,
                fileUri,
                {},
                (downloadProgress) => {
                  if (downloadProgress.totalBytesExpectedToWrite > 0) {
                    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                    setDownloadProgress(progress);
                    console.log(`📱 [UPDATE] Download progress: ${(progress * 100).toFixed(0)}%`);
                  }
                }
              );

              const result = await downloadResumable.downloadAsync();
              
              if (result && result.uri) {
                console.log('✅ [UPDATE] File downloaded successfully to:', result.uri);
                
                // Update status to downloaded
                if (initiationId) {
                  try {
                    await updateDownloadStatus(initiationId, 'downloaded');
                  } catch (e) {
                    console.error('Failed to update download status:', e);
                  }
                }

                // Open the downloaded file for installation (Android)
                if (Platform.OS === 'android') {
                  try {
                    await Linking.openURL(result.uri);
                    Alert.alert(
                      'Download Complete',
                      'The update has been downloaded. Please install it when prompted.',
                      [{ text: 'OK' }]
                    );
                  } catch (openError) {
                    console.error('Error opening downloaded file:', openError);
                    Alert.alert(
                      'Download Complete',
                      'The update has been downloaded. Please check your Downloads folder and install it manually.',
                      [{ text: 'OK' }]
                    );
                  }
                }
                updateSuccess = true;
              }
            } catch (fileError) {
              console.error('❌ [UPDATE] File download failed, trying URL method:', fileError);
            }
          }

          // Fallback: Use Linking.openURL - Android will handle APK downloads automatically
          if (!updateSuccess) {
            try {
              const canOpen = await Linking.canOpenURL(updateUrl);
              if (canOpen) {
                await Linking.openURL(updateUrl);
                console.log('✅ [UPDATE] Download URL opened. Android will handle the download automatically.');
                
                // Update status after a delay (assuming download started)
                if (initiationId) {
                  setTimeout(async () => {
                    try {
                      await updateDownloadStatus(initiationId!, 'downloading');
                    } catch (e) {
                      console.error('Failed to update status:', e);
                    }
                  }, 2000);
                }
                updateSuccess = true;
              } else {
                console.warn('⚠️ [UPDATE] Cannot open update URL:', updateUrl);
                Alert.alert(
                  'Update Error',
                  'Could not open the update URL. Please check the URL and try again.',
                  [{ text: 'OK' }]
                );
              }
            } catch (linkError) {
              console.error('Error opening update URL:', linkError);
              Alert.alert(
                'Update Error',
                'Could not start download. Please check your internet connection and try again.',
                [{ text: 'OK' }]
              );
            }
          }
        }

        // If updateUrl was processed, return here (success or failure)
        if (updateSuccess) {
          return;
        }
      }
      
      // Priority 2: Use Play Store URL if provided
      if (!updateSuccess && playStoreUrl && playStoreUrl.trim()) {
        console.log('📱 [UPDATE] Opening Play Store URL:', playStoreUrl);
        try {
          if (initiationId) {
            await updateDownloadStatus(initiationId, 'downloading');
          }
          await Linking.openURL(playStoreUrl);
          updateSuccess = true;
        } catch (linkError) {
          console.error('Error opening Play Store:', linkError);
          // Fallback: try to open Play Store app directly
          if (Platform.OS === 'android') {
            try {
              await Linking.openURL('market://details?id=com.mcqfrontend.app');
              updateSuccess = true;
            } catch (e) {
              Alert.alert(
                'Error',
                'Could not open Play Store. Please search for the app manually.',
                [{ text: 'OK' }]
              );
            }
          }
        }
        
        if (updateSuccess) {
          return;
        }
      }
      
      // Priority 3: Try in-app update via expo-updates (if available and no other method worked)
      if (!updateSuccess) {
        if (Updates && Updates.isEnabled) {
          console.log('📱 [UPDATE] Attempting OTA update via expo-updates');
          try {
            if (initiationId) {
              await updateDownloadStatus(initiationId, 'downloading');
            }
            
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
              await Updates.fetchUpdateAsync();
              if (initiationId) {
                await updateDownloadStatus(initiationId, 'downloaded');
              }
              Alert.alert(
                'Update Downloaded',
                'The update has been downloaded. The app will restart to apply the update.',
                [{ 
                  text: 'OK',
                  onPress: async () => {
                    await Updates.reloadAsync();
                  }
                }]
              );
              updateSuccess = true;
            } else {
              console.log('ℹ️ [UPDATE] No OTA update available via expo-updates');
              // Don't mark as failed - just inform user
              Alert.alert(
                'No OTA Update Available',
                'No over-the-air update is available. Please check if an update URL or Play Store URL is configured, or contact support.',
                [{ text: 'OK' }]
              );
              // Keep status as "downloading" - user initiated the action, it's just not available
              console.log('ℹ️ [UPDATE] No OTA update available but user action was recorded. Status remains as "downloading".');
            }
          } catch (updateError) {
            console.error('📱 [UPDATE] Error with expo-updates:', updateError);
            Alert.alert(
              'Update Check Failed',
              'Unable to check for over-the-air updates. Please ensure you have configured an update URL or Play Store URL, or contact support.',
              [{ text: 'OK' }]
            );
            // Don't mark as failed if it's just that expo-updates isn't working
            // The admin should configure updateUrl or playStoreUrl instead
            console.log('ℹ️ [UPDATE] expo-updates error occurred, but this is expected if not configured. Admin should set updateUrl or playStoreUrl.');
          }
        } else {
          // No update mechanism available - this is a configuration issue
          console.warn('⚠️ [UPDATE] No update mechanism available:');
          console.warn('  - updateUrl:', updateUrl || '(not set)');
          console.warn('  - playStoreUrl:', playStoreUrl || '(not set)');
          console.warn('  - expo-updates:', Updates?.isEnabled ? 'enabled' : 'not available');
          
          Alert.alert(
            'Update Configuration Required',
            'No update mechanism is configured. Please contact support or ensure your admin has set up an update URL or Play Store URL.',
            [{ text: 'OK' }]
          );
          
          // IMPORTANT: Don't mark as "failed" - this is a configuration issue, not a user error
          // Keep status as "initiated" or "downloading" to show the user attempted the update
          // This allows admins to see that users are trying to update but no mechanism is configured
          if (initiationId) {
            console.log('ℹ️ [UPDATE] Keeping status as "initiated"/"downloading" - configuration issue, not user error');
            // Optionally update to "downloading" to show the attempt was made
            // But do NOT set to "failed" as this would incorrectly indicate a user/system failure
            try {
              // Keep it as "downloading" if it was set, or leave as "initiated"
              // This indicates the user made an attempt but the system couldn't fulfill it due to config
              console.log('ℹ️ [UPDATE] Status will remain as it is (initiated or downloading) to indicate user attempt');
            } catch (e) {
              console.error('Error updating status:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ [UPDATE] Error during update process:', error);
      Alert.alert(
        'Update Error',
        'An error occurred while trying to update. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setUpdating(false);
      setDownloadProgress(0);
    }
  };

  return (
    <Modal
      visible={localVisible}
      transparent
      animationType="fade"
      onRequestClose={() => {}} // Prevent closing by back button
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Update Required</Text>
            <Text style={styles.message}>{updateMessage}</Text>
            
            <TouchableOpacity
              style={[styles.updateButton, updating && styles.updateButtonDisabled]}
              onPress={handleUpdate}
              activeOpacity={0.8}
              disabled={updating}
            >
              {updating ? (
                <View style={styles.downloadingContainer}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  {downloadProgress > 0 && (
                    <Text style={styles.progressText}>
                      {Math.round(downloadProgress * 100)}%
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.updateButtonText}>Update Now</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  COMMENTED OUT UPDATE FUNCTIONALITY - END */
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight as any,
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  updateButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: typography.subtitle.fontSize,
    fontWeight: typography.subtitle.fontWeight as any,
  },
  updateButtonDisabled: {
    opacity: 0.7,
  },
  downloadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: typography.small.fontSize,
    fontWeight: '600' as any,
  },
});
