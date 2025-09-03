const currencyOptions = [{ code: 'NGN', name: 'Nigerian Naira', flag: naijaFlag }];// app/user/add-bank.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import naijaFlag from '../../components/icons/naija-flag.png';
import { useBankAccounts } from '../../hooks/usebankAccount';
import { useNairaBanks } from '../../hooks/usenairaBanks';
import ErrorDisplay from '../../components/ErrorDisplay';

interface BankDetails {
  currency: string;
  bank: string;
  bankCode: string; // Store bank code in background
  accountNumber: string;
  accountName: string;
}

const AddBankScreen = () => {
  const router = useRouter();

  // Hook: list/summary used to enforce max limit; addAccount for submit
  const { addAccount, creating, summary, error } = useBankAccounts({ auto: true });
  const canAddMore = summary?.canAddMore !== false;

  // Naira banks hook
  const {
    banks,
    filteredBanks,
    loading: banksLoading,
    error: banksError,
    searchTerm,
    searchBanks,
    clearSearch,
    formatBankName,
    retryLoading
  } = useNairaBanks();

  const [bankDetails, setBankDetails] = useState<BankDetails>({
    currency: 'NGN',
    bank: '',
    bankCode: '', // Store bank code
    accountNumber: '',
    accountName: '',
  });

  const [showBankModal, setShowBankModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [errorDisplayConfig, setErrorDisplayConfig] = useState<{
    visible: boolean;
    type: 'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general' | 'setup' | 'limit' | 'balance';
    title?: string;
    message?: string;
  }>({
    visible: false,
    type: 'general'
  });

  const showError = (type: 'network' | 'validation' | 'server' | 'limit' | 'general', title?: string, message?: string) => {
    setErrorDisplayConfig({
      visible: true,
      type,
      title,
      message
    });
  };

  const hideError = () => {
    setErrorDisplayConfig(prev => ({ ...prev, visible: false }));
  };

  const handleInputChange = (field: keyof BankDetails, value: string) => {
    setBankDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleBankSelect = (bank: any) => {
    // Store both bank name (for display) and bank code (for submission)
    handleInputChange('bank', formatBankName(bank));
    handleInputChange('bankCode', bank.sortCode || bank.uuid);
    setShowBankModal(false);
    clearSearch(); // Clear search when bank is selected
  };

  const handleCurrencySelect = (currency: string) => {
    handleInputChange('currency', currency);
    setShowCurrencyModal(false);
  };

  const cleanAccountNumber = (s: string) => s.replace(/\s+/g, '');

  const isValid = useMemo(() => {
    const acc = cleanAccountNumber(bankDetails.accountNumber);
    return Boolean(bankDetails.bank && bankDetails.bankCode && bankDetails.accountName && acc.length >= 8 && acc.length <= 20);
  }, [bankDetails]);

  const handleSaveBankDetails = async () => {
    if (!canAddMore) {
      showError('limit', 'Account Limit Reached', `You can only add up to ${summary?.maxAllowed ?? 10} bank accounts.`);
      return;
    }

    if (!isValid) {
      showError('validation', 'Invalid Input', 'Please fill all fields. Account number must be 8–20 digits.');
      return;
    }

    // Include bank code in submission (will be handled by service later)
    const res = await addAccount({
      accountNumber: cleanAccountNumber(bankDetails.accountNumber),
      bankName: bankDetails.bank,
      bankCode: bankDetails.bankCode, // Include bank code
      accountName: bankDetails.accountName.trim(),
    });

    if (res?.success) {
      Alert.alert('Success', 'Bank account added successfully.', [
        { text: 'OK', onPress: () => router.replace('/user/bank-details') },
      ]);
    } else {
      // Determine error type based on response
      let errorType: 'network' | 'validation' | 'server' | 'limit' | 'general' = 'general';
      if (res?.error === 'NETWORK_ERROR') {
        errorType = 'network';
      } else if (res?.error === 'VALIDATION_ERROR' || res?.error?.includes('INVALID_')) {
        errorType = 'validation';
      } else if (res?.error === 'ACCOUNT_LIMIT_REACHED') {
        errorType = 'limit';
      } else if (res?.error === 'SERVER_ERROR') {
        errorType = 'server';
      }

      showError(errorType, 'Failed to Add Account', res?.message || 'Unable to add bank account.');
    }
  };

  const handleBankModalOpen = () => {
    setShowBankModal(true);
    clearSearch(); // Clear search when modal opens
  };

  const handleBankModalClose = () => {
    setShowBankModal(false);
    clearSearch(); // Clear search when modal closes
  };

  const renderBankOption = ({ item: bank }: { item: any }) => (
    <TouchableOpacity 
      style={styles.modalOption} 
      onPress={() => handleBankSelect(bank)} 
      activeOpacity={0.7}
    >
      <Text style={styles.modalOptionText}>
        {formatBankName(bank)}
      </Text>
    </TouchableOpacity>
  );

  const renderCurrencyOption = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.modalOption} 
      onPress={() => handleCurrencySelect(item.code)} 
      activeOpacity={0.7}
    >
      <Text style={styles.modalOptionText}>{item.code}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerSection}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.headerTitle}>Enter your Bank Details</Text>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionText}>
              Provide your bank details. This is where your converted money will be sent
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {/* Currency */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Currency</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowCurrencyModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.currencyContainer}>
                  <Image source={naijaFlag} style={styles.flagIcon} />
                  <Text style={styles.selectInputText}>{bankDetails.currency}</Text>
                </View>
                <Text style={styles.selectArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Bank */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Bank</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={handleBankModalOpen}
                activeOpacity={0.7}
              >
                <Text style={[styles.selectInputText, !bankDetails.bank && styles.placeholderText]}>
                  {bankDetails.bank || 'Select Bank'}
                </Text>
                <Text style={styles.selectArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Account Number */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Account Number</Text>
              <TextInput
                style={styles.textInput}
                value={bankDetails.accountNumber}
                onChangeText={(value) =>
                  handleInputChange('accountNumber', value.replace(/[^\d\s]/g, ''))
                }
                placeholder="Enter account number"
                placeholderTextColor={Colors.text.secondary}
                keyboardType="number-pad"
                maxLength={20}
              />
            </View>

            {/* Account Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Account Name</Text>
              <TextInput
                style={styles.textInput}
                value={bankDetails.accountName}
                onChangeText={(value) => handleInputChange('accountName', value)}
                placeholder="Enter account name"
                placeholderTextColor={Colors.text.secondary}
                autoCapitalize="words"
              />
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[styles.saveButton, (!isValid || !canAddMore || creating) && { opacity: 0.6 }]}
            onPress={handleSaveBankDetails}
            activeOpacity={0.7}
            disabled={!isValid || !canAddMore || creating}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save bank details</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Error Display */}
      {errorDisplayConfig.visible && (
        <ErrorDisplay
          type={errorDisplayConfig.type}
          title={errorDisplayConfig.title}
          message={errorDisplayConfig.message}
          onDismiss={hideError}
        />
      )}

      {/* Bank Selection Modal */}
      <Modal
        visible={showBankModal}
        transparent
        animationType="slide"
        onRequestClose={handleBankModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Bank</Text>
              <TouchableOpacity onPress={handleBankModalClose} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchTerm}
                onChangeText={searchBanks}
                placeholder="Search banks..."
                placeholderTextColor={Colors.text.secondary}
                autoCapitalize="none"
              />
            </View>

            {/* Fixed Height Content Area */}
            <View style={styles.modalContentArea}>
              {/* Loading State */}
              {banksLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#35297F" />
                  <Text style={styles.loadingText}>Loading banks...</Text>
                </View>
              )}

              {/* Error State with Retry */}
              {banksError && !banksLoading && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Failed to load banks</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={retryLoading} activeOpacity={0.7}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Banks List */}
              {!banksLoading && !banksError && (
                <FlatList
                  data={filteredBanks}
                  keyExtractor={(item) => item.sortCode || item.uuid}
                  renderItem={renderBankOption}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ flexGrow: 1 }}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        {searchTerm ? 'No banks match your search' : 'No banks available'}
                      </Text>
                    </View>
                  }
                />
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Currency Selection Modal */}
      <Modal
        visible={showCurrencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={currencyOptions}
              keyExtractor={(item) => item.code}
              renderItem={renderCurrencyOption}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  headerSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  backButtonText: { fontSize: 20, color: Colors.text.primary, fontWeight: '500' },
  titleSection: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#35297F', fontFamily: Typography.medium, fontSize: 18, fontWeight: '600', textAlign: 'left' },
  descriptionSection: { paddingHorizontal: 16, paddingBottom: 32 },
  descriptionText: { color: Colors.text.secondary, fontFamily: Typography.regular, fontSize: 14, fontWeight: '400', lineHeight: 20 },
  formSection: { paddingHorizontal: 16, paddingBottom: 32 },
  fieldContainer: { marginBottom: 24 },
  fieldLabel: { color: Colors.text.primary, fontFamily: Typography.regular, fontSize: 14, fontWeight: '500', marginBottom: 8, textAlign: 'left' },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: Colors.text.primary,
    fontFamily: Typography.regular,
    fontSize: 16,
    fontWeight: '400',
  },
  selectInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currencyContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  flagIcon: { width: 20, height: 15, marginRight: 8, resizeMode: 'contain' },
  selectInputText: { color: Colors.text.primary, fontFamily: Typography.regular, fontSize: 16, fontWeight: '400', flex: 1 },
  placeholderText: { color: Colors.text.secondary },
  selectArrow: { color: Colors.text.secondary, fontSize: 12, marginLeft: 8 },
  bottomSection: { paddingHorizontal: 16, paddingBottom: 34, paddingTop: 16 },
  saveButton: { backgroundColor: '#35297F', borderRadius: 8, paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#FFFFFF', fontFamily: Typography.medium, fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContainer: { 
    backgroundColor: Colors.background, 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    height: '50%', // Fixed height at 50% instead of maxHeight 80%
    paddingBottom: 34 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB' 
  },
  modalTitle: { color: '#35297F', fontFamily: Typography.medium, fontSize: 18, fontWeight: '600' },
  modalCloseButton: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  modalCloseText: { color: Colors.text.secondary, fontSize: 24, fontWeight: 'bold' },
  searchContainer: { 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB' 
  },
  searchInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.text.primary,
    fontFamily: Typography.regular,
    fontSize: 16,
  },
  modalContentArea: {
    flex: 1, // Takes up remaining space
    minHeight: 0, // Ensures proper flex behavior
  },
  loadingContainer: { 
    flex: 1,
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  loadingText: { 
    marginTop: 12, 
    color: Colors.text.secondary, 
    fontFamily: Typography.regular,
    fontSize: 14 
  },
  errorContainer: { 
    flex: 1,
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  errorText: { 
    color: '#991B1B', 
    fontFamily: Typography.regular,
    fontSize: 14,
    marginBottom: 16 
  },
  retryButton: {
    backgroundColor: '#35297F',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  retryButtonText: { 
    color: '#FFFFFF', 
    fontFamily: Typography.medium,
    fontSize: 14 
  },
  emptyContainer: { 
    flex: 1,
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  emptyText: { 
    color: Colors.text.secondary, 
    fontFamily: Typography.regular,
    fontSize: 14 
  },
  modalOption: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F3F4' },
  modalOptionText: { color: Colors.text.primary, fontFamily: Typography.regular, fontSize: 16, fontWeight: '400' },
});

export default AddBankScreen;