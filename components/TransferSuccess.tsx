// components/TransferSuccessModal.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  SafeAreaView,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

type CurrencySymbol = 'NGNZ' | 'USDT' | 'USDC' | 'BTC' | 'ETH' | 'SOL' | 'AVAX' | 'BNB' | 'MATIC' | string;

interface TransferSuccessModalProps {
  visible: boolean;
  onContinue: () => void;
  amount: number | string;       // 12.5 or "12.50"
  currency: CurrencySymbol;      // "USDT" | "NGNZ" | ...
  recipientUsername: string;     // "john_doe" (no leading @)
  transactionRef?: string | null;
  transferDate?: string | null;
  transferType?: string;         // e.g. "Username Transfer"
}

const TransferSuccessModal: React.FC<TransferSuccessModalProps> = ({
  visible,
  onContinue,
  amount,
  currency,
  recipientUsername,
  transactionRef,
  transferDate,
  transferType = 'Transfer',
}) => {
  const router = useRouter();

  // ——— Use the same Animated structure as 2FA modal to avoid overflow
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  const formatAmount = (val: number | string, sym: CurrencySymbol) => {
    const n = typeof val === 'string' ? Number(val.toString().replace(/,/g, '')) : val;
    if (Number.isNaN(n)) return `${val} ${sym}`;

    if (sym === 'NGNZ') {
      return `₦${Math.round(n).toLocaleString('en-NG')}`;
    }

    const decimals =
      sym === 'BTC' ? 8 :
      sym === 'ETH' ? 6 :
      sym === 'USDT' || sym === 'USDC' ? 2 :
      n >= 1000 ? 2 :
      n >= 1 ? 4 :
      n >= 0.01 ? 4 :
      n >= 0.001 ? 6 : 6;

    return `${n.toFixed(decimals)} ${sym}`;
  };

  const handleContinue = () => {
    onContinue?.();
    setTimeout(() => {
      try { router.push('/user/wallet'); } catch {}
    }, 120);
  };

  // Keep overlay press inert (like SwapSuccess default), but structure matches 2FA to avoid layout issues
  const handleBackdropPress = () => {};

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={handleContinue}>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <SafeAreaView style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
              ]}
            >
              {/* Close button (optional) — matching 2FA structure */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleContinue}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              {/* Icon */}
              <View style={styles.iconContainer}>
                <Image
                  source={require('../components/icons/check-check.png')}
                  style={styles.checkmarkIcon}
                  resizeMode="contain"
                />
              </View>

              {/* Title (match SwapSuccess tone) */}
              <Text style={styles.title}>{transferType} successful</Text>

              {/* Subtitle (match SwapSuccess typography & spacing) */}
              <Text style={styles.subtitle}>
                You have successfully sent {formatAmount(amount, currency)}{'\n'}to @{recipientUsername}.
              </Text>

              {/* Meta (optional) */}
              {(transactionRef || transferDate) && (
                <View style={styles.metaBox}>
                  {transactionRef ? <Text style={styles.metaText}>Ref: {transactionRef}</Text> : null}
                  {transferDate ? <Text style={styles.metaText}>Date: {transferDate}</Text> : null}
                </View>
              )}

              {/* Continue button (same feel as swap & 2FA primary) */}
              <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.9}>
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // ——— Overlay identical to 2FA modal for consistent sizing/behavior
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout?.spacing?.lg ?? 20,
  },
  // ——— Smaller container (like 2FA): fixed width prevents overflow on small screens
  modalContainer: {
    backgroundColor: Colors?.background ?? '#FFFFFF',
    borderRadius: Layout?.borderRadius?.xl ?? 16,
    paddingHorizontal: Layout?.spacing?.xl ?? 24,
    paddingVertical: Layout?.spacing?.xl ?? 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    width: 320,               // a tad smaller than swap success
    alignSelf: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  iconContainer: {
    marginTop: 6,
    marginBottom: Layout?.spacing?.md ?? 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkIcon: {
    width: 64,     // slightly smaller than swap success (80)
    height: 64,
  },
  title: {
    fontFamily: Typography?.bold || 'System',
    fontSize: 20,  // align with swap’s 22 but a bit tighter due to smaller card
    lineHeight: 24,
    color: Colors?.primaryText || Colors?.text?.primary || '#111827',
    textAlign: 'center',
    marginBottom: Layout?.spacing?.sm ?? 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors?.text?.secondary || '#6B7280',
    textAlign: 'center',
    marginBottom: Layout?.spacing?.lg ?? 18,
    fontFamily: Typography?.regular || 'System',
    fontWeight: '400',
  },
  metaBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: Layout?.borderRadius?.md ?? 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: '100%',
    marginBottom: Layout?.spacing?.lg ?? 18,
  },
  metaText: {
    fontFamily: Typography?.regular || 'System',
    fontSize: 12,
    color: Colors?.text?.secondary || '#6B7280',
    marginBottom: 2,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: Colors?.primary || '#35297F',
    borderRadius: Layout?.borderRadius?.lg ?? 12,
    paddingVertical: Layout?.spacing?.md ?? 14,
    paddingHorizontal: Layout?.spacing?.xl ?? 24,
    alignItems: 'center',
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors?.surface || '#FFFFFF',
    fontFamily: Typography?.medium || 'System',
  },
});

export default TransferSuccessModal;
