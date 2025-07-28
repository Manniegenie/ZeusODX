import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  ImageSourcePropType,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabNavigator from '../../components/BottomNavigator';
import DataConfirmationModal from '../../components/Dataconfirm';
import DataPlansModal from '../../components/DataPlanModal';
import PinEntryModal from '../../components/PinEntry';
import TwoFactorAuthModal from '../../components/2FA';
import ErrorDisplay from '../../components/ErrorDisplay';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { useDashboard } from '../../hooks/useDashboard';
import { useData } from '../../hooks/useData';

// Network provider icons - replace with actual paths
import mtnIcon from '../../components/icons/mtn.png';
import gloIcon from '../../components/icons/glo.png';
import airtelIcon from '../../components/icons/airtel.png';
import nineMobileIcon from '../../components/icons/9mobile.png';
import profileIcon from '../../components/icons/profile.png';
import checkmarkIcon from '../../components/icons/green-checkmark.png';

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
  errorAction?: ErrorAction;
  onActionPress?: () => void;
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

interface DataPlan {
  variationId: string;
  variation_id?: string | number; // Add for hook compatibility
  name: string;
  description: string;
  price: number;
  dataAllowance: string;
  validity: string;
  network: string;
  formattedPrice: string;
  formattedData: string;
}

interface PurchaseData {
  phone: string;
  service_id: string;
  variation_id: string; // Hook expects this as string
  amount: number;
  twoFactorCode: string;
  passwordpin: string;
}

interface TransactionData {
  network: NetworkProvider | null;
  amount: string;
  phoneNumber: string;
  selectedPlan: DataPlan | null;
  rate: string;
}

