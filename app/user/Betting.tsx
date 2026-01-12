import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
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
import BettingConfirmationModal from '../../components/BettingConfirmation';
import BettingProviderSelectionModal from '../../components/BettingProviderModal';
import ErrorDisplay from '../../components/ErrorDisplay';
import Loading from '../../components/Loading';
import PinEntryModal from '../../components/PinEntry';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useBetting } from '../../hooks/useBetting';
import { useCustomer } from '../../hooks/useCustomer';
import ScreenHeader from '../../components/ScreenHeader';

interface BettingProvider {
  id: string;
  name: string;
  displayName?: string;
  slug?: string;
  category?: string;
  logo?: string;
  hasLogo?: boolean;
  icon?: any;
}

const BettingScreen: React.FC = () => {
  const router = useRouter();
  const {
    loading,
    fundBettingAccount,
    validateBettingCustomer,
    clearErrors,
    getErrorAction
  } = useBetting();
  const {
    verifyBettingCustomer,
    loading: customerLoading,
    customerData,
    error: customerError,
    clearError: clearCustomerError,
    clearCustomerData,
    setCustomerData,
    formatCustomerName,
    getUserFriendlyMessage: getCustomerUserFriendlyMessage
  } = useCustomer() as any;

  const [selectedProvider, setSelectedProvider] = useState<BettingProvider | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [showProviderModal, setShowProviderModal] = useState<boolean>(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);
  const [showErrorDisplay, setShowErrorDisplay] = useState<boolean>(false);
  const [errorDisplayData, setErrorDisplayData] = useState<any>(null);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState<boolean>(false);

  const [passwordPin, setPasswordPin] = useState<string>('');
  const [twoFactorCode, setTwoFactorCode] = useState<string>('');

  const predefinedAmounts = [1000, 2000, 5000, 10000, 20000];

  const backDisabled = Boolean(loading || customerLoading);

  const handleGoBack = (): void => {
    if (!backDisabled) router.back();
  };

  const showErrorMessage = (errorData: any): void => {
    setErrorDisplayData(errorData);
    setShowErrorDisplay(true);
  };

  const hideErrorDisplay = (): void => {
    setShowErrorDisplay(false);
    setErrorDisplayData(null);
  };

  const normalizeProviderId = (id: string): string => {
    return id.toLowerCase();
  };

  const handleProceedUser = async (): Promise<void> => {
    if (!userId.trim()) {
      showErrorMessage({
        type: 'validation',
        title: 'User ID Required',
        message: 'Please enter your betting account User ID',
        autoHide: true,
        duration: 3000
      });
      return;
    }
    if (!selectedProvider) {
      showErrorMessage({
        type: 'validation',
        title: 'Provider Required',
        message: 'Please select a betting provider first',
        autoHide: true,
        duration: 3000
      });
      return;
    }
    clearCustomerError();
    try {
      const result = await validateBettingCustomer({
        service: selectedProvider.id,
        customerId: userId
      });

      if (result && (result as any).success) {
        const customerData = {
          customer_name: (result as any).data?.customerName,
          customer_id: (result as any).data?.customerId,
          service: (result as any).data?.service,
          minimum_amount: (result as any).data?.minimumAmount,
          verified_at: (result as any).data?.verifiedAt,
          request_id: (result as any).data?.requestId
        };
        setCustomerData(customerData);
      } else {
        const errorAction = getErrorAction((result as any)?.requiresAction || 'RETRY');
        const friendlyMessage = getCustomerUserFriendlyMessage((result as any)?.error, (result as any)?.message);
        showErrorMessage({
          type: errorAction ? 'validation' : 'server',
          title: errorAction?.title || 'Verification Failed',
          message: errorAction?.message || friendlyMessage,
          autoHide: true,
          duration: 4000
        });
      }
    } catch (error) {
      const friendlyMessage = getCustomerUserFriendlyMessage(customerError, (error as any)?.message);
      showErrorMessage({
        type: 'server',
        title: 'Verification Error',
        message: friendlyMessage,
        autoHide: true,
        duration: 4000
      });
    }
  };

  const getCurrentAmount = (): number => {
    if (selectedAmount) return selectedAmount;
    if (customAmount) return parseFloat(customAmount) || 0;
    return 0;
  };

  const handleProviderSelect = (provider: BettingProvider): void => setSelectedProvider(provider);

  const handleAmountSelect = (amount: number): void => {
    setSelectedAmount(amount);
    setCustomAmount(amount.toString());
  };

  const handleCustomAmountChange = (value: string): void => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    setCustomAmount(numericValue);
    if (numericValue.trim()) setSelectedAmount(null);
  };

  const handleUserIdChange = (value: string): void => {
    setUserId(value);
    if (customerData) {
      clearCustomerData();
      clearCustomerError();
    }
  };

  const validateForm = (): boolean => {
    clearErrors();
    if (!selectedProvider) {
      showErrorMessage({
        type: 'validation',
        title: 'Provider Required',
        message: 'Please select a betting provider to continue',
        autoHide: true,
        duration: 3000
      });
      return false;
    }
    if (!userId.trim()) {
      showErrorMessage({
        type: 'validation',
        title: 'User ID Required',
        message: 'Please enter your betting account User ID',
        autoHide: true,
        duration: 3000
      });
      return false;
    }
    if (!customerData) {
      showErrorMessage({
        type: 'validation',
        title: 'Account Not Verified',
        message: 'Please verify your betting account first by clicking Proceed',
        autoHide: true,
        duration: 3000
      });
      return false;
    }
    return true;
  };

  const handleContinue = (): void => {
    if (!validateForm()) return;
    setShowConfirmationModal(true);
  };

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
    setShowTwoFactorModal(false);

    try {
      const fundingData = {
        userId: userId,
        service_id: normalizeProviderId(selectedProvider!.id),
        amount: getCurrentAmount(),
        passwordpin: passwordPin,
        twoFactorCode: code
      };

      const result = await fundBettingAccount(fundingData);
      if ((result as any).success) {
        setShowTwoFactorModal(false);
        setShowPinModal(false);
        setPasswordPin('');
        setTwoFactorCode('');

        const utilityTransaction = {
          id: (result as any).data?.transactionId || (result as any).data?.id || Date.now().toString(),
          type: 'Betting',
          status: 'Successful',
          amount: `₦${getCurrentAmount().toLocaleString()}`,
          date: new Date().toLocaleString(),
          details: {
            orderId: (result as any).data?.orderId || (result as any).data?.requestId,
            requestId: (result as any).data?.requestId,
            productName: (result as any).data?.productName || 'Betting',
            betReference: (result as any).data?.betReference || (result as any).data?.reference,
            gameType: 'Account Funding',
            betAmount: getCurrentAmount(),
            network: selectedProvider?.name || '',
            customerInfo: userId,
            billType: 'betting',
            paymentCurrency: 'NGN',
            category: 'utility',
          }
        };

        router.push({
          pathname: '/utility-receipt',
          params: {
            tx: encodeURIComponent(JSON.stringify(utilityTransaction))
          }
        });
      } else {
        setShowTwoFactorModal(false);

        const errorAction = getErrorAction?.((result as any).requiresAction);
        if (errorAction) {
          showErrorMessage({
            type: 'server',
            title: errorAction.title,
            message: errorAction.message,
            autoHide: false,
            duration: undefined
          });
        } else {
          showErrorMessage({
            type: 'server',
            title: 'Funding Failed',
            message: (result as any).message || 'Something went wrong. Please try again.',
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

  const isFormValid: boolean = !!(
    selectedProvider &&
    userId.trim() &&
    getCurrentAmount() > 0 &&
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
          <ScreenHeader
            title="Betting"
            onBack={handleGoBack}
            backDisabled={backDisabled}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Betting provider</Text>
            <TouchableOpacity
              style={styles.providerSelector}
              onPress={() => setShowProviderModal(true)}
              activeOpacity={0.8}
            >
              {selectedProvider?.icon && (
                <Image
                  source={selectedProvider.icon}
                  style={styles.providerLogo}
                  resizeMode="contain"
                />
              )}
              <Text style={[
                styles.providerSelectorText,
                !selectedProvider && styles.providerSelectorPlaceholder
              ]}>
                {selectedProvider?.name || 'Select betting provider'}
              </Text>
              <Text style={styles.dropdownArrow}>↓</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User ID</Text>
            <View style={styles.userIdInputContainer}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your User ID"
                  placeholderTextColor={Colors.text?.secondary}
                  value={userId}
                  onChangeText={handleUserIdChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity
                style={styles.proceedButton}
                onPress={handleProceedUser}
                disabled={!userId.trim() || customerLoading || !selectedProvider}
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.uneditableInput]}
                placeholder="Account name will appear here"
                placeholderTextColor={Colors.text?.secondary}
                value={customerData ? formatCustomerName((customerData as any).customer_name) : ''}
                editable={false}
              />
            </View>
          </View>

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
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.continueButton, !isFormValid && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!isFormValid}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <BettingProviderSelectionModal
        visible={showProviderModal}
        onClose={() => setShowProviderModal(false)}
        onSelectProvider={handleProviderSelect}
        selectedProvider={selectedProvider}
      />

      <BettingConfirmationModal
        visible={showConfirmationModal}
        onClose={handleConfirmationModalClose}
        onConfirm={handleConfirmPurchase}
        loading={loading}
        provider={selectedProvider}
        userId={userId}
        customerData={customerData}
        amount={getCurrentAmount()}
      />

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

      {loading && (
        <Loading />
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background || '#F8F9FA' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { color: Colors.text?.secondary || '#6B7280', fontFamily: Typography.regular || 'System', fontSize: 14, fontWeight: '400', marginBottom: 16 },
  providerSelector: { backgroundColor: Colors.surface || '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' },
  providerLogo: { width: 28, height: 28, marginRight: 12, borderRadius: 14, backgroundColor: '#F3F4F6' },
  providerSelectorText: { color: Colors.text?.primary || '#111827', fontFamily: Typography.regular || 'System', fontSize: 16, fontWeight: '400', flex: 1 },
  providerSelectorPlaceholder: { color: Colors.text?.secondary || '#6B7280' },
  dropdownArrow: { color: Colors.text?.secondary || '#6B7280', fontSize: 16, fontWeight: '500' },
  userIdInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputContainer: { flex: 1, backgroundColor: Colors.surface || '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 12 },
  input: { color: Colors.text?.primary || '#111827', fontFamily: Typography.regular || 'System', fontSize: 16, fontWeight: '400', paddingVertical: 4 },
  uneditableInput: { backgroundColor: '#F9FAFB', color: Colors.text?.secondary || '#6B7280' },
  proceedButton: { backgroundColor: '#35297F', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 12, justifyContent: 'center', alignItems: 'center', minWidth: 70 },
  proceedButtonText: { color: '#FFFFFF', fontFamily: Typography.medium || 'System', fontSize: 12, fontWeight: '600' },
  amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  amountButton: { width: '31%', backgroundColor: Colors.surface || '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 16, justifyContent: 'center', alignItems: 'center' },
  amountButtonSelected: { borderColor: '#35297F', backgroundColor: '#F8F7FF' },
  amountButtonText: { color: Colors.text?.primary || '#111827', fontFamily: Typography.regular || 'System', fontSize: 14, fontWeight: '400' },
  amountButtonTextSelected: { color: '#35297F', fontWeight: '500' },
  helperText: { color: Colors.text?.secondary || '#6B7280', fontFamily: Typography.regular || 'System', fontSize: 11, fontWeight: '400', marginTop: 6, fontStyle: 'italic' },
  buttonContainer: { paddingHorizontal: 16, paddingVertical: 24, backgroundColor: Colors.background || '#F8F9FA' },
  continueButton: { backgroundColor: '#35297F', borderRadius: 8, paddingVertical: 16, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  continueButtonDisabled: { backgroundColor: '#9CA3AF', elevation: 0, shadowOpacity: 0 },
  continueButtonText: { color: '#FFFFFF', fontFamily: Typography.medium || 'System', fontSize: 16, fontWeight: '600' }
});

export default BettingScreen;
