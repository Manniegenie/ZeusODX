import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '../constants/Typography';

// Network icons
import mtnIcon from '../components/icons/mtn.png';
import gloIcon from '../components/icons/glo.png';
import airtelIcon from '../components/icons/airtel.png';
import nineMobileIcon from '../components/icons/9mobile.png';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = 520; // Increased height to ensure pay button is visible

// Type definitions
interface NetworkProvider {
  id: string;
  name: string;
  iconSrc?: ImageSourcePropType;
  color?: string;
}

interface DataPlan {
  variationId: string;
  name: string;
  description?: string;
  price: number;
  dataAllowance: string;
  validity: string;
  network?: string;
  formattedPrice: string;
  formattedData: string;
}

interface TransactionData {
  network?: NetworkProvider | null;
  amount?: string;
  phoneNumber?: string;
  selectedPlan?: DataPlan | null;
  rate?: string;
}

interface DataConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transactionData?: TransactionData;
  loading?: boolean;
}

const DataConfirmationModal: React.FC<DataConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  transactionData = {},
  loading = false
}) => {
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const insets = useSafeAreaInsets();

  const {
    network = null,
    amount = '0',
    phoneNumber = '',
    selectedPlan = null,
    rate = '1 NGNZ = 1 NGN'
  } = transactionData;

  // Get network icon
  const getNetworkIcon = (networkId?: string): ImageSourcePropType => {
    if (!networkId) return mtnIcon; // Default icon if no network selected
    
    const icons: Record<string, ImageSourcePropType> = {
      'mtn': mtnIcon,
      'glo': gloIcon,
      'airtel': airtelIcon,
      '9mobile': nineMobileIcon
    };
    return icons[networkId?.toLowerCase()] || mtnIcon;
  };

  // Format amount for display
  const formatAmount = (amount: string | number): string => {
    const numAmount = parseFloat(amount.toString()) || 0;
    return `₦${numAmount.toLocaleString('en-NG', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  // Format phone number for display
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';
    // Remove any non-digits and format
    const cleaned = phone.replace(/\D/g, '');
    return cleaned;
  };

  // Format data allowance for display
  const formatDataAllowance = (dataAllowance?: string): string => {
    if (!dataAllowance) return '';
    // Clean up the data allowance string and add space between number and unit
    return dataAllowance.toString().toUpperCase().replace(/(\d)([A-Z])/g, '$1 $2');
  };

  // Format validity period for display
  const formatValidityPeriod = (validity?: string): string => {
    if (!validity) return '';
    
    // Common validity patterns
    const patterns: Record<string, string> = {
      '1 day': '24 hours',
      '7 days': '1 week',
      '30 days': '1 month',
      '90 days': '3 months',
      '365 days': '1 year'
    };
    
    const cleaned = validity.toString().toLowerCase().trim();
    return patterns[cleaned] || validity;
  };

  // Get display amount - prefer selectedPlan price over amount
  const displayAmount = selectedPlan?.price?.toString() || amount;

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
                    {formatAmount(displayAmount)}
                  </Text>
                </View>

                {/* Transaction Details */}
                <View style={styles.detailsSection}>
                  {/* Transaction Type */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transaction</Text>
                    <Text style={styles.detailValue}>Data</Text>
                  </View>

                  {/* Data Plan */}
                  {selectedPlan && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Data Plan</Text>
                      <Text style={styles.detailValue}>
                        {formatDataAllowance(selectedPlan.dataAllowance)}
                      </Text>
                    </View>
                  )}

                  {/* Validity */}
                  {selectedPlan?.validity && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Validity</Text>
                      <Text style={styles.detailValue}>
                        {formatValidityPeriod(selectedPlan.validity)}
                      </Text>
                    </View>
                  )}

                  {/* Rate */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Rate</Text>
                    <Text style={styles.detailValue}>{rate}</Text>
                  </View>

                  {/* Phone Number */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone number</Text>
                    <View style={styles.phoneContainer}>
                      <Image 
                        source={getNetworkIcon(network?.id)} 
                        style={styles.networkIconSmall} 
                      />
                      <Text style={styles.detailValue}>
                        {formatPhoneNumber(phoneNumber)}
                      </Text>
                    </View>
                  </View>

                  {/* Amount */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount</Text>
                    <Text style={styles.detailValue}>
                      ₦{parseFloat(displayAmount) || 0}
                    </Text>
                  </View>

                  {/* Plan Name (if available) */}
                  {selectedPlan?.name && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Plan Name</Text>
                      <Text style={[styles.detailValue, styles.planNameText]} numberOfLines={2}>
                        {selectedPlan.name}
                      </Text>
                    </View>
                  )}
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
  planNameText: {
    fontSize: 12,
    lineHeight: 16,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  networkIconSmall: {
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

export default DataConfirmationModal;