import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';

export interface RazorpayCheckoutWebViewProps {
  visible: boolean;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  userEmail?: string | null;
  userPhone?: string | null;
  onSuccess: (payload: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onDismiss: () => void;
  onError?: (message: string) => void;
}

const getCheckoutHTML = (
  orderId: string,
  amount: number,
  keyId: string,
  currency: string,
  prefillEmail: string,
  prefillContact: string
) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body style="margin:0;padding:0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f5f5;">
  <p id="status">Opening payment...</p>
  <script>
    var options = {
      key: "${keyId.replace(/"/g, '\\"')}",
      amount: ${amount},
      currency: "${currency}",
      order_id: "${orderId.replace(/"/g, '\\"')}",
      name: "MCQ App Premium",
      description: "Premium subscription",
      prefill: {
        email: ${prefillEmail ? '"' + prefillEmail.replace(/"/g, '\\"') + '"' : 'undefined'},
        contact: ${prefillContact ? '"' + prefillContact.replace(/"/g, '\\"') + '"' : 'undefined'}
      },
      handler: function(response) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            success: true,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          }));
        }
      },
      modal: {
        ondismiss: function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ success: false, cancelled: true }));
          }
        }
      }
    };
    var rzp = new Razorpay(options);
    rzp.on('payment.failed', function(e) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          success: false,
          error: e.error ? e.error.description : 'Payment failed'
        }));
      }
    });
    rzp.open();
    document.getElementById('status').textContent = 'Complete payment in the window above.';
  </script>
</body>
</html>
`;

export default function RazorpayCheckoutWebView({
  visible,
  orderId,
  amount,
  currency,
  keyId,
  userEmail,
  userPhone,
  onSuccess,
  onDismiss,
  onError,
}: RazorpayCheckoutWebViewProps) {
  const webViewRef = useRef<WebView>(null);

  const prefillEmail = userEmail && userEmail.trim() ? userEmail.trim() : '';
  const prefillContact = userPhone && userPhone.trim() ? userPhone.trim().replace(/^\+91/, '') : '';

  const html = getCheckoutHTML(
    orderId,
    amount,
    keyId,
    currency,
    prefillEmail,
    prefillContact
  );

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.success && data.razorpay_payment_id && data.razorpay_order_id && data.razorpay_signature) {
        onSuccess({
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_order_id: data.razorpay_order_id,
          razorpay_signature: data.razorpay_signature,
        });
        return;
      }
      if (data.cancelled) {
        onDismiss();
        return;
      }
      if (data.error) {
        onError?.(data.error);
        onDismiss();
      }
    } catch (e) {
      onError?.('Invalid response from payment');
      onDismiss();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onDismiss} style={styles.closeButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Payment</Text>
          <View style={styles.closeButton} />
        </View>
        <WebView
          ref={webViewRef}
          source={{ html }}
          style={styles.webview}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Opening Razorpay...</Text>
            </View>
          )}
          originWhitelist={['*']}
          mixedContentMode="compatibility"
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            onError?.(nativeEvent.description || 'WebView error');
            onDismiss();
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingTop: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
