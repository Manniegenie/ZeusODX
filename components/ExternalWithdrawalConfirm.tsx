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
import { ms, s } from 'react-native-size-matters';
import { Typography } from '../constants/Typography';
import { useTheme } from '../hooks/useTheme';
import type { AppColors } from '../hooks/useTheme';
import { withdrawalService } from '../services/externalwithdrawalService';

const MODAL_HEIGHT = 420;

interface ExternalWithdrawalConfirmProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transactionData: {
    destination: {
      address: string;
      network: string;
      memo?: string;
    };
    amount: number;
    currency: string;
    fee?: number;
    receiverAmount?: number;
    networkName?: string;
  };
}

const ExternalWithdrawalConfirm: React.FC<ExternalWithdrawalConfirmProps> = ({
  visible,
  onClose,
  onConfirm,
  transactionData,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const insets = useSafeAreaInsets();

  const {
    destination,
    amount = 0,
    currency = '',
    fee = 0,
    receiverAmount,
    networkName = '',
  } = transactionData;

  const formatAmount = (amount: number) => {
    return withdrawalService.formatWithdrawalAmount(amount, currency);
  };

  const truncateAddress = (address: string) => {
    if (!address || address.length <= 20) return address;
    return `${address.substring(0, 10)}...${address.substring(address.length - 10)}`;
  };

  const receiverWillGet = (receiverAmount !== undefined && receiverAmount !== null)
    ? receiverAmount
    : parseFloat((amount - fee).toFixed(8));

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
                style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}
              >
                <View style={styles.handleBar} />

                <View style={styles.amountSection}>
                  <Text style={styles.amountTitle}>
                    {formatAmount(amount)} {currency}
                  </Text>
                </View>

                <View style={styles.detailsSection}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transaction</Text>
                    <Text style={styles.detailValue}>External Withdrawal</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Wallet address</Text>
                    <Text style={[styles.detailValue, styles.addressValue]}>
                      {truncateAddress(destination?.address)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Network</Text>
                    <Text style={styles.detailValue}>{networkName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fee</Text>
                    <Text style={styles.detailValue}>{formatAmount(fee)} {currency}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Receiver will get</Text>
                    <Text style={styles.detailValue}>{formatAmount(receiverWillGet)} {currency}</Text>
                  </View>
                </View>

                <View style={styles.buttonSection}>
                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={onConfirm}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.payButtonText}>Confirm</Text>
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
    alignSelf: 'center',
    height: MODAL_HEIGHT,
    backgroundColor: colors.card,
    borderTopLeftRadius: s(24),
    borderTopRightRadius: s(24),
    paddingHorizontal: ms(24),
    paddingTop: 12,
  },
  safeAreaExtension: {
    width: '100%',
    backgroundColor: colors.card,
    alignSelf: 'center',
  },
  handleBar: {
    width: s(40),
    height: 4,
    backgroundColor: colors.border,
    borderRadius: s(2),
    alignSelf: 'center',
    marginBottom: 24,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  amountTitle: {
    color: colors.text,
    fontFamily: Typography.medium || 'System',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailsSection: {
    marginBottom: 32,
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
  },
  detailValue: {
    color: colors.text,
    fontFamily: Typography.medium || 'System',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  addressValue: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  buttonSection: {
    marginTop: 'auto',
    paddingBottom: 24,
  },
  payButton: {
    backgroundColor: colors.primary,
    borderRadius: s(12),
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExternalWithdrawalConfirm;
