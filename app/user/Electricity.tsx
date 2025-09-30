// app/electricity/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabNavigator from '../../components/BottomNavigator';
import ElectricityConfirmationModal from '../../components/ElectricityConfirmModal';
import PinEntryModal from '../../components/PinEntry';
import TwoFactorAuthModal from '../../components/2FA';
import ErrorDisplay from '../../components/ErrorDisplay';
import ProviderSelectionModal from '../../components/ElectricityProviderModal';
import UtilityPurchaseSuccessModal from '../../components/ElectricitySuccess';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { useElectricity } from '../../hooks/useElectricity';
import { useCustomer } from '../../hooks/useCustomer';
import backIcon from '../../components/icons/backy.png';

// ---- Types ----
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

interface ElectricityProvider {
  id: string;
  name: string;
  icon: any;
  region?: string;
}

interface PaymentType {
  id: 'prepaid' | 'postpaid';
  name: string;
}

interface PurchaseData {
  meterNumber: string;
  service_id: string;
  variation_id: string;
  amount: number;
  twoFactorCode: string;
  passwordpin: string;
  paymentType: 'prepaid' | 'postpaid';
}

type ElectricityReceipt = {
  customer_name?: string;
  customer_address?: string;
  token?: string;
  units?: string | number;
  band?: string;
  amount?: number | string;
  request_id?: string;
  service_name?: string;
  status?: string;
  order_id?: string | number;
};

