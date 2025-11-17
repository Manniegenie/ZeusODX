import { useEffect, useRef } from 'react';
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
import { ms, s } from 'react-native-size-matters';
import { Typography } from '../constants/Typography';

// Network icons
import nineMobileIcon from '../components/icons/9mobile.png';
import airtelIcon from '../components/icons/airtel.png';
import gloIcon from '../components/icons/glo.png';
import mtnIcon from '../components/icons/mtn.png';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = 361;

const AirtimeConfirmationModal = ({
  visible,
  onClose,
  onConfirm,
  transactionData = {},
  loading = false
}) => {
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const insets = useSafeAreaInsets();

  const {
    network = {},
    amount = '0',
    phoneNumber = '',
    rate = '1 NGNZ = 1 NGN'
  } = transactionData;

  // Get network icon
  const getNetworkIcon = (networkId) => {
    if (!networkId) return mtnIcon; // Default icon if no network selected
    
    const icons = {
      'mtn': mtnIcon,
      'glo': gloIcon,
      'airtel': airtelIcon,
      '9mobile': nineMobileIcon
    };
    return icons[networkId?.toLowerCase()] || mtnIcon;
  };

  // Format amount for display
  const formatAmount = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return `₦${numAmount.toLocaleString('en-NG', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  // Format phone number for display
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Remove any non-digits and format
    const cleaned = phone.replace(/\D/g, '');
    return cleaned;
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

  const handleBackdropPress = () => {
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
                    {formatAmount(amount)}
                  </Text>
                </View>

                {/* Transaction Details */}
                <View style={styles.detailsSection}>
                  {/* Transaction Type */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transaction</Text>
                    <Text style={styles.detailValue}>Airtime</Text>
                  </View>

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
                      ₦{parseFloat(amount) || 0}
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
    width: '100%',
  },
  modalContainer: {
    width: '100%',
    alignSelf: 'center',
    height: MODAL_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: s(24),
    borderTopRightRadius: s(24),
    paddingHorizontal: ms(24),
    paddingTop: 12,
  },
  safeAreaExtension: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
  },
  handleBar: {
    width: s(40),
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: s(2),
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
    marginBottom: 32,
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
  },
  detailValue: {
    color: '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: s(8),
  },
  networkIconSmall: {
    width: s(20),
    height: 20,
    resizeMode: 'contain',
    borderRadius: s(4),
  },
  buttonSection: {
    marginTop: 'auto',
    paddingBottom: 24,
  },
  payButton: {
    backgroundColor: '#35297F',
    borderRadius: s(12),
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

export default AirtimeConfirmationModal;