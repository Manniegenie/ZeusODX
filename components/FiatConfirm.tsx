// components/FiatTransferConfirmationModal.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '../constants/Typography';
import { useTheme } from '../hooks/useTheme';
import type { AppColors } from '../hooks/useTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = Math.min(520, Math.round(SCREEN_HEIGHT * 0.7));

interface BankDetails {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface FiatTransferData {
  amount: string;
  fee: string;
  netAmount: string;
  bank: BankDetails;
  currency?: string;
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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
                <View style={styles.handleBar} />

                <View style={styles.amountSection}>
                  <Text style={styles.amountTitle}>Transfer to Bank</Text>
                  <Text style={styles.amountValue}>{formatNGNZ(amount)}</Text>
                </View>

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
                    <Text style={styles.detailValue}>{formatNGN(netAmount)}</Text>
                  </View>
                </View>

                <View style={[styles.buttonSection, { paddingBottom: Math.max(24, insets.bottom + 8) }]}>
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

              <View style={[styles.safeAreaExtension, { height: insets.bottom }]} />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const makeStyles = (colors: AppColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalWrapper: {
    alignSelf: 'center',
    width: '100%',
  },
  modalContainer: {
    width: '100%',
    height: MODAL_HEIGHT,
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  safeAreaExtension: {
    width: '100%',
    backgroundColor: colors.card,
    alignSelf: 'center',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  amountTitle: {
    color: colors.textSecondary,
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 8,
  },
  amountValue: {
    color: colors.text,
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
    borderBottomColor: colors.border,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
  },
  detailValue: {
    color: colors.text,
    fontFamily: Typography.medium || 'System',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  buttonSection: {
    marginTop: 'auto',
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FiatTransferConfirmationModal;