const BuyDataScreen: React.FC = () => {
  const router = useRouter();
  const { dailyLimit } = useDashboard();
  const {
    loading,
    error,
    selectedPlan,
    purchaseData,
    selectDataPlan,
    clearSelectedPlan,
    clearErrors,
    formatPhoneNumber,
    getNetworkDisplayName,
    getErrorAction
  } = useData();

  // Form state
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkProvider | null>(null);
  const [mobileNumber, setMobileNumber] = useState<string>('');
  
  // Modal states
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState<boolean>(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);
  const [showDataPlanModal, setShowDataPlanModal] = useState<boolean>(false);
  
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

  // Debug modal state changes
  useEffect(() => {
    console.log('showDataPlanModal changed:', showDataPlanModal);
  }, [showDataPlanModal]);

  // Navigation handler
  const handleGoBack = (): void => {
    router.back();
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
      case 'INVALID_DATA_PLAN':
      case 'AMOUNT_PLAN_MISMATCH':
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
    console.log('Network selected:', network.name);
    setSelectedNetwork(network);
    clearSelectedPlan(); // Clear any previously selected plan
  };

  const handleDataPlanSelect = (plan: any): void => {
    console.log('Plan selected in screen:', plan);
    
    // The modal returns a plan with this structure: { id, data, duration, price, formattedPrice, originalPlan }
    // We need to convert it back to the DataPlan format your screen expects
    
    if (plan.originalPlan) {
      // Ensure the original plan has the correct field mapping for the hook
      const normalizedPlan: DataPlan = {
        variationId: plan.originalPlan.variationId || plan.originalPlan.originalData?.variation_id || plan.id,
        variation_id: (plan.originalPlan.variationId || plan.originalPlan.originalData?.variation_id || plan.id).toString(), // Ensure string for hook
        name: plan.originalPlan.name || plan.data,
        description: plan.originalPlan.description || `${plan.data} for ${plan.duration}`,
        price: plan.originalPlan.price || plan.price,
        dataAllowance: plan.originalPlan.dataAllowance || plan.data,
        validity: plan.originalPlan.validity || plan.duration,
        network: plan.originalPlan.network || selectedNetwork?.id || '',
        formattedPrice: plan.originalPlan.formattedPrice || plan.formattedPrice,
        formattedData: plan.originalPlan.formattedData || plan.data
      };
      selectDataPlan(normalizedPlan);
    } else {
      // Otherwise, construct a DataPlan object from the modal plan
      const dataPlan: DataPlan = {
        variationId: plan.id.toString(),
        variation_id: plan.id.toString(), // Add snake_case version for hook compatibility
        name: plan.data,
        description: `${plan.data} for ${plan.duration}`,
        price: plan.price,
        dataAllowance: plan.data,
        validity: plan.duration,
        network: selectedNetwork?.id || '',
        formattedPrice: plan.formattedPrice,
        formattedData: plan.data
      };
      selectDataPlan(dataPlan);
    }
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

    // Validate Nigerian phone number format (starts with 0 and is 11 digits)
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
    
    if (!selectedPlan) {
      showErrorMessage({
        type: 'validation',
        title: 'Data Plan Required',
        message: 'Please select a data plan to continue',
        autoHide: true,
        duration: 3000
      });
      return false;
    }

    if (selectedPlan.price > dailyLimit) {
      showErrorMessage({
        type: 'limit',
        title: 'Daily Limit Exceeded',
        message: `This data plan exceeds your daily limit of ₦${dailyLimit.toLocaleString()}`,
        autoHide: true,
        duration: 4000
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

  const handleDataPlanSelectorPress = (): void => {
    console.log('Data plan selector pressed');
    console.log('Selected network:', selectedNetwork);
    console.log('Loading:', loading);
    
    if (selectedNetwork && !loading) {
      setShowDataPlanModal(true);
    } else if (!selectedNetwork) {
      showErrorMessage({
        type: 'validation',
        title: 'Network Required',
        message: 'Please select a network provider first',
        autoHide: true,
        duration: 3000
      });
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
      const purchaseDataPayload: PurchaseData = {
        phone: mobileNumber,
        service_id: selectedNetwork!.id,
        variation_id: (selectedPlan!.variation_id || selectedPlan!.variationId).toString(), // Ensure string and use correct field
        amount: selectedPlan!.price,
        twoFactorCode: code,
        passwordpin: passwordPin
      };

      console.log('Purchase payload:', purchaseDataPayload); // Debug log

      const result = await purchaseData(purchaseDataPayload);

      if (result.success) {
        // Close all modals and reset state
        setShowTwoFactorModal(false);
        setShowPinModal(false);
        setShowConfirmationModal(false);
        setPasswordPin('');
        setTwoFactorCode('');
        
        if (result.data?.status === 'completed-api') {
          Alert.alert(
            'Success!', 
            `Data purchase completed successfully. ${selectedPlan!.formattedData} has been added to ${mobileNumber}`,
            [{ text: 'OK', onPress: () => router.back() }]
          );
        } else {
          Alert.alert(
            'Processing', 
            'Your data purchase is being processed. You will receive a notification when completed.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        }
      } else {
        // Handle errors
        setShowTwoFactorModal(false);
        
        const errorAction = getErrorAction?.(result.requiresAction);
        const errorType = getErrorType(result.error || 'GENERAL_ERROR');
        
        if (errorAction) {
          showErrorMessage({
            type: errorType,
            title: errorAction.title,
            message: errorAction.message,
            errorAction: errorAction,
            onActionPress: () => {
              if (errorAction.route) {
                router.push(errorAction.route);
              } else {
                // Handle retry scenarios
                if (result.requiresAction === 'RETRY_PIN') {
                  setPasswordPin('');
                  setShowPinModal(true);
                } else if (result.requiresAction === 'RETRY_2FA') {
                  setTwoFactorCode('');
                  setShowTwoFactorModal(true);
                }
              }
            },
            autoHide: false,
            dismissible: true
          });
        } else {
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
      console.error('Two factor submit error:', error); // Debug log
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

  // Form validation
  const isFormValid: boolean = !!(
    selectedNetwork && 
    mobileNumber.trim() && 
    mobileNumber.length === 11 &&
    mobileNumber.startsWith('0') &&
    selectedPlan
  );

  const transactionData: TransactionData = {
    network: selectedNetwork,
    amount: selectedPlan?.price.toString() || '0',
    phoneNumber: mobileNumber,
    selectedPlan: selectedPlan,
    rate: '1 NGNZ = 1 NGN' // Fixed typo: was NGNB, now NGNZ
  };

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
            errorAction={errorDisplayData.errorAction}
            onActionPress={errorDisplayData.onActionPress}
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
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.headerContainer}>
              {/* Back Button */}
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleGoBack}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>

              {/* Title */}
              <Text style={styles.headerTitle}>Buy Data</Text>

              {/* History Link */}
              <TouchableOpacity onPress={() => router.push('/history')}>
                <Text style={styles.historyLink}>History</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Network Provider Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Network Provider</Text>
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

          {/* Data Plan Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Plan</Text>
            <TouchableOpacity
              style={[
                styles.dataPlanSelector,
                !selectedNetwork && styles.dataPlanSelectorDisabled
              ]}
              onPress={handleDataPlanSelectorPress}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.dataPlanSelectorText,
                !selectedPlan && styles.dataPlanSelectorPlaceholder
              ]}>
                {selectedPlan 
                  ? `${selectedPlan.formattedData} - ${selectedPlan.formattedPrice}`
                  : selectedNetwork 
                    ? 'Select data plan'
                    : 'Select network first'
                }
              </Text>
              <Text style={styles.dropdownArrow}>↓</Text>
            </TouchableOpacity>
            {loading && selectedNetwork && (
              <Text style={styles.helperText}>
                Loading plans...
              </Text>
            )}
          </View>

          {/* Selected Plan Summary */}
          {selectedPlan && (
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Selected Plan</Text>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryData}>{selectedPlan.formattedData}</Text>
                <Text style={styles.summaryPrice}>{selectedPlan.formattedPrice}</Text>
              </View>
              <Text style={styles.summaryValidity}>Valid for {selectedPlan.validity}</Text>
            </View>
          )}
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

      <BottomTabNavigator activeTab="data" />

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

      {/* Data Confirmation Modal */}
      <DataConfirmationModal
        visible={showConfirmationModal}
        onClose={handleConfirmationModalClose}
        onConfirm={handleConfirmPurchase}
        loading={loading}
        transactionData={transactionData}
      />

      {/* Data Plans Modal */}
      <DataPlansModal
        visible={showDataPlanModal}
        onClose={() => {
          console.log('Closing data plans modal');
          setShowDataPlanModal(false);
        }}
        onSelectPlan={handleDataPlanSelect}
        selectedPlan={selectedPlan}
        networkId={selectedNetwork?.id || ''}
        networkName={selectedNetwork ? getNetworkDisplayName(selectedNetwork.id) : ''}
        loading={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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

  // Header styles
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 20,
    color: Colors.text?.primary || '#111827',
    fontWeight: '500',
  },
  headerTitle: {
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  historyLink: {
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 14,
    fontWeight: '500',
  },

  // Section styles
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 16,
  },

  // Network provider styles
  networkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  networkCard: {
    width: 80,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  networkCardSelected: {
    // No border highlighting for network cards
  },
  networkIcon: {
    width: 79,
    height: 53,
    resizeMode: 'contain',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 1,
  },
  checkmarkIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },

  // Mobile input styles
  mobileNumberSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mobileInputContainer: {
    flex: 1,
    backgroundColor: Colors.surface || '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mobileInput: {
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.regular || 'System',
    fontSize: 16,
    fontWeight: '400',
    paddingVertical: 4,
  },
  profileIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    width: 64,
    height: 46,
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
  },

  // Data plan styles
  dataPlanSelector: {
    backgroundColor: Colors.surface || '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataPlanSelectorDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  dataPlanSelectorText: {
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.regular || 'System',
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
  },
  dataPlanSelectorPlaceholder: {
    color: Colors.text?.secondary || '#6B7280',
  },
  dropdownArrow: {
    color: Colors.text?.secondary || '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },

  // Summary styles
  summarySection: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryData: {
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryPrice: {
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryValidity: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 12,
    fontWeight: '400',
  },

  // Button styles
  buttonContainer: {
    paddingHorizontal: 16,
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
});

export default BuyDataScreen;