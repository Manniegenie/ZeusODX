// app/user/BuyAirtimeScreen.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    ImageSourcePropType,
    ImageStyle,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import TwoFactorAuthModal from '../../components/2FA';
import AirtimeConfirmationModal from '../../components/Airtimeconfirm';
import BottomTabNavigator from '../../components/BottomNavigator';
import ErrorDisplay from '../../components/ErrorDisplay';
import PinEntryModal from '../../components/PinEntry';
import UtilityPurchaseSuccessModal from '../../components/Utilitysuccess';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useAirtime } from '../../hooks/useAirtime';

// Network provider icons
// @ts-ignore
import mtnIcon from '../../components/icons/mtn.png';
// @ts-ignore
import gloIcon from '../../components/icons/glo.png';
// @ts-ignore
import airtelIcon from '../../components/icons/airtel.png';
// @ts-ignore
import nineMobileIcon from '../../components/icons/9mobile.png';
// @ts-ignore
import profileIcon from '../../components/icons/profile.png';
// @ts-ignore
import checkmarkIcon from '../../components/icons/green-checkmark.png';

// use same back icon as other screens
import ScreenHeader from '../../components/ScreenHeader';

// Get screen dimensions for responsive design
const { width: screenWidth } = Dimensions.get('window');

// Calculate responsive dimensions
const getResponsiveDimensions = () => {
  const isSmallScreen = screenWidth < 350;
  const isMediumScreen = screenWidth >= 350 && screenWidth < 400;
  
  return {
    // Network cards
    networkCardWidth: isSmallScreen ? (screenWidth - 64) / 4 - 6 : isMediumScreen ? 75 : 80,
    networkCardHeight: isSmallScreen ? 45 : isMediumScreen ? 55 : 60,
    networkIconWidth: isSmallScreen ? (screenWidth - 64) / 4 - 8 : isMediumScreen ? 73 : 79,
    networkIconHeight: isSmallScreen ? 40 : isMediumScreen ? 48 : 53,
    
    // Quick pick cards
    quickPickCardWidth: isSmallScreen ? '31%' as const : '30%' as const,
    quickPickPadding: isSmallScreen ? 12 : 16,
    
    // Profile icon
    profileIconWidth: isSmallScreen ? 48 : isMediumScreen ? 56 : 64,
    profileIconHeight: isSmallScreen ? 36 : isMediumScreen ? 42 : 46,
    
    // General spacing
    checkmarkSize: isSmallScreen ? 16 : 20,
    horizontalPadding: isSmallScreen ? 12 : 16,
    networkGap: isSmallScreen ? 8 : 12,
    quickPickGap: isSmallScreen ? 8 : 12,
  };
};

const responsiveDims = getResponsiveDimensions();

// Type definitions
interface ErrorAction {
  title: string;
  message: string;
  actionText: string;
  route?: string;
  priority?: 'high' | 'medium' | 'low';
}

interface ErrorDisplayData {
  type?: 'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general' | 'setup' | 'limit' | 'balance';
  title?: string;
  message?: string;
  autoHide?: boolean;
  duration?: number;
  dismissible?: boolean;
}

interface NetworkProvider {
  id: string;
  name: string;
  iconSrc: ImageSourcePropType;
  color: string;
}

interface QuickPickAmount {
  id: string;
  value: number;
  label: string;
}

interface PurchaseData {
  phone: string;
  service_id: string;
  amount: string;
  twoFactorCode: string;
  passwordpin: string;
}

interface TransactionData {
  network: NetworkProvider | null;
  amount: string;
  phoneNumber: string;
  rate: string;
}

