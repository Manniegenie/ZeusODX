import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    ImageSourcePropType,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import TwoFactorAuthModal from '../../components/2FA';
import BottomTabNavigator from '../../components/BottomNavigator';
import DataConfirmationModal from '../../components/Dataconfirm';
import DataPlansModal from '../../components/DataPlanModal';
import ErrorDisplay from '../../components/ErrorDisplay';
import PinEntryModal from '../../components/PinEntry';
import UtilityPurchaseSuccessModal from '../../components/Utilitysuccess';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useData } from '../../hooks/useData';

// Icons
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
import ScreenHeader from '../../components/ScreenHeader'; // shared back icon

// Get screen dimensions for responsive design
const { width: screenWidth } = Dimensions.get('window');

// Calculate responsive dimensions
const getResponsiveDimensions = () => {
  const isSmallScreen = screenWidth < 350;
  const isMediumScreen = screenWidth >= 350 && screenWidth < 400;
  
  return {
    networkCardWidth: isSmallScreen ? (screenWidth - 64) / 4 - 6 : isMediumScreen ? 75 : 80,
    networkCardHeight: isSmallScreen ? 45 : isMediumScreen ? 55 : 60,
    networkIconWidth: isSmallScreen ? (screenWidth - 64) / 4 - 8 : isMediumScreen ? 73 : 79,
    networkIconHeight: isSmallScreen ? 40 : isMediumScreen ? 48 : 53,
    profileIconWidth: isSmallScreen ? 48 : isMediumScreen ? 56 : 64,
    profileIconHeight: isSmallScreen ? 36 : isMediumScreen ? 42 : 46,
    checkmarkSize: isSmallScreen ? 16 : 20,
    horizontalPadding: isSmallScreen ? 12 : 16,
    networkGap: isSmallScreen ? 8 : 12,
  };
};

const responsiveDims = getResponsiveDimensions();

// Interfaces (keeping existing interfaces)
interface ErrorAction { title: string; message: string; actionText: string; route?: string; priority?: 'high' | 'medium' | 'low'; }
interface ErrorDisplayData { type?: 'setup' | 'auth' | 'limit' | 'balance' | 'validation' | 'network' | 'server' | 'general' | 'success' | 'notFound'; title?: string; message?: string; autoHide?: boolean; duration?: number; dismissible?: boolean; onActionPress?: () => void; }
interface NetworkProvider { id: string; name: string; iconSrc: ImageSourcePropType; color: string; }
interface DataPlan { variationId: string; variation_id?: string; name: string; description: string; price: number; dataAllowance: string; validity: string; network: string; formattedPrice: string; formattedData: string; }
interface PurchaseData { phone: string; service_id: string; variation_id: string; amount: number; twoFactorCode: string; passwordpin: string; }
interface TransactionData { network: NetworkProvider | null; amount: string; phoneNumber: string; selectedPlan: DataPlan | null; rate: string; }

