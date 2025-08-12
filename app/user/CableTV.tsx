// Updated CableTvScreen with Showmax icon and proper 4-icon spacing

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  ImageSourcePropType
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabNavigator from '../../components/BottomNavigator';
import PinEntryModal from '../../components/PinEntry';
import TwoFactorAuthModal from '../../components/2FA';
import ErrorDisplay from '../../components/ErrorDisplay';
import CablePackageModal from '../../components/cablePackageModal';
import CableTvConfirmationModal from '../../components/CabletvConfirmModal';
import UtilityPurchaseSuccessModal from '../../components/Utilitysuccess';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { useCableTV } from '../../hooks/useCabletv';
import { useCustomer } from '../../hooks/useCustomer';

// ✅ UPDATED: Import cable TV provider icons including Showmax
const DstvIcon = require('../../components/icons/Dstv.png');
const GotvIcon = require('../../components/icons/Gotv.png');
const StarTimesIcon = require('../../components/icons/StarTimes.png');
const ShowmaxIcon = require('../../components/icons/Showmax.png');
const checkmarkIcon = require('../../components/icons/green-checkmark.png');
const profileIcon = require('../../components/icons/profile.png');

// ✅ UPDATED: Provider icon mapping including Showmax
const providerIcons: Record<string, ImageSourcePropType> = {
  'dstv': DstvIcon,
  'gotv': GotvIcon,
  'startimes': StarTimesIcon,
  'showmax': ShowmaxIcon,
};

// ✅ CONSISTENT TYPOGRAPHY STYLE
const baseTextStyle = {
  fontFamily: 'Bricolage Grotesque',
  fontWeight: '400' as const,
  fontSize: 14,
  lineHeight: 21,
  letterSpacing: 0,
};

// Interfaces
interface ErrorAction { 
  title: string; 
  message: string; 
  actionText: string; 
  route?: string; 
  priority?: 'high' | 'medium' | 'low'; 
}

interface ErrorDisplayData { 
  type?: string; 
  title?: string; 
  message?: string; 
  errorAction?: ErrorAction; 
  onActionPress?: () => void; 
  autoHide?: boolean; 
  duration?: number; 
  dismissible?: boolean; 
}

interface PurchaseData {
  customer_id: string;
  service_id: string;
  variation_id: string;
  subscription_type: string;
  amount: number;
  twoFactorCode: string;
  passwordpin: string;
}

interface CableTvPackage {
  variationId: string;
  name: string;
  description?: string;
  price: number;
  formattedPrice: string;
  formattedChannels?: string;
  channels?: number;
  features?: string[];
  category?: string;
  subscriptionType?: string;
  provider?: string;
  serviceName?: string;
  availability?: string;
  variation_id?: string;
  id?: string;
}