const BuyAirtimeScreen: React.FC = () => {
  const router = useRouter();
  const {
    loading,
    error,
    purchaseAirtime,
    clearErrors,
    formatPhoneNumber,
    getNetworkDisplayName,
    getErrorAction
  } = useAirtime();

  // Form state
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkProvider | null>(null);
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [selectedAmount, setSelectedAmount] = useState<QuickPickAmount | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  
  // Modal states
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState<boolean>(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  
  // Error display state
  const [showErrorDisplay, setShowErrorDisplay] = useState<boolean>(false);
  const [errorDisplayData, setErrorDisplayData] = useState<ErrorDisplayData | null>(null);
  
  // Authentication data
  const [passwordPin, setPasswordPin] = useState<string>('');
  const [twoFactorCode, setTwoFactorCode] = useState<string>('');

  // Network providers configuration
  const networkProviders: NetworkProvider[] = [
    { id: 'mtn', name: 'MTN', iconSrc: mtnIcon, color: '#FFCC02' },
    { id: 'glo', name: 'Glo', iconSrc: gloIcon, color: '#00A651' },
    { id: 'airtel', name: 'Airtel', iconSrc: airtelIcon, color: '#FF0000' },
    { id: '9mobile', name: '9mobile', iconSrc: nineMobileIcon, color: '#00AA4F' },
  ];

  // Quick pick amounts configuration
  const quickPickAmounts: QuickPickAmount[] = [
    { id: 'n50', value: 50, label: '₦50' },
    { id: 'n100', value: 100, label: '₦100' },
    { id: 'n200', value: 200, label: '₦200' },
    { id: 'n500', value: 500, label: '₦500' },
    { id: 'n1000', value: 1000, label: '₦1000' },
    { id: 'n2000', value: 2000, label: '₦2000' },
  ];

  // Navigation handler
  const handleGoBack = (): void => {
    if (!loading) router.back();
  };

  // Helper functions
  const showErrorMessage = (errorData: ErrorDisplayData): void => {
    setErrorDisplayData(errorData);
    setShowErrorDisplay(true);
  };

  const hideErrorDisplay = (): void => {
    setShowErrorDisplay(false);
    setErrorDisplayData(null);
  };

  const getErrorType = (errorCode: string): ErrorDisplayData['type'] => {
    switch (errorCode) {
      case 'SETUP_2FA_REQUIRED':
      case 'SETUP_PIN_REQUIRED':
        return 'setup';
      case 'INVALID_2FA_CODE':
      case 'INVALID_PASSWORDPIN':
        return 'auth';
      case 'KYC_LIMIT_EXCEEDED':
        return 'limit';
      case 'INSUFFICIENT_BALANCE':
        return 'balance';
      case 'VALIDATION_ERROR':
        return 'validation';
      case 'NETWORK_ERROR':
        return 'network';
      case 'SERVICE_ERROR':
      case 'PURCHASE_FAILED':
        return 'server';
      default:
        return 'general';
    }
  };

  // Event handlers
  const handleNetworkSelect = (network: NetworkProvider): void => {
    setSelectedNetwork(network);
  };

  const handleQuickPickSelect = (amount: QuickPickAmount): void => {
    setSelectedAmount(amount);
    setCustomAmount(amount.value.toString());
  };

  const handleAmountChange = (text: string): void => {
    setCustomAmount(text);
    setSelectedAmount(null);
  };

  const validateForm = (): boolean => {
    clearErrors();
    
    if (!selectedNetwork) {
      showErrorMessage({
        type: 'validation',
        title: 'Network Required',
        message: 'Please select a network provider to continue',
        autoHide: true,
        duration: 3000
      });
      return false;
    }
    
    if (!mobileNumber.trim()) {
      showErrorMessage({
        type: 'validation',
        title: 'Phone Number Required',
        message: 'Please enter a mobile number to continue',
        autoHide: true,
        duration: 3000
      });
      return false;
    }

    if (mobileNumber.length !== 11 || !mobileNumber.startsWith('0')) {
      showErrorMessage({
        type: 'validation',
        title: 'Invalid Phone Number',
        message: 'Please enter a valid 11-digit Nigerian phone number starting with 0',
        autoHide: true,
        duration: 3000
      });
      return false;
    }
    
    const amount = parseFloat(customAmount);
    if (!customAmount || amount <= 0 || isNaN(amount)) {
      showErrorMessage({
        type: 'validation',
        title: 'Amount Required',
        message: 'Please enter a valid amount to continue',
        autoHide: true,
        duration: 3000
      });
      return false;
    }
    
    if (amount < 50) {
      showErrorMessage({
        type: 'validation',
        title: 'Amount Too Low',
        message: 'Minimum airtime purchase is ₦50',
        autoHide: true,
        duration: 3000
      });
      return false;
    }
    
    if (amount > 50000) {
      showErrorMessage({
        type: 'validation',
        title: 'Amount Too High',
        message: 'Maximum airtime purchase is ₦50,000',
        autoHide: true,
        duration: 3000
      });
      return false;
    }
    
    return true;
  };

  const handleContinue = (): void => {
    if (validateForm()) {
      setShowConfirmationModal(true);
    }
  };

  // Modal handlers
  const handleConfirmationModalClose = (): void => {
    setShowConfirmationModal(false);
  };

  const handleConfirmPurchase = (): void => {
    setShowConfirmationModal(false);
    setShowPinModal(true);
  };

  const handlePinSubmit = (pin: string): void => {
    setPasswordPin(pin);
    setShowPinModal(false);
    setShowTwoFactorModal(true);
  };

  const handlePinModalClose = (): void => {
    setShowPinModal(false);
    setPasswordPin('');
    setShowConfirmationModal(true);
  };

  const handleTwoFactorSubmit = async (code: string): Promise<void> => {
    setTwoFactorCode(code);
    
    try {
      const purchaseData: PurchaseData = {
        phone: mobileNumber,
        service_id: selectedNetwork!.id,
        amount: customAmount,
        twoFactorCode: code,
        passwordpin: passwordPin
      };

      console.log('Processing airtime purchase:', {
        ...purchaseData,
        passwordpin: '[REDACTED]'
      });

      const result = await purchaseAirtime(purchaseData);

      if (result.success) {
        setShowTwoFactorModal(false);
        setShowPinModal(false);
        setShowConfirmationModal(false);
        setPasswordPin('');
        setTwoFactorCode('');
        
        // Navigate to BillReceipt instead of showing modal
        const billTransaction = {
          id: result.data?.transactionId || result.data?.id || Date.now().toString(),
          type: 'Airtime',
          status: 'Successful',
          amount: `₦${customAmount}`,
          date: new Date().toLocaleString(),
          details: {
            orderId: result.data?.orderId || result.data?.requestId,
            requestId: result.data?.requestId,
            productName: result.data?.productName || 'Airtime',
            network: selectedNetwork?.name || '',
            customerInfo: mobileNumber,
            billType: 'airtime',
            paymentCurrency: 'NGN',
            category: 'utility',
          },
          utilityType: 'Airtime'
        };
        
        router.push({
          pathname: '/receipt/bill-receipt',
          params: {
            tx: encodeURIComponent(JSON.stringify(billTransaction)),
            raw: encodeURIComponent(JSON.stringify(result.data || {}))
          }
        });
      } else {
        setShowTwoFactorModal(false);
        
        console.log('Airtime purchase failed, checking for error action...');
        const errorAction = getErrorAction?.(result.requiresAction);
        const errorType = getErrorType(result.error || 'GENERAL_ERROR');
        
        console.log('Error action found:', errorAction);
        console.log('Error type:', errorType);
        
        if (errorAction) {
          showErrorMessage({
            type: errorType,
            title: errorAction.title,
            message: errorAction.message,
            autoHide: false,
            dismissible: true
          });
        } else {
          console.log('No error action found, showing generic error');
          showErrorMessage({
            type: errorType,
            title: 'Purchase Failed',
            message: result.message || 'Something went wrong. Please try again.',
            autoHide: true,
            duration: 4000
          });
        }
      }
    } catch (error) {
      setShowTwoFactorModal(false);
      showErrorMessage({
        type: 'server',
        title: 'Unexpected Error',
        message: 'An unexpected error occurred. Please try again.',
        autoHide: true,
        duration: 4000
      });
    }
  };

  const handleTwoFactorModalClose = (): void => {
    setShowTwoFactorModal(false);
    setTwoFactorCode('');
    setShowPinModal(true);
  };

  const handleSuccessModalClose = (): void => {
    setShowSuccessModal(false);
  };

  // Form validation
  const isFormValid: boolean = !!(
    selectedNetwork && 
    mobileNumber.trim() && 
    mobileNumber.length === 11 &&
    mobileNumber.startsWith('0') &&
    customAmount && 
    parseFloat(customAmount) > 0
  );

  const transactionData: TransactionData = {
    network: selectedNetwork,
    amount: customAmount,
    phoneNumber: mobileNumber,
    rate: '1 NGNZ = 1 NGN'
  };

  const backDisabled = Boolean(loading);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

        {/* Error Display */}
        {showErrorDisplay && errorDisplayData && (
          <ErrorDisplay
            type={errorDisplayData.type}
            title={errorDisplayData.title}
            message={errorDisplayData.message}
            autoHide={errorDisplayData.autoHide !== false}
            duration={errorDisplayData.duration || 4000}
            dismissible={errorDisplayData.dismissible !== false}
            onDismiss={hideErrorDisplay}
          />
        )}

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Section */}
          <ScreenHeader
            title="Buy Airtime"
            onBack={handleGoBack}
            backDisabled={backDisabled}
          />

          {/* Network Provider Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Network Provider</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.networkScrollContainer}
              style={styles.networkScrollView}
            >
              <View style={styles.networkGrid}>
                {networkProviders.map((network) => (
                  <TouchableOpacity
                    key={network.id}
                    style={[
                      styles.networkCard,
                      selectedNetwork?.id === network.id && styles.networkCardSelected
                    ]}
                    onPress={() => handleNetworkSelect(network)}
                    activeOpacity={0.8}
                  >
                    <Image source={network.iconSrc} style={styles.networkIcon} />
                    {selectedNetwork?.id === network.id && (
                      <View style={styles.checkmarkContainer}>
                        <Image source={checkmarkIcon} style={styles.checkmarkIcon} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Mobile Number Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mobile Number</Text>
            <View style={styles.mobileNumberSection}>
              <View style={styles.mobileInputContainer}>
                <TextInput
                  style={styles.mobileInput}
                  placeholder="Enter mobile number"
                  placeholderTextColor={Colors.text?.secondary}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                  maxLength={11}
                  autoComplete="tel"
                />
              </View>
              <TouchableOpacity style={styles.profileIconContainer}>
                <Image source={profileIcon} style={styles.profileIcon} />
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              Enter 11-digit Nigerian number starting with 0 (e.g., 08012345678)
            </Text>
          </View>

          {/* Quick Pick Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Pick</Text>
            <View style={styles.quickPickGrid}>
              {quickPickAmounts.map((amount) => (
                <TouchableOpacity
                  key={amount.id}
                  style={[
                    styles.quickPickCard,
                    selectedAmount?.id === amount.id && styles.quickPickCardSelected
                  ]}
                  onPress={() => handleQuickPickSelect(amount)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.quickPickText,
                    selectedAmount?.id === amount.id && styles.quickPickTextSelected
                  ]}>
                    {amount.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Amount Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              placeholderTextColor={Colors.text?.secondary}
              value={customAmount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              autoComplete="off"
            />
            <Text style={styles.maxAmountText}>
              Maximum airtime purchase is ₦50,000
            </Text>
          </View>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !isFormValid && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!isFormValid || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>
              {loading ? 'Processing...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <BottomTabNavigator activeTab="airtime" />

      {/* PIN Entry Modal */}
      <PinEntryModal
        visible={showPinModal}
        onClose={handlePinModalClose}
        onSubmit={handlePinSubmit}
        loading={false}
        title="Enter Password PIN"
        subtitle="Please enter your 6-digit password PIN to continue"
      />

      {/* Two-Factor Authentication Modal */}
      <TwoFactorAuthModal
        visible={showTwoFactorModal}
        onClose={handleTwoFactorModalClose}
        onSubmit={handleTwoFactorSubmit}
        loading={loading}
        title="Two-Factor Authentication"
        subtitle="Please enter the 6-digit code from your authenticator app"
      />

      {/* Airtime Confirmation Modal */}
      <AirtimeConfirmationModal
        visible={showConfirmationModal}
        onClose={handleConfirmationModalClose}
        onConfirm={handleConfirmPurchase}
        loading={loading}
        transactionData={transactionData}
      />

      {/* Success Modal */}
      <UtilityPurchaseSuccessModal
        visible={showSuccessModal}
        utilityType="Airtime"
        amount={`₦${customAmount}`}
        phoneNumber={mobileNumber}
        network={selectedNetwork?.name || ''}
        onContinue={handleSuccessModalClose}
      />
    </View>
  );
};