const BuyDataScreen: React.FC = () => {
  const router = useRouter();
  const {
    loading, error, selectedPlan, purchaseData, selectDataPlan, clearSelectedPlan, clearErrors,
    formatPhoneNumber, getNetworkDisplayName, getErrorAction
  } = useData();

  // Form states
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkProvider | null>(null);
  const [mobileNumber, setMobileNumber] = useState<string>('');

  // Modal states
  const [showPinModal, setShowPinModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showDataPlanModal, setShowDataPlanModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Error display
  const [showErrorDisplay, setShowErrorDisplay] = useState(false);
  const [errorDisplayData, setErrorDisplayData] = useState<ErrorDisplayData | null>(null);

  // Authentication
  const [passwordPin, setPasswordPin] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Network Providers
  const networkProviders: NetworkProvider[] = [
    { id: 'mtn', name: 'MTN', iconSrc: mtnIcon, color: '#FFCC02' },
    { id: 'glo', name: 'Glo', iconSrc: gloIcon, color: '#00A651' },
    { id: 'airtel', name: 'Airtel', iconSrc: airtelIcon, color: '#FF0000' },
    { id: '9mobile', name: '9mobile', iconSrc: nineMobileIcon, color: '#00AA4F' },
  ];

  // Navigation (back disabled while loading)
  const backDisabled = Boolean(loading);

  const handleGoBack = () => {
    if (!backDisabled) router.back();
  };

  // Helper function to safely get network display name
  const getSafeNetworkDisplayName = (networkId: string): string => {
    try {
      if (!networkId || !getNetworkDisplayName) return '';
      const displayName = getNetworkDisplayName(networkId);
      return displayName || '';
    } catch (error) {
      console.warn('Error getting network display name:', error);
      return networkId || '';
    }
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
      case 'VALIDATION_ERROR': case 'INVALID_DATA_PLAN': case 'AMOUNT_PLAN_MISMATCH': return 'validation';
      case 'NETWORK_ERROR': return 'network';
      case 'SERVICE_ERROR': case 'PURCHASE_FAILED': return 'server';
      default: return 'general';
    }
  };

  // Event Handlers
  const handleNetworkSelect = (network: NetworkProvider) => { 
    setSelectedNetwork(network); 
    clearSelectedPlan(); 
  };

  // Improved handleDataPlanSelect with better error handling
  const handleDataPlanSelect = (plan: any): void => {
    console.log('Received plan data:', plan);
    
    if (!plan) { 
      console.error("Plan is undefined"); 
      showErrorMessage({
        type: 'validation',
        title: 'Invalid Plan',
        message: 'Selected plan data is invalid',
        autoHide: true,
        duration: 3000
      });
      return; 
    }
    
    try {
      const extractSafeValue = (value: any, fallback: any = ''): any => {
        return value !== null && value !== undefined ? value : fallback;
      };

      const extractSafeString = (value: any, fallback: string = ''): string => {
        if (value === null || value === undefined) return fallback;
        return typeof value === 'string' ? value : String(value);
      };

      const extractSafeNumber = (value: any, fallback: number = 0): number => {
        if (value === null || value === undefined) return fallback;
        const num = typeof value === 'number' ? value : parseFloat(value);
        return isNaN(num) ? fallback : num;
      };

      const normalizedPlan: DataPlan = {
        variationId: extractSafeString(
          plan.originalPlan?.variationId || 
          plan.variation_id || 
          plan.variationId || 
          plan.id
        ),
        variation_id: extractSafeString(
          plan.originalPlan?.variationId || 
          plan.variation_id || 
          plan.variationId || 
          plan.id
        ),
        name: extractSafeString(
          plan.originalPlan?.name || 
          plan.name || 
          plan.data
        ),
        description: extractSafeString(
          plan.originalPlan?.description || 
          plan.description ||
          `${extractSafeString(plan.data)} for ${extractSafeString(plan.duration)}`
        ),
        price: extractSafeNumber(
          plan.originalPlan?.price || 
          plan.price
        ),
        dataAllowance: extractSafeString(
          plan.originalPlan?.dataAllowance || 
          plan.dataAllowance || 
          plan.data
        ),
        validity: extractSafeString(
          plan.originalPlan?.validity || 
          plan.validity || 
          plan.duration
        ),
        network: extractSafeString(
          plan.originalPlan?.network || 
          plan.network || 
          selectedNetwork?.id
        ),
        formattedPrice: extractSafeString(
          plan.originalPlan?.formattedPrice || 
          plan.formattedPrice ||
          `₦${extractSafeNumber(plan.originalPlan?.price || plan.price).toLocaleString()}`
        ),
        formattedData: extractSafeString(
          plan.originalPlan?.formattedData || 
          plan.formattedData || 
          plan.data
        ),
      };

      if (!normalizedPlan.variationId) {
        throw new Error('Plan variation ID is missing');
      }
      if (!normalizedPlan.name && !normalizedPlan.dataAllowance) {
        throw new Error('Plan name or data allowance is missing');
      }
      if (normalizedPlan.price <= 0) {
        throw new Error('Plan price is invalid');
      }

      console.log('Normalized plan:', normalizedPlan);
      selectDataPlan(normalizedPlan);
      setShowDataPlanModal(false);
      
    } catch (err) { 
      console.error("Error selecting plan:", err);
      showErrorMessage({
        type: 'validation',
        title: 'Plan Selection Error',
        message: 'Failed to select data plan. Please try again.',
        autoHide: true,
        duration: 4000
      });
    }
  };

  const validateForm = (): boolean => {
    clearErrors();
    
    if (!selectedNetwork) { 
      showErrorMessage({ 
        type: 'validation', 
        title: 'Network Required', 
        message: 'Select a network provider', 
        autoHide: true, 
        duration: 3000 
      }); 
      return false; 
    }
    
    if (!mobileNumber.trim()) { 
      showErrorMessage({ 
        type: 'validation', 
        title: 'Phone Number Required', 
        message: 'Enter a mobile number', 
        autoHide: true, 
        duration: 3000 
      }); 
      return false; 
    }
    
    if (mobileNumber.length !== 11 || !mobileNumber.startsWith('0')) { 
      showErrorMessage({ 
        type: 'validation', 
        title: 'Invalid Phone Number', 
        message: 'Enter a valid 11-digit Nigerian phone number', 
        autoHide: true, 
        duration: 3000 
      }); 
      return false; 
    }
    
    if (!selectedPlan) { 
      showErrorMessage({ 
        type: 'validation', 
        title: 'Data Plan Required', 
        message: 'Select a data plan', 
        autoHide: true, 
        duration: 3000 
      }); 
      return false; 
    }
    
    return true;
  };

  const handleContinue = () => { 
    if (validateForm()) setShowConfirmationModal(true); 
  };

  const handleDataPlanSelectorPress = () => { 
    if (!selectedNetwork) {
      showErrorMessage({ 
        type: 'validation', 
        title: 'Network Required', 
        message: 'Select a network first', 
        autoHide: true, 
        duration: 3000
      });
      return;
    }

    if (loading) {
      showErrorMessage({ 
        type: 'validation', 
        title: 'Please Wait', 
        message: 'Plans are loading, please wait...', 
        autoHide: true, 
        duration: 2000 
      });
      return;
    }

    try {
      setShowDataPlanModal(true);
    } catch (error) {
      console.error('Error opening data plan modal:', error);
      showErrorMessage({ 
        type: 'general', 
        title: 'Error', 
        message: 'Unable to open data plans. Please try again.', 
        autoHide: true, 
        duration: 3000 
      });
    }
  };

  const handleConfirmPurchase = () => { 
    setShowConfirmationModal(false); 
    setShowPinModal(true); 
  };

  const handlePinSubmit = (pin: string) => { 
    setPasswordPin(pin); 
    setShowPinModal(false); 
    setShowTwoFactorModal(true); 
  };

  const handleTwoFactorSubmit = async (code: string) => {
    setTwoFactorCode(code);
    try {
      const payload: PurchaseData = {
        phone: mobileNumber,
        service_id: selectedNetwork!.id,
        variation_id: selectedPlan ? ((selectedPlan as DataPlan).variation_id || (selectedPlan as DataPlan).variationId).toString() : '',
        amount: selectedPlan ? (selectedPlan as DataPlan).price : 0,
        twoFactorCode: code,
        passwordpin: passwordPin
      };
      
      const result = await purchaseData(payload);
      
      if ((result as any).success) {
        setShowTwoFactorModal(false); 
        setShowPinModal(false); 
        setShowConfirmationModal(false);
        setPasswordPin(''); 
        setTwoFactorCode('');
        
        setShowSuccessModal(true);
      } else {
        setShowTwoFactorModal(false);
        const errorAction = getErrorAction?.((result as any).requiresAction);
        const errorType = getErrorType((result as any).error || 'GENERAL_ERROR');
        
        if (errorAction) {
          showErrorMessage({ 
            type: errorType, 
            title: errorAction.title, 
            message: errorAction.message, 
            onActionPress: () => {
              if (errorAction.route) router.push(errorAction.route);
              else if ((result as any).requiresAction === 'RETRY_PIN') { 
                setPasswordPin(''); 
                setShowPinModal(true); 
              }
              else if ((result as any).requiresAction === 'RETRY_2FA') { 
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
            message: (result as any).message || 'Try again later', 
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
        message: 'An unexpected error occurred. Try again.', 
        autoHide: true, 
        duration: 4000 
      });
    }
  };

  const handleDataPlanModalClose = () => {
    try {
      setShowDataPlanModal(false);
    } catch (error) {
      console.error('Error closing data plan modal:', error);
    }
  };

  const handleSuccessModalClose = (): void => {
    setShowSuccessModal(false);
  };

  // Form validity
  const isFormValid = !!(selectedNetwork && mobileNumber.trim() && mobileNumber.length === 11 && mobileNumber.startsWith('0') && selectedPlan);

  const transactionData: TransactionData = {
    network: selectedNetwork,
    amount: selectedPlan ? (selectedPlan as DataPlan).price.toString() : '0',
    phoneNumber: mobileNumber,
    selectedPlan: selectedPlan || null,
    rate: '1 NGNZ = 1 NGN'
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
        
        {showErrorDisplay && errorDisplayData && (
          <ErrorDisplay {...errorDisplayData} onDismiss={hideErrorDisplay} />
        )}
        
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <ScreenHeader
            title="Buy Data"
            onBack={handleGoBack}
            backDisabled={backDisabled}
          />

          {/* Network Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Network Provider</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.networkScrollContainer}
              style={styles.networkScrollView}
            >
              <View style={styles.networkGrid}>
                {networkProviders.map((n) => (
                  <TouchableOpacity 
                    key={n.id} 
                    style={[
                      styles.networkCard, 
                      selectedNetwork?.id === n.id && styles.networkCardSelected
                    ]} 
                    onPress={() => handleNetworkSelect(n)}
                    activeOpacity={0.8}
                  >
                    <Image source={n.iconSrc} style={styles.networkIcon} />
                    {selectedNetwork?.id === n.id && (
                      <View style={styles.checkmarkContainer}>
                        <Image source={checkmarkIcon} style={styles.checkmarkIcon} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Phone Number */}
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

          {/* Data Plan */}
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
                  ? `${(selectedPlan as DataPlan).formattedData} - ${(selectedPlan as DataPlan).formattedPrice}` 
                  : selectedNetwork 
                    ? 'Select data plan' 
                    : 'Select network first'
                }
              </Text>
              <Text style={styles.dropdownArrow}>↓</Text>
            </TouchableOpacity>
            {loading && selectedNetwork && (
              <Text style={styles.helperText}>Loading plans...</Text>
            )}
          </View>

          {/* Summary */}
          {selectedPlan && (
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Selected Plan</Text>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryData}>{(selectedPlan as DataPlan).formattedData}</Text>
                <Text style={styles.summaryPrice}>{(selectedPlan as DataPlan).formattedPrice}</Text>
              </View>
              <Text style={styles.summaryValidity}>Valid for {(selectedPlan as DataPlan).validity}</Text>
            </View>
          )}

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

      <BottomTabNavigator activeTab="data" />

      {/* Modals */}
      <PinEntryModal 
        visible={showPinModal} 
        onClose={() => { 
          setShowPinModal(false); 
          setPasswordPin(''); 
          setShowConfirmationModal(true); 
        }} 
        onSubmit={handlePinSubmit} 
        loading={false} 
        title="Enter Password PIN" 
        subtitle="Enter your 6-digit PIN" 
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
      
      <DataConfirmationModal 
        visible={showConfirmationModal} 
        onClose={() => setShowConfirmationModal(false)} 
        onConfirm={handleConfirmPurchase} 
        loading={loading} 
        transactionData={transactionData} 
      />
      
      <DataPlansModal 
        visible={showDataPlanModal} 
        onClose={handleDataPlanModalClose} 
        onSelectPlan={handleDataPlanSelect} 
        selectedPlan={selectedPlan} 
        networkId={selectedNetwork?.id || ''} 
        networkName={selectedNetwork?.id ? getSafeNetworkDisplayName(selectedNetwork.id) : ''} 
        loading={loading} 
      />

      <UtilityPurchaseSuccessModal
        visible={showSuccessModal}
        utilityType="Data"
        amount={selectedPlan ? (selectedPlan as DataPlan).formattedData : ''}
        phoneNumber={mobileNumber}
        network={selectedNetwork?.name || ''}
        onContinue={handleSuccessModalClose}
        additionalInfo={selectedPlan ? `Valid for ${(selectedPlan as DataPlan).validity}` : undefined}
      />
    </View>
  );
};

// Responsive styles
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
  scrollContent: {
    paddingBottom: 20,
  },
  
  historyLink: { 
    color: '#35297F', 
    fontFamily: Typography.medium, 
    fontSize: 14, 
    fontWeight: '500' 
  },
  
  // Section styles
  section: { 
    paddingHorizontal: responsiveDims.horizontalPadding, 
    marginBottom: 24 
  },
  sectionTitle: { 
    color: Colors.text?.secondary || '#6B7280', 
    fontFamily: Typography.regular, 
    fontSize: 14, 
    fontWeight: '400', 
    marginBottom: 16 
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
    // Add subtle border for better visibility
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
    resizeMode: 'contain' 
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
    resizeMode: 'contain' 
  },
  
  // Mobile number styles - Responsive
  mobileNumberSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: screenWidth < 350 ? 8 : 12 
  },
  mobileInputContainer: { 
    flex: 1, 
    backgroundColor: Colors.surface, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    minHeight: 48,
  },
  mobileInput: { 
    color: Colors.text?.primary || '#111827', 
    fontFamily: Typography.regular, 
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
    resizeMode: 'contain' 
  },
  helperText: { 
    color: Colors.text?.secondary || '#6B7280', 
    fontFamily: Typography.regular, 
    fontSize: 11, 
    fontWeight: '400', 
    marginTop: 6, 
    fontStyle: 'italic',
    lineHeight: 16,
  },
  
  // Data plan selector
  dataPlanSelector: { 
    backgroundColor: Colors.surface, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    paddingHorizontal: 16, 
    paddingVertical: 16, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    minHeight: 56,
  },
  dataPlanSelectorDisabled: { 
    backgroundColor: '#F9FAFB', 
    borderColor: '#E5E7EB' 
  },
  dataPlanSelectorText: { 
    color: Colors.text?.primary || '#111827', 
    fontFamily: Typography.regular, 
    fontSize: 16, 
    fontWeight: '400', 
    flex: 1,
    lineHeight: 20,
  },
  dataPlanSelectorPlaceholder: { 
    color: Colors.text?.secondary || '#6B7280' 
  },
  dropdownArrow: { 
    color: Colors.text?.secondary || '#6B7280', 
    fontSize: 16, 
    fontWeight: '500',
    marginLeft: 8,
  },
  
  // Summary section
  summarySection: { 
    backgroundColor: '#F3F4F6', 
    borderRadius: 8, 
    padding: 16, 
    marginHorizontal: responsiveDims.horizontalPadding, 
    marginBottom: 24 
  },
  summaryTitle: { 
    color: Colors.text?.primary || '#111827', 
    fontFamily: Typography.medium, 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 8 
  },
  summaryContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  summaryData: { 
    color: Colors.text?.primary || '#111827', 
    fontFamily: Typography.medium, 
    fontSize: 16, 
    fontWeight: '600',
    flex: 1,
  },
  summaryPrice: { 
    color: '#35297F', 
    fontFamily: Typography.medium, 
    fontSize: 16, 
    fontWeight: '600',
    textAlign: 'right',
  },
  summaryValidity: { 
    color: Colors.text?.secondary || '#6B7280', 
    fontFamily: Typography.regular, 
    fontSize: 12, 
    fontWeight: '400' 
  },
  
  // Button styles
  buttonContainer: { 
    paddingHorizontal: responsiveDims.horizontalPadding, 
    paddingVertical: 24, 
    backgroundColor: Colors.background 
  },
  continueButton: { 
    backgroundColor: '#35297F', 
    borderRadius: 8, 
    paddingVertical: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
    minHeight: 56,
  },
  continueButtonDisabled: { 
    backgroundColor: '#9CA3AF' 
  },
  continueButtonText: { 
    color: '#FFFFFF', 
    fontFamily: Typography.medium, 
    fontSize: 16, 
    fontWeight: '600' 
  },
  
  // Bottom spacer
  bottomSpacer: {
    height: 20,
  },
});

export default BuyDataScreen;