const ElectricityScreen: React.FC = () => {
  const router = useRouter();
  const {
    loading,
    purchaseElectricity,
    clearErrors,
    getErrorAction
  } = useElectricity();

  const {
    verifyElectricityCustomer,
    loading: customerLoading,
    customerData,
    error: customerError,
    clearError: clearCustomerError,
    clearCustomerData,
    formatCustomerName,
    getUserFriendlyMessage,
    getErrorAction: getCustomerErrorAction
  } = useCustomer();

  // ---- Form state ----
  const [selectedProvider, setSelectedProvider] = useState<ElectricityProvider | null>(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType>({ id: 'prepaid', name: 'Prepaid' });
  const [meterNumber, setMeterNumber] = useState<string>('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');

  // ---- Modal state ----
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState<boolean>(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);
  const [showProviderModal, setShowProviderModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // ---- Error display ----
  const [showErrorDisplay, setShowErrorDisplay] = useState<boolean>(false);
  const [errorDisplayData, setErrorDisplayData] = useState<ErrorDisplayData | null>(null);

  // ---- Auth inputs ----
  const [passwordPin, setPasswordPin] = useState<string>('');
  const [twoFactorCode, setTwoFactorCode] = useState<string>('');

  // ---- Raw receipt from backend ----
  const [purchaseReceipt, setPurchaseReceipt] = useState<ElectricityReceipt | null>(null);

  // ---- Constants ----
  const paymentTypes: PaymentType[] = [
    { id: 'prepaid', name: 'Prepaid' },
    { id: 'postpaid', name: 'Postpaid' },
  ];
  const predefinedAmounts = [1000, 2000, 3000, 5000, 10000, 20000];

  // ---- Helpers ----
  const backDisabled = Boolean(loading);
  const handleGoBack = (): void => {
    if (!backDisabled) router.back();
  };

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
      case 'INVALID_METER_NUMBER':
      case 'AMOUNT_TOO_LOW':
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

  const getCurrentAmount = (): number => {
    if (selectedAmount) return selectedAmount;
    if (customAmount) return parseFloat(customAmount) || 0;
    return 0;
  };

  // ---- UI handlers ----
  const handleProviderSelect = (provider: ElectricityProvider): void => setSelectedProvider(provider);
  const handlePaymentTypeSelect = (paymentType: PaymentType): void => setSelectedPaymentType(paymentType);
  const handleAmountSelect = (amount: number): void => {
    setSelectedAmount(amount);
    setCustomAmount(amount.toString());
  };
  const handleCustomAmountChange = (value: string): void => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    setCustomAmount(numericValue);
    if (numericValue.trim()) setSelectedAmount(null);
  };
  const handleMeterNumberChange = (value: string): void => {
    setMeterNumber(value);
    if (customerData) {
      clearCustomerData();
      clearCustomerError();
    }
  };

  const handleProceedCustomer = async (): Promise<void> => {
    if (!meterNumber.trim()) {
      showErrorMessage({ type: 'validation', title: 'Meter Number Required', message: 'Please enter a meter number to proceed', autoHide: true, duration: 3000 });
      return;
    }
    if (!selectedProvider) {
      showErrorMessage({ type: 'validation', title: 'Provider Required', message: 'Please select an electricity provider first', autoHide: true, duration: 3000 });
      return;
    }

    clearCustomerError();
    try {
      const result = await verifyElectricityCustomer(meterNumber, selectedProvider.id, selectedPaymentType.id);
      if (!(result && result.success)) {
        const errorAction = getCustomerErrorAction(result?.requiresAction || 'RETRY');
        const friendlyMessage = getUserFriendlyMessage(result?.error, result?.message);
        if (errorAction) {
          showErrorMessage({ type: 'validation', title: errorAction.title, message: errorAction.message, autoHide: true, duration: 4000 });
        } else {
          showErrorMessage({ type: 'server', title: 'Verification Failed', message: friendlyMessage, autoHide: true, duration: 4000 });
        }
      }
    } catch (error: any) {
      const friendlyMessage = getUserFriendlyMessage(customerError, error.message);
      showErrorMessage({ type: 'server', title: 'Verification Error', message: friendlyMessage, autoHide: true, duration: 4000 });
    }
  };

  const validateForm = (): boolean => {
    clearErrors();
    if (!selectedProvider) {
      showErrorMessage({ type: 'validation', title: 'Provider Required', message: 'Please select an electricity provider to continue', autoHide: true, duration: 3000 });
      return false;
    }
    if (!meterNumber.trim() || meterNumber.length < 10) {
      showErrorMessage({ type: 'validation', title: 'Invalid Meter Number', message: 'Please enter a valid meter or account number', autoHide: true, duration: 3000 });
      return false;
    }
    const currentAmount = getCurrentAmount();
    if (currentAmount < 1000) {
      showErrorMessage({ type: 'validation', title: 'Amount Too Low', message: 'Minimum amount is ₦1,000.00', autoHide: true, duration: 3000 });
      return false;
    }
    return true;
  };

  const handleContinue = (): void => {
    if (validateForm()) setShowConfirmationModal(true);
  };

  const handleConfirmationModalClose = (): void => setShowConfirmationModal(false);
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
      const payload: PurchaseData = {
        meterNumber,
        service_id: selectedProvider!.id,
        variation_id: selectedPaymentType.id,
        amount: getCurrentAmount(),
        twoFactorCode: code,
        passwordpin: passwordPin,
        paymentType: selectedPaymentType.id
      };

      const result = await purchaseElectricity(payload);

      if (result?.code === 'success') {
        setPurchaseReceipt(result.data || null);
        setShowTwoFactorModal(false);
        setShowPinModal(false);
        setShowConfirmationModal(false);
        setPasswordPin('');
        setTwoFactorCode('');
        setShowSuccessModal(true);
      } else {
        setShowTwoFactorModal(false);
        const errorType = getErrorType(result?.error || 'SERVICE_ERROR');
        const action = getErrorAction?.(result?.requiresAction);
        showErrorMessage({
          type: errorType,
          title: action?.title || 'Payment Failed',
          message: action?.message || result?.message || 'Something went wrong. Please try again.',
          autoHide: !action,
          duration: action ? undefined : 4000,
          errorAction: action,
          onActionPress: action?.route ? () => router.push(action.route!) : undefined,
          dismissible: true
        });
      }
    } catch {
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
    setPurchaseReceipt(null);
  };

  const isFormValid: boolean = !!(
    selectedProvider &&
    meterNumber.trim() &&
    meterNumber.length >= 10 &&
    getCurrentAmount() >= 1000 &&
    customerData
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

        {showErrorDisplay && errorDisplayData && (
          <ErrorDisplay {...errorDisplayData} onDismiss={hideErrorDisplay} />
        )}

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.headerSection}>
            <View style={styles.headerContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleGoBack}
                disabled={backDisabled}
                activeOpacity={backDisabled ? 1 : 0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Image source={backIcon} style={styles.backIcon} />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Electricity</Text>

              <View style={styles.headerSpacer} />
            </View>
          </View>

          {/* Provider Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select provider</Text>
            <TouchableOpacity
              style={styles.providerSelector}
              onPress={() => setShowProviderModal(true)}
              activeOpacity={0.8}
            >
              {selectedProvider?.icon && (
                <Image source={selectedProvider.icon} style={styles.providerLogo} resizeMode="contain" />
              )}
              <Text style={[styles.providerSelectorText, !selectedProvider && styles.providerSelectorPlaceholder]}>
                {selectedProvider?.name || 'Select electricity provider'}
              </Text>
              <Text style={styles.dropdownArrow}>↓</Text>
            </TouchableOpacity>
          </View>

          {/* Payment Type */}
          <View style={styles.section}>
            <View style={styles.paymentTypeContainer}>
              {paymentTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.paymentTypeButton, selectedPaymentType.id === type.id && styles.paymentTypeButtonSelected]}
                  onPress={() => handlePaymentTypeSelect(type)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.paymentTypeText, selectedPaymentType.id === type.id && styles.paymentTypeTextSelected]}>
                    {type.name}
                  </Text>
                  {selectedPaymentType.id === type.id && (
                    <View style={styles.checkmark}><Text style={styles.checkmarkText}>✓</Text></View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Meter Number */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meter / Account Number</Text>
            <View style={styles.meterInputContainer}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter meter or account number"
                  placeholderTextColor={Colors.text?.secondary}
                  value={meterNumber}
                  onChangeText={handleMeterNumberChange}
                  keyboardType="numeric"
                  maxLength={20}
                />
              </View>
              <TouchableOpacity
                style={styles.proceedButton}
                onPress={handleProceedCustomer}
                disabled={!meterNumber.trim() || customerLoading || !selectedProvider}
                activeOpacity={0.8}
              >
                {customerLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.proceedButtonText}>Proceed</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.uneditableInput]}
                placeholder="Account name will appear here"
                placeholderTextColor={Colors.text?.secondary}
                value={customerData ? formatCustomerName(customerData.customer_name) : ''}
                editable={false}
              />
            </View>
          </View>

          {/* Amount presets */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select amount</Text>
            <View style={styles.amountGrid}>
              {predefinedAmounts.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.amountButton, selectedAmount === amount && styles.amountButtonSelected]}
                  onPress={() => handleAmountSelect(amount)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.amountButtonText, selectedAmount === amount && styles.amountButtonTextSelected]}>
                    ₦{amount.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom amount */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter custom amount"
                placeholderTextColor={Colors.text?.secondary}
                value={customAmount}
                onChangeText={handleCustomAmountChange}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.helperText}>Minimum amount - ₦1,000.00</Text>
          </View>
        </ScrollView>

        {/* Continue */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.continueButton, !isFormValid && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!isFormValid || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>{loading ? 'Processing...' : 'Continue'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <BottomTabNavigator activeTab="electricity" />

      <PinEntryModal
        visible={showPinModal}
        onClose={handlePinModalClose}
        onSubmit={handlePinSubmit}
        loading={false}
        title="Enter Password PIN"
        subtitle="Please enter your 6-digit password PIN to continue"
      />

      <TwoFactorAuthModal
        visible={showTwoFactorModal}
        onClose={handleTwoFactorModalClose}
        onSubmit={handleTwoFactorSubmit}
        loading={loading}
        title="Two-Factor Authentication"
        subtitle="Please enter the 6-digit code from your authenticator app"
      />

      <ElectricityConfirmationModal
        visible={showConfirmationModal}
        onClose={handleConfirmationModalClose}
        onConfirm={handleConfirmPurchase}
        loading={loading}
        provider={selectedProvider}
        meterNumber={meterNumber}
        customerData={customerData}
        customerName={customerData ? formatCustomerName(customerData.customer_name) : ''}
        amount={getCurrentAmount()}
      />

      <ProviderSelectionModal
        visible={showProviderModal}
        onClose={() => setShowProviderModal(false)}
        onSelectProvider={handleProviderSelect}
        selectedProvider={selectedProvider}
      />

      <UtilityPurchaseSuccessModal
        visible={showSuccessModal}
        onContinue={handleSuccessModalClose}
        utilityType="Electricity"
        amount={`₦${getCurrentAmount().toLocaleString()}`}
        phoneNumber={meterNumber}
        network={selectedProvider?.name || ''}
        receipt={purchaseReceipt}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background || '#F8F9FA' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  headerSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  backIcon: { width: 22, height: 22, resizeMode: 'contain' },
  headerTitle: {
    color: '#35297F', fontFamily: Typography.medium || 'System', fontSize: 18, fontWeight: '600',
    position: 'absolute', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none',
  },
  headerSpacer: { width: 40 },
  historyLink: { color: '#35297F', fontFamily: Typography.medium || 'System', fontSize: 14, fontWeight: '500' },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { color: Colors.text?.secondary || '#6B7280', fontFamily: Typography.regular || 'System', fontSize: 14, fontWeight: '400', marginBottom: 16 },
  providerSelector: {
    backgroundColor: Colors.surface || '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center',
  },
  providerLogo: { width: 28, height: 28, marginRight: 12, borderRadius: 14, backgroundColor: '#F3F4F6' },
  providerSelectorText: { color: Colors.text?.primary || '#111827', fontFamily: Typography.regular || 'System', fontSize: 16, fontWeight: '400', flex: 1 },
  providerSelectorPlaceholder: { color: Colors.text?.secondary || '#6B7280' },
  dropdownArrow: { color: Colors.text?.secondary || '#6B7280', fontSize: 16, fontWeight: '500' },
  paymentTypeContainer: { flexDirection: 'row', gap: 12 },
  paymentTypeButton: {
    flex: 1, backgroundColor: Colors.surface || '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  paymentTypeButtonSelected: { borderColor: '#35297F', backgroundColor: '#F8F7FF' },
  paymentTypeText: { color: Colors.text?.primary || '#111827', fontFamily: Typography.regular || 'System', fontSize: 14, fontWeight: '400' },
  paymentTypeTextSelected: { color: '#35297F', fontWeight: '500' },
  checkmark: {
    position: 'absolute', right: 12, top: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: '#35297F',
    justifyContent: 'center', alignItems: 'center',
  },
  checkmarkText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  meterInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputContainer: {
    flex: 1, backgroundColor: Colors.surface || '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 16, paddingVertical: 12
  },
  input: { color: Colors.text?.primary || '#111827', fontFamily: Typography.regular || 'System', fontSize: 16, fontWeight: '400', paddingVertical: 4 },
  uneditableInput: { backgroundColor: '#F9FAFB', color: Colors.text?.secondary || '#6B7280' },
  proceedButton: { backgroundColor: '#35297F', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 12, justifyContent: 'center', alignItems: 'center', minWidth: 70 },
  proceedButtonText: { color: '#FFFFFF', fontFamily: Typography.medium || 'System', fontSize: 12, fontWeight: '600' },
  amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  amountButton: {
    width: '31%', backgroundColor: Colors.surface || '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB',
    paddingVertical: 16, justifyContent: 'center', alignItems: 'center',
  },
  amountButtonSelected: { borderColor: '#35297F', backgroundColor: '#F8F7FF' },
  amountButtonText: { color: Colors.text?.primary || '#111827', fontFamily: Typography.regular || 'System', fontSize: 14, fontWeight: '400' },
  amountButtonTextSelected: { color: '#35297F', fontWeight: '500' },
  helperText: { color: Colors.text?.secondary || '#6B7280', fontFamily: Typography.regular || 'System', fontSize: 11, fontWeight: '400', marginTop: 6, fontStyle: 'italic' },
  buttonContainer: { paddingHorizontal: 16, paddingVertical: 24, backgroundColor: Colors.background || '#F8F9FA' },
  continueButton: {
    backgroundColor: '#35297F', borderRadius: 8, paddingVertical: 16, justifyContent: 'center', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  continueButtonDisabled: { backgroundColor: '#9CA3AF', elevation: 0, shadowOpacity: 0 },
  continueButtonText: { color: '#FFFFFF', fontFamily: Typography.medium || 'System', fontSize: 16, fontWeight: '600' },
});

export default ElectricityScreen;