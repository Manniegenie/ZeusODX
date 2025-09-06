// components/FiatTransferConfirmationModal.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '../constants/Typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Increased height a bit; adapts to screen size, max 500
const MODAL_HEIGHT = Math.min(500, Math.round(SCREEN_HEIGHT * 0.72));

interface BankDetails {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface FiatTransferData {
  amount: string;      // Transfer amount in NGNZ
  fee: string;         // Transaction fee (NGNZ)
  netAmount: string;   // Amount after fee (NGN)
  bank: BankDetails;   // Selected bank account
  currency?: string;   // e.g. 'NGN'
}

interface FiatTransferConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transferData: FiatTransferData;
  loading?: boolean;
}

const FiatTransferConfirmationModal: React.FC<FiatTransferConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  transferData,
  loading = false,
}) => {
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const insets = useSafeAreaInsets();

  const {
    amount = '0',
    fee = '0',
    netAmount = '0',
    bank,
    currency = 'NGN',
  } = transferData || ({} as FiatTransferData);

  const formatNGNZ = (amt: string | number) => {
    const num = parseFloat(String(amt)) || 0;
    return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NGNZ`;
  };

  const formatNGN = (amt: string | number) => {
    const num = parseFloat(String(amt)) || 0;
    return `₦${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: MODAL_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalWrapper}>
              <Animated.View
                style={[
                  styles.modalContainer,
                  { transform: [{ translateY: slideAnim }] },
                ]}
              >
                {/* Handle Bar */}
                <View style={styles.handleBar} />

                {/* Amount Section */}
                <View style={styles.amountSection}>
                  <Text style={styles.amountTitle}>Transfer to Bank</Text>
                  <Text style={styles.amountValue}>{formatNGNZ(amount)}</Text>
                </View>

                {/* Transfer Details */}
                <View style={styles.detailsSection}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bank</Text>
                    <Text style={styles.detailValue}>{bank?.bankName || ''}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account Number</Text>
                    <Text style={styles.detailValue}>{bank?.accountNumber || ''}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account Name</Text>
                    <Text style={styles.detailValue}>{bank?.accountName || ''}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transaction Fee</Text>
                    <Text style={styles.detailValue}>{formatNGNZ(fee)}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>You will receive</Text>
                    <Text style={styles.detailValue}>
                      {formatNGN(netAmount)} {currency ? '' : ''}
                    </Text>
                  </View>
                </View>

                {/* Confirm Button (padded by bottom safe-area) */}
                <View
                  style={[
                    styles.buttonSection,
                    { paddingBottom: Math.max(24, insets.bottom + 8) },
                  ]}
                >
                  <TouchableOpacity
                    style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                    onPress={onConfirm}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmButtonText}>
                      {loading ? 'Processing...' : 'Confirm Transfer'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Bottom safe-area background extension */}
              <View style={[styles.safeAreaExtension, { height: insets.bottom }]} />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalWrapper: {
    alignSelf: 'center',
  },
  modalContainer: {
    width: Math.min(393, SCREEN_WIDTH),
    height: MODAL_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  safeAreaExtension: {
    width: Math.min(393, SCREEN_WIDTH),
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  amountTitle: {
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 8,
  },
  amountValue: {
    color: '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
  },
  detailValue: {
    color: '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  buttonSection: {
    marginTop: 'auto',
    // paddingBottom is set dynamically with safe-area inset
  },
  confirmButton: {
    backgroundColor: '#35297F',
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FiatTransferConfirmationModal;
