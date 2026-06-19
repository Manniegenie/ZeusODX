import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
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

const MODAL_HEIGHT = 520;

interface BettingProvider {
  id: string;
  name: string;
  icon: any;
}
interface CustomerData {
  customer_name?: string;
  account_name?: string;
  [key: string]: any;
}
interface BettingConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  provider: BettingProvider | null;
  userId: string;
  customerData: CustomerData | null;
  amount: number;
}

const BettingConfirmationModal: React.FC<BettingConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  loading,
  provider,
  userId,
  customerData,
  amount,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const insets = useSafeAreaInsets();

  const formatAmountWithDecimals = (amt: number) =>
    `₦${amt.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatAmount = (amt: number) => `₦${amt.toLocaleString('en-NG')}`;

  const formatCustomerName = (name?: string) => {
    if (!name) return 'N/A';
    return name.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 8 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: MODAL_HEIGHT, duration: 300, useNativeDriver: true }).start();
    }
  }, [visible, slideAnim]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalWrapper}>
              <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.handleBar} />

                <View style={styles.amountSection}>
                  <Text style={styles.amountTitle}>{formatAmountWithDecimals(amount)}</Text>
                </View>

                <View style={styles.detailsSection}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Betting Provider</Text>
                    <View style={styles.providerContainer}>
                      {provider?.icon && <Image source={provider.icon} style={styles.providerIcon} />}
                      <Text style={styles.detailValue}>{provider?.name || 'N/A'}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>User ID</Text>
                    <Text style={styles.detailValue}>{userId}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account Name</Text>
                    <Text style={styles.detailValue}>
                      {formatCustomerName(customerData?.customer_name || customerData?.account_name)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount</Text>
                    <Text style={styles.detailValue}>{formatAmount(amount)}</Text>
                  </View>
                </View>

                <View style={styles.buttonSection}>
                  <TouchableOpacity
                    style={[styles.fundButton, loading && styles.fundButtonDisabled]}
                    onPress={onConfirm}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.fundButtonText}>{loading ? 'Processing...' : 'Fund Account'}</Text>
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
  providerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  providerIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    borderRadius: 4,
  },
  buttonSection: {
    marginTop: 'auto',
    paddingBottom: 24,
  },
  fundButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fundButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  fundButtonText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BettingConfirmationModal;
