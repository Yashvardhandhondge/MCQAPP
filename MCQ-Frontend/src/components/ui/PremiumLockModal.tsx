import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadow } from '../../theme';

interface PremiumLockModalProps {
  visible: boolean;
  onClose: () => void;
  onBuyPremium: () => void;
  /** Optional custom title (default: "Premium Chapter") */
  title?: string;
  /** Optional custom message (default: chapter message) */
  message?: string;
}

const { width } = Dimensions.get('window');

const DEFAULT_TITLE = 'Premium Chapter';
const DEFAULT_MESSAGE = 'This chapter is for premium users. If you want to solve questions, buy premium.';

export default function PremiumLockModal({
  visible,
  onClose,
  onBuyPremium,
  title = DEFAULT_TITLE,
  message = DEFAULT_MESSAGE,
}: PremiumLockModalProps) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: opacityAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={styles.modalContent}>
            {/* Icon Header */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={colors.gradientPrimary as [string, string, ...string[]]}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="lock-closed" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Message */}
            <Text style={styles.message}>{message}</Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.cancelButton}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onBuyPremium();
                }}
                style={styles.buyButton}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={colors.gradientPrimary as [string, string, ...string[]]}
                  style={styles.buyButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="diamond" size={18} color="#FFFFFF" />
                  <Text style={styles.buyButtonText}>Buy Premium</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 400,
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.authSurface,
    borderRadius: radius.xl + 4,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadow.xl,
    borderWidth: 1,
    borderColor: colors.authBorder,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: radius.xl + 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.authTextSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.authInputBg,
    borderWidth: 1,
    borderColor: colors.authBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...typography.subtitle,
    color: colors.authText,
    fontWeight: '600',
  },
  buyButton: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  buyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  buyButtonText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