// Responsive styles
const styles = StyleSheet.create<{
  container: ViewStyle;
  safeArea: ViewStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  historyLink: TextStyle;
  section: ViewStyle;
  sectionTitle: TextStyle;
  networkScrollView: ViewStyle;
  networkScrollContainer: ViewStyle;
  networkGrid: ViewStyle;
  networkCard: ViewStyle;
  networkCardSelected: ViewStyle;
  networkIcon: ImageStyle;
  checkmarkContainer: ViewStyle;
  checkmarkIcon: ImageStyle;
  mobileNumberSection: ViewStyle;
  mobileInputContainer: ViewStyle;
  mobileInput: TextStyle;
  profileIconContainer: ViewStyle;
  profileIcon: ImageStyle;
  helperText: TextStyle;
  quickPickGrid: ViewStyle;
  quickPickCard: ViewStyle;
  quickPickCardSelected: ViewStyle;
  quickPickText: TextStyle;
  quickPickTextSelected: TextStyle;
  amountInput: TextStyle;
  maxAmountText: TextStyle;
  buttonContainer: ViewStyle;
  continueButton: ViewStyle;
  continueButtonDisabled: ViewStyle;
  continueButtonText: TextStyle;
  bottomSpacer: ViewStyle;
}>({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background || '#F8F9FA' 
  },
  safeArea: { 
    flex: 1 
  },
  scrollView: { 
    flex: 1 
  },
  scrollContent: {
    paddingBottom: 20,
  },

  historyLink: {
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 14,
    fontWeight: '500',
  },

  // Section styles
  section: {
    paddingHorizontal: responsiveDims.horizontalPadding,
    marginBottom: 24,
  },
  sectionTitle: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 16,
  },

  // Network selection styles - Responsive and scrollable
  networkScrollView: {
    flexGrow: 0,
  },
  networkScrollContainer: {
    paddingHorizontal: 4,
    minWidth: screenWidth - (responsiveDims.horizontalPadding * 2),
  },
  networkGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveDims.networkGap,
    paddingVertical: 4,
  },
  networkCard: {
    width: responsiveDims.networkCardWidth,
    height: responsiveDims.networkCardHeight,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  networkCardSelected: {
    borderColor: '#35297F',
    backgroundColor: '#F8F7FF',
  },
  networkIcon: {
    width: responsiveDims.networkIconWidth,
    height: responsiveDims.networkIconHeight,
    resizeMode: 'contain',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: -6,
    right: -6,
    zIndex: 1,
    backgroundColor: 'white',
    borderRadius: responsiveDims.checkmarkSize / 2,
    padding: 1,
  },
  checkmarkIcon: {
    width: responsiveDims.checkmarkSize,
    height: responsiveDims.checkmarkSize,
    resizeMode: 'contain',
  },

  // Mobile input styles - Responsive
  mobileNumberSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: screenWidth < 350 ? 8 : 12,
  },
  mobileInputContainer: {
    flex: 1,
    backgroundColor: Colors.surface || '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  mobileInput: {
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.regular || 'System',
    fontSize: 16,
    fontWeight: '400',
    paddingVertical: 4,
    minHeight: 24,
  },
  profileIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: responsiveDims.profileIconWidth,
    minHeight: responsiveDims.profileIconHeight,
  },
  profileIcon: {
    width: responsiveDims.profileIconWidth,
    height: responsiveDims.profileIconHeight,
    resizeMode: 'contain',
  },

  // Helper text styles
  helperText: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 11,
    fontWeight: '400',
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 16,
  },

  // Quick pick styles - Responsive
  quickPickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsiveDims.quickPickGap,
    justifyContent: 'space-between',
  },
  quickPickCard: {
    width: responsiveDims.quickPickCardWidth,
    paddingVertical: responsiveDims.quickPickPadding,
    borderRadius: 8,
    backgroundColor: Colors.surface || '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  quickPickCardSelected: {
    borderColor: '#35297F',
    borderWidth: 1,
    backgroundColor: '#F8F7FF',
  },
  quickPickText: {
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.regular || 'System',
    fontSize: screenWidth < 350 ? 12 : 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  quickPickTextSelected: {
    color: '#35297F',
    fontWeight: '600',
  },

  // Amount input styles
  amountInput: {
    backgroundColor: Colors.surface || '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.regular || 'System',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 8,
    minHeight: 56,
  },
  maxAmountText: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },

  // Button styles
  buttonContainer: {
    paddingHorizontal: responsiveDims.horizontalPadding,
    paddingVertical: 24,
    backgroundColor: Colors.background || '#F8F9FA',
  },
  continueButton: {
    backgroundColor: '#35297F',
    borderRadius: 8,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 56,
  },
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
    elevation: 0,
    shadowOpacity: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 16,
    fontWeight: '600',
  },

  // Bottom spacer
  bottomSpacer: {
    height: 20,
  },
});

export default BuyAirtimeScreen;