const CableTvScreen: React.FC = () => {
  const router = useRouter();
  const {
    loading,
    error,
    providers,
    selectedProvider,
    selectedSubscriptionType,
    selectedPackage,
    purchaseCableTV,
    getCableTVProviders,
    getSubscriptionTypes,
    selectProvider,
    selectSubscriptionType,
    selectPackage,
    clearErrors,
    validateCustomerId,
    formatCustomerId,
    getProviderDisplayName,
    formatAmount,
    isFormComplete,
    getErrorAction,
    getUserFriendlyMessage,
    initialize
  } = useCableTV();
  
  const { 
    verifyCableTVCustomer, 
    loading: customerLoading, 
    customerData, 
    error: customerError,
    clearError: clearCustomerError,
    clearCustomerData,
    formatCustomerName,
    getUserFriendlyMessage: getCustomerUserFriendlyMessage,
    getErrorAction: getCustomerErrorAction
  } = useCustomer();
  
  // Form state
  const [smartcardNumber, setSmartcardNumber] = useState<string>('');

  // Track customer verification separately to prevent clearing
  const [isCustomerVerified, setIsCustomerVerified] = useState<boolean>(false);
  const [verifiedSmartcardNumber, setVerifiedSmartcardNumber] = useState<string>('');

  // Modal states
  const [showPinModal, setShowPinModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // Error display
  const [showErrorDisplay, setShowErrorDisplay] = useState(false);
  const [errorDisplayData, setErrorDisplayData] = useState<ErrorDisplayData | null>(null);

  // Authentication
  const [passwordPin, setPasswordPin] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Initialize hook on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Set default subscription type to 'change' when component mounts
  useEffect(() => {
    const subscriptionTypes = getSubscriptionTypes();
    const defaultType = subscriptionTypes.find(t => t.id === 'change');
    if (defaultType && !selectedSubscriptionType) {
      selectSubscriptionType(defaultType);
    }
  }, [getSubscriptionTypes, selectSubscriptionType, selectedSubscriptionType]);

  // Monitor customer data changes
  useEffect(() => {
    if (customerData && smartcardNumber) {
      setIsCustomerVerified(true);
      setVerifiedSmartcardNumber(smartcardNumber);
    } else if (!customerData) {
      setIsCustomerVerified(false);
      setVerifiedSmartcardNumber('');
    }
  }, [customerData, smartcardNumber]);

  // Navigation handlers
  const handleGoBack = (): void => {
    router.back();
  };

  const handleHistoryPress = (): void => {
    router.push('/history');
  };

  // Error Helpers
  const showErrorMessage = (data: ErrorDisplayData) => { 
    setErrorDisplayData(data); 
    setShowErrorDisplay(true); 
  };
  
  const hideErrorDisplay = () => { 
    setShowErrorDisplay(false); 
    setErrorDisplayData(null); 
  };

  const getErrorType = (code: string): ErrorDisplayData['type'] => {
    switch (code) {
      case 'SETUP_2FA_REQUIRED': case 'SETUP_PIN_REQUIRED': return 'setup';
      case 'INVALID_2FA_CODE': case 'INVALID_PASSWORDPIN': return 'auth';
      case 'KYC_LIMIT_EXCEEDED': return 'limit';
      case 'INSUFFICIENT_BALANCE': return 'balance';
      case 'VALIDATION_ERROR': case 'INVALID_CUSTOMER_ID': case 'AMOUNT_PACKAGE_MISMATCH': return 'validation';
      case 'NETWORK_ERROR': return 'network';
      case 'SERVICE_ERROR': case 'PURCHASE_FAILED': return 'server';
      default: return 'general';
    }
  };

  // Provider selection that preserves customer data for same provider
  const handleProviderSelect = (provider: any): void => {
    console.log('🔄 Provider selected:', provider);
    
    // Only clear customer data if provider actually changes
    const providerChanged = selectedProvider?.id !== provider.id;
    
    selectProvider(provider);
    clearErrors();
    
    if (providerChanged) {
      console.log('🔄 Provider changed, clearing customer and package data');
      // Clear customer verification when provider changes
      if (customerData) {
        clearCustomerData();
        clearCustomerError();
        setIsCustomerVerified(false);
        setVerifiedSmartcardNumber('');
      }
      // Clear selected package when provider changes
      if (selectedPackage) {
        console.log('🗑️ Clearing previously selected package');
        selectPackage(null);
      }
    } else {
      console.log('🔄 Same provider selected, keeping customer and package data');
    }
  };

  // Only clear customer data when smartcard number actually changes
  const handleSmartcardNumberChange = (value: string): void => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setSmartcardNumber(numericValue);
    
    // Only clear customer data if the smartcard number actually changed
    if (verifiedSmartcardNumber && numericValue !== verifiedSmartcardNumber) {
      console.log('🔄 Smartcard number changed, clearing customer data');
      if (customerData) {
        clearCustomerData();
        clearCustomerError();
        setIsCustomerVerified(false);
        setVerifiedSmartcardNumber('');
      }
    }
  };

  const handleVerifySmartcard = async (): Promise<void> => {
    if (!smartcardNumber.trim()) {
      showErrorMessage({
        type: 'validation',
        title: 'Smartcard Number Required',
        message: 'Please enter your smartcard/IUC number',
        autoHide: true,
        duration: 3000
      });
      return;
    }

    if (!selectedProvider) {
      showErrorMessage({
        type: 'validation',
        title: 'Provider Required',
        message: 'Please select a cable TV provider first',
        autoHide: true,
        duration: 3000
      });
      return;
    }

    if (!validateCustomerId(smartcardNumber)) {
      showErrorMessage({
        type: 'validation',
        title: 'Invalid Smartcard Number',
        message: 'Please enter a valid smartcard/IUC number (8-20 characters, alphanumeric)',
        autoHide: true,
        duration: 3000
      });
      return;
    }

    // Clear any previous customer errors
    clearCustomerError();

    try {
      const result = await verifyCableTVCustomer(
        smartcardNumber, 
        selectedProvider.id
      );
      
      if (result && result.success) {
        console.log('✅ Customer verified successfully');
        // Customer verified successfully - verification state will be updated by useEffect
      } else {
        // Handle verification failure
        const errorAction = getCustomerErrorAction?.(result?.requiresAction || 'RETRY');
        const friendlyMessage = getCustomerUserFriendlyMessage?.(result?.error, result?.message);
        
        if (errorAction) {
          showErrorMessage({
            type: 'validation',
            title: errorAction.title,
            message: errorAction.message,
            autoHide: true,
            duration: 4000
          });
        } else {
          showErrorMessage({
            type: 'server',
            title: 'Verification Failed',
            message: friendlyMessage || 'Unable to verify customer. Please check your information.',
            autoHide: true,
            duration: 4000
          });
        }
      }
    } catch (error) {
      // Error handling is already done in the hook, but show user-friendly message
      const friendlyMessage = getCustomerUserFriendlyMessage?.(customerError, 'Unable to verify customer at this time.');
      showErrorMessage({
        type: 'server',
        title: 'Verification Error',
        message: friendlyMessage || 'Unable to verify customer at this time.',
        autoHide: true,
        duration: 4000
      });
    }
  };

  // Simplified package selection (modal now guarantees good data)
  const handlePackageSelect = (pkg: CableTvPackage): void => {
    console.log('📦 Normalized package received from modal:', pkg);
    
    const packageForApp = {
      id: pkg.variationId,              // Guaranteed to exist
      variation_id: pkg.variationId,    // Modal ensures this is set
      name: pkg.name,                   // Modal validates this
      price: pkg.price,                 // Modal validates this > 0
      formattedPrice: pkg.formattedPrice,
      data: pkg.name,
      duration: pkg.subscriptionType,
      description: pkg.description,
      channels: pkg.channels,
      features: pkg.features
    };
    
    console.log('📦 Package for app:', packageForApp);
    selectPackage(packageForApp);
    setShowPlanModal(false);
  };

  // Purchase flow
  const validateForm = (): boolean => {
    clearErrors();
    
    if (!selectedProvider) {
      showErrorMessage({
        type: 'validation',
        title: 'Provider Required',
        message: 'Please select a cable TV provider',
        autoHide: true,
        duration: 3000
      });
      return false;
    }
    
    if (!smartcardNumber.trim()) {
      showErrorMessage({
        type: 'validation',
        title: 'Smartcard Number Required',
        message: 'Please enter your smartcard/IUC number',
        autoHide: true,
        duration: 3000
      });
      return false;
    }
    
    if (!validateCustomerId(smartcardNumber)) {
      showErrorMessage({
        type: 'validation',
        title: 'Invalid Smartcard Number',
        message: 'Please enter a valid smartcard/IUC number',
        autoHide: true,
        duration: 3000
      });
      return false;
    }

    // Use our tracked verification state
    if (!isCustomerVerified || !customerData) {
      showErrorMessage({
        type: 'validation',
        title: 'Customer Not Verified',
        message: 'Please verify your smartcard number first',
        autoHide: true,
        duration: 3000
      });
      return false;
    }
    
    if (!selectedPackage) {
      showErrorMessage({
        type: 'validation',
        title: 'Package Required',
        message: 'Please select a subscription package',
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

  const handleConfirmationConfirm = (): void => {
    setShowConfirmationModal(false);
    setShowPinModal(true);
  };

  const handlePinSubmit = (pin: string) => {
    setPasswordPin(pin);
    setShowPinModal(false);
    setShowTwoFactorModal(true);
  };

  // Simplified two factor submit (no need to re-validate variation_id)
  const handleTwoFactorSubmit = async (code: string) => {
    setTwoFactorCode(code);
    
    if (!selectedProvider || !selectedPackage || !selectedSubscriptionType) {
      showErrorMessage({
        type: 'validation',
        title: 'Missing Information',
        message: 'Please ensure all fields are properly selected',
        autoHide: true,
        duration: 3000
      });
      return;
    }

    // No need to validate variation_id anymore - modal guarantees it exists
    const variationId = selectedPackage.variation_id;

    try {
      const purchaseData: PurchaseData = {
        customer_id: smartcardNumber,
        service_id: selectedProvider.id,
        variation_id: variationId,  // Guaranteed to be valid
        subscription_type: selectedSubscriptionType.id,
        amount: selectedPackage.price,
        twoFactorCode: code,
        passwordpin: passwordPin
      };

      console.log('🚀 Purchase data:', {
        ...purchaseData,
        twoFactorCode: '***',
        passwordpin: '***'
      });

      const result = await purchaseCableTV(purchaseData);
      
      if (result.success) {
        setShowTwoFactorModal(false);
        setShowPinModal(false);
        setPasswordPin('');
        setTwoFactorCode('');
        
        // Show success modal instead of Alert
        setShowSuccessModal(true);
      } else {
        setShowTwoFactorModal(false);
        const errorAction = getErrorAction?.(result.requiresAction);
        const errorType = getErrorType(result.error || 'GENERAL_ERROR');
        
        if (errorAction) {
          showErrorMessage({
            type: errorType,
            title: errorAction.title,
            message: errorAction.message,
            errorAction,
            onActionPress: () => {
              if (errorAction.route) {
                router.push(errorAction.route);
              } else if (result.requiresAction === 'RETRY_PIN') {
                setPasswordPin('');
                setShowPinModal(true);
              } else if (result.requiresAction === 'RETRY_2FA') {
                setTwoFactorCode('');
                setShowTwoFactorModal(true);
              }
            },
            autoHide: false,
            dismissible: true
          });
        } else {
          showErrorMessage({
            type: errorType,
            title: 'Purchase Failed',
            message: getUserFriendlyMessage?.(result.error || 'PURCHASE_FAILED', result.message || 'Cable TV purchase failed'),
            autoHide: true,
            duration: 4000
          });
        }
      }
    } catch (err) {
      console.error("Purchase error:", err);
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

  // Success modal handler
  const handleSuccessModalClose = (): void => {
    setShowSuccessModal(false);
  };

  // Form validation includes customer verification state
  const isFormValid: boolean = !!(
    selectedProvider && 
    smartcardNumber.trim() &&
    isCustomerVerified && // Use our tracked state
    customerData && 
    selectedPackage
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
        
        {showErrorDisplay && errorDisplayData && (
          <ErrorDisplay {...errorDisplayData} onDismiss={hideErrorDisplay} />
        )}

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.headerContainer}>
              <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Cable TV</Text>
              <TouchableOpacity onPress={handleHistoryPress}>
                <Text style={styles.historyLink}>History</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ✅ UPDATED: Provider Selection Section with proper 4-icon spacing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Cable TV Provider</Text>
            <View style={styles.providerGrid}>
              {providers.map((provider) => (
                <TouchableOpacity
                  key={provider.id}
                  style={styles.providerCard}
                  onPress={() => handleProviderSelect(provider)}
                  activeOpacity={0.8}
                >
                  <Image 
                    source={providerIcons[provider.id]}
                    style={[
                      styles.providerIcon,
                      provider.id === 'showmax' && styles.showmaxIcon
                    ]}
                    resizeMode="contain"
                  />
                  {selectedProvider?.id === provider.id && (
                    <View style={styles.checkmarkContainer}>
                      <Image source={checkmarkIcon} style={styles.checkmarkIcon} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Smartcard Number Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Smartcard/IUC Number</Text>
            <View style={styles.smartcardInputContainer}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter smartcard/IUC number"
                  placeholderTextColor={Colors.text?.secondary}
                  value={smartcardNumber}
                  onChangeText={handleSmartcardNumberChange}
                  keyboardType="numeric"
                  maxLength={15}
                />
              </View>
              <TouchableOpacity style={styles.profileIconContainer}>
                <Image source={profileIcon} style={styles.profileIcon} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  (!smartcardNumber.trim() || !selectedProvider || customerLoading) && styles.verifyButtonDisabled
                ]}
                onPress={handleVerifySmartcard}
                disabled={!smartcardNumber.trim() || !selectedProvider || customerLoading}
                activeOpacity={0.8}
              >
                {customerLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              Enter your smartcard or IUC number (e.g., 1234567890)
            </Text>
          </View>

          {/* Customer Name Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.uneditableInput]}
                placeholder="Customer name will appear here"
                placeholderTextColor={Colors.text?.secondary}
                value={customerData ? (customerData.customer_name || '').trim() : ''}
                editable={false}
              />
            </View>
          </View>

          {/* Plan Selection Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Package</Text>
            
            {/* Bouquet Tab */}
            <TouchableOpacity
              style={[
                styles.planTab,
                (!selectedProvider || !isCustomerVerified) && styles.planTabDisabled
              ]}
              onPress={() => {
                console.log('📱 Opening package modal for provider:', selectedProvider?.id);
                console.log('👤 Customer verified:', isCustomerVerified);
                setShowPlanModal(true);
              }}
              disabled={!selectedProvider || !isCustomerVerified}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.planTabText,
                !selectedPackage && styles.planTabPlaceholder
              ]}>
                {selectedPackage 
                  ? selectedPackage.name
                  : selectedProvider && isCustomerVerified
                    ? 'Select bouquet'
                    : 'Select provider and verify customer first'
                }
              </Text>
              {selectedPackage && (
                <Text style={styles.dropdownArrow}>↓</Text>
              )}
            </TouchableOpacity>
            
            {/* Amount Tab */}
            {selectedPackage && (
              <TouchableOpacity
                style={styles.amountTab}
                activeOpacity={0.8}
              >
                <Text style={styles.amountTabText}>
                  N{selectedPackage.price.toLocaleString()}
                </Text>
              </TouchableOpacity>
            )}
            
            {loading && selectedProvider && (
              <Text style={styles.helperText}>Loading packages...</Text>
            )}
          </View>

          {/* Summary */}
          {selectedPackage && (
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Selected Package</Text>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryData}>{selectedPackage.name}</Text>
                <Text style={styles.summaryPrice}>{formatAmount(selectedPackage.price)}</Text>
              </View>
              <Text style={styles.summaryValidity}>Duration: {selectedPackage.duration || '1 Month'}</Text>
              {selectedProvider && (
                <Text style={styles.summaryProvider}>Provider: {getProviderDisplayName(selectedProvider.id)}</Text>
              )}
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

        <CablePackageModal
          visible={showPlanModal}
          onClose={() => setShowPlanModal(false)}
          onSelectPackage={handlePackageSelect}
          selectedPackage={selectedPackage ? {
            variationId: selectedPackage.variation_id || selectedPackage.id,
            name: selectedPackage.name,
            description: selectedPackage.description || '',
            price: selectedPackage.price,
            formattedPrice: selectedPackage.formattedPrice || `₦${selectedPackage.price?.toLocaleString()}`,
            formattedChannels: selectedPackage.channels ? `${selectedPackage.channels} channels` : 'Multiple channels',
            channels: selectedPackage.channels || 0,
            features: selectedPackage.features || [],
            category: 'standard',
            subscriptionType: selectedPackage.duration || '1 Month',
            provider: selectedProvider?.id || '',
            serviceName: selectedProvider?.name || '',
            availability: 'available'
          } : null}
          provider={selectedProvider}
        />

        <CableTvConfirmationModal
          visible={showConfirmationModal}
          onClose={() => setShowConfirmationModal(false)}
          onConfirm={handleConfirmationConfirm}
          loading={loading}
          provider={selectedProvider ? {
            id: selectedProvider.id,
            name: selectedProvider.name,
            icon: providerIcons[selectedProvider.id]
          } : null}
          smartcardNumber={smartcardNumber}
          customerData={customerData}
          selectedPackage={selectedPackage}
        />

        {/* Success Modal */}
        <UtilityPurchaseSuccessModal
          visible={showSuccessModal}
          utilityType="Cable TV"
          amount={selectedPackage?.name || ''}
          phoneNumber={smartcardNumber}
          network={selectedProvider?.name || ''}
          onContinue={handleSuccessModalClose}
          additionalInfo={selectedPackage ? `Duration: ${selectedPackage.duration || '1 Month'}` : undefined}
        />
      </SafeAreaView>

      <BottomTabNavigator activeTab="cabletv" />

      <PinEntryModal 
        visible={showPinModal} 
        onClose={() => { 
          setShowPinModal(false); 
          setPasswordPin(''); 
        }} 
        onSubmit={handlePinSubmit} 
        loading={false} 
        title="Enter Password PIN" 
        subtitle="Enter your 6-digit PIN to continue" 
      />
      
      <TwoFactorAuthModal 
        visible={showTwoFactorModal} 
        onClose={() => { 
          setShowTwoFactorModal(false); 
          setTwoFactorCode(''); 
          setShowPinModal(true); 
        }} 
        onSubmit={handleTwoFactorSubmit} 
        loading={loading} 
        title="Two-Factor Authentication" 
        subtitle="Enter 6-digit authenticator code" 
      />
    </View>
  );
};

// ✅ UPDATED STYLES WITH PROPER 4-ICON SPACING AND CONSISTENT TYPOGRAPHY
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
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  backButton: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 20 
  },
  backButtonText: { 
    ...baseTextStyle,
    fontSize: 20, 
    color: Colors.text?.primary || '#111827', 
    fontWeight: '500' 
  },
  headerTitle: {
    ...baseTextStyle,
    color: '#35297F',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  historyLink: { 
    ...baseTextStyle,
    color: '#35297F', 
    fontWeight: '500' 
  },
  section: { 
    paddingHorizontal: 16, 
    marginBottom: 24 
  },
  sectionTitle: {
    ...baseTextStyle,
    color: Colors.text?.secondary || '#6B7280',
    marginBottom: 16,
  },
  
  // ✅ UPDATED: Provider grid with same spacing as data screen (4 icons)
  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12, // Same as data screen
  },
  
  // ✅ UPDATED: Provider card with fixed width like data screen
  providerCard: {
    width: 80, // Same as data screen networkCard width
    height: 60, // Same as data screen networkCard height
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  
  // ✅ UPDATED: Provider icon with proper sizing
  providerIcon: {
    width: 79, // Same as data screen networkIcon width
    height: 53, // Same as data screen networkIcon height
    resizeMode: 'contain',
  },
  
  // ✅ NEW: Specific styling for Showmax icon to match others
  showmaxIcon: {
    width: 75, // Slightly smaller to match visual weight
    height: 48, // Adjusted height for better proportion
    borderRadius: 6, // Soften sharp borders
    backgroundColor: 'transparent',
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
  smartcardInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  inputContainer: { 
    flex: 1,
    backgroundColor: Colors.surface || '#FFFFFF', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    paddingHorizontal: 16, 
    paddingVertical: 12 
  },
  input: { 
    ...baseTextStyle,
    color: Colors.text?.primary || '#111827',
    fontSize: 16,
    paddingVertical: 4 
  },
  uneditableInput: {
    backgroundColor: '#F9FAFB',
    color: Colors.text?.secondary || '#6B7280',
  },
  profileIconContainer: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  profileIcon: { 
    width: 40, 
    height: 30, 
    resizeMode: 'contain' 
  },
  verifyButton: {
    backgroundColor: '#35297F',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  verifyButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  verifyButtonText: {
    ...baseTextStyle,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  helperText: { 
    ...baseTextStyle,
    color: Colors.text?.secondary || '#6B7280',
    fontSize: 11,
    marginTop: 6, 
    fontStyle: 'italic' 
  },
  planTab: {
    backgroundColor: Colors.surface || '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planTabDisabled: { 
    backgroundColor: '#F9FAFB', 
    borderColor: '#E5E7EB' 
  },
  planTabText: { 
    ...baseTextStyle,
    color: Colors.text?.primary || '#111827',
    fontSize: 16,
    flex: 1 
  },
  planTabPlaceholder: { 
    color: Colors.text?.secondary || '#6B7280' 
  },
  amountTab: {
    backgroundColor: Colors.surface || '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'flex-start',
  },
  amountTabText: {
    ...baseTextStyle,
    color: Colors.text?.primary || '#111827',
    fontSize: 16,
  },
  dropdownArrow: { 
    ...baseTextStyle,
    color: Colors.text?.secondary || '#6B7280', 
    fontSize: 16, 
    fontWeight: '500' 
  },
  summarySection: { 
    backgroundColor: '#F3F4F6', 
    borderRadius: 8, 
    padding: 16, 
    marginHorizontal: 16, 
    marginBottom: 24 
  },
  summaryTitle: { 
    ...baseTextStyle,
    color: Colors.text?.primary || '#111827',
    fontWeight: '600', 
    marginBottom: 8 
  },
  summaryContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 4 
  },
  summaryData: { 
    ...baseTextStyle,
    color: Colors.text?.primary || '#111827',
    fontSize: 16, 
    fontWeight: '600' 
  },
  summaryPrice: { 
    ...baseTextStyle,
    color: '#35297F',
    fontSize: 16, 
    fontWeight: '600' 
  },
  summaryValidity: { 
    ...baseTextStyle,
    color: Colors.text?.secondary || '#6B7280',
    fontSize: 12,
  },
  summaryProvider: { 
    ...baseTextStyle,
    color: Colors.text?.secondary || '#6B7280',
    fontSize: 12,
    marginTop: 2
  },
  buttonContainer: { 
    paddingHorizontal: 16, 
    paddingVertical: 24, 
    backgroundColor: Colors.background || '#F8F9FA' 
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
    shadowOpacity: 0 
  },
  continueButtonText: { 
    ...baseTextStyle,
    color: '#FFFFFF',
    fontSize: 16, 
    fontWeight: '600' 
  },
});

export default CableTvScreen;