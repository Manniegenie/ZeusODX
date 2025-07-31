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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '../constants/Typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = 520;

// Type definitions
interface CableTvProvider {
  id: string;
  name: string;
  icon: any;
}

interface CustomerData {
  customer_name?: string;
  customer_id?: string;
  [key: string]: any;
}

interface SelectedPackage {
  id: string;
  name: string;
  price: number;
  duration?: string;
}

interface CableTvConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  provider: CableTvProvider | null;
  smartcardNumber: string;
  customerData: CustomerData | null;
  selectedPackage: SelectedPackage | null;
}

const CableTvConfirmationModal: React.FC<CableTvConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  loading,
  provider,
  smartcardNumber,
  customerData,
  selectedPackage
}) => {
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const insets = useSafeAreaInsets();

  // Format amount for large display
  const formatAmountWithDecimals = (amt: number): string => {
    return `N${amt.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Format amount for detail section (without decimals)
  const formatAmount = (amt: number): string => {
    return `N${amt.toLocaleString('en-NG')}`;
  };

  // Format customer name
  const formatCustomerName = (name?: string): string => {
    if (!name) return 'N/A';
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Slide animation
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

  const handleBackdropPress = (): void => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalWrapper}>
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                {/* Handle Bar */}
                <View style={styles.handleBar} />

                {/* Amount Title */}
                <View style={styles.amountSection}>
                  <Text style={styles.amountTitle}>
                    {selectedPackage ? formatAmountWithDecimals(selectedPackage.price) : 'N0.00'}
                  </Text>
                </View>

                {/* Transaction Details */}
                <View style={styles.detailsSection}>
                  {/* Provider */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Provider</Text>
                    <View style={styles.providerContainer}>
                      {provider?.icon && (
                        <Image 
                          source={provider.icon} 
                          style={styles.providerIcon} 
                        />
                      )}
                      <Text style={styles.detailValue}>
                        {provider?.name || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {/* Plan */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Plan</Text>
                    <Text style={styles.detailValue}>
                      {selectedPackage?.name || 'N/A'}
                    </Text>
                  </View>

                  {/* Smartcard Number */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Smartcard Number</Text>
                    <Text style={styles.detailValue}>{smartcardNumber}</Text>
                  </View>

                  {/* Account Name */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account name</Text>
                    <Text style={styles.detailValue}>
                      {formatCustomerName(customerData?.customer_name)}
                    </Text>
                  </View>

                  {/* Amount */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount</Text>
                    <Text style={styles.detailValue}>
                      {selectedPackage ? formatAmount(selectedPackage.price) : 'N0'}
                    </Text>
                  </View>
                </View>

                {/* Pay Button */}
                <View style={styles.buttonSection}>
                  <TouchableOpacity
                    style={[
                      styles.payButton,
                      loading && styles.payButtonDisabled
                    ]}
                    onPress={onConfirm}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.payButtonText}>
                      {loading ? 'Processing...' : 'Pay'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
              
              {/* Safe Area Extension - White background that extends into bottom safe area */}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalWrapper: {
    alignSelf: 'center',
  },
  modalContainer: {
    width: 393,
    height: MODAL_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  safeAreaExtension: {
    width: 393,
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
  payButton: {
    backgroundColor: '#35297F',
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CableTvConfirmationModal;