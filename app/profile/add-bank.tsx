// app/user/add-bank.tsx
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

interface BankDetails {
  currency: string;
  bank: string;
  accountNumber: string;
  accountName: string;
}

const AddBankScreen = () => {
  const router = useRouter();

  // Hook: list/summary used to enforce max limit; addAccount for submit
  const { addAccount, creating, summary, error } = useBankAccounts({ auto: true });
  const canAddMore = summary?.canAddMore !== false;

  const [bankDetails, setBankDetails] = useState<BankDetails>({
    currency: 'NGN',
    bank: '',
    accountNumber: '',
    accountName: '',
  });

  const [showBankModal, setShowBankModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  const bankOptions = useMemo(
    () => [
      'Opay',
      'GTBank',
      'Access Bank',
      'First Bank',
      'UBA',
      'Zenith Bank',
      'Fidelity Bank',
      'FCMB',
      'Sterling Bank',
      'Unity Bank',
      'Wema Bank',
    ],
    []
  );

  const currencyOptions = [{ code: 'NGN', name: 'Nigerian Naira', flag: naijaFlag }];

  const handleInputChange = (field: keyof BankDetails, value: string) => {
    setBankDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleBankSelect = (bank: string) => {
    handleInputChange('bank', bank);
    setShowBankModal(false);
  };

  const handleCurrencySelect = (currency: string) => {
    handleInputChange('currency', currency);
    setShowCurrencyModal(false);
  };

  const cleanAccountNumber = (s: string) => s.replace(/\s+/g, '');

  const isValid = useMemo(() => {
    const acc = cleanAccountNumber(bankDetails.accountNumber);
    return Boolean(bankDetails.bank && bankDetails.accountName && acc.length >= 8 && acc.length <= 20);
  }, [bankDetails]);

  const handleSaveBankDetails = async () => {
    if (!canAddMore) {
      Alert.alert(
        'Limit reached',
        `You can only add up to ${summary?.maxAllowed ?? 10} bank accounts.`
      );
      return;
    }

    if (!isValid) {
      Alert.alert('Invalid input', 'Please fill all fields. Account number must be 8–20 digits.');
      return;
    }

    const res = await addAccount({
      accountNumber: cleanAccountNumber(bankDetails.accountNumber),
      bankName: bankDetails.bank,
      accountName: bankDetails.accountName.trim(),
    });

    if (res?.success) {
      Alert.alert('Success', 'Bank account added successfully.', [
        { text: 'OK', onPress: () => router.replace('/user/bank-details') },
      ]);
    } else {
      Alert.alert('Failed', res?.message || 'Unable to add bank account.');
    }
  };

  const renderModalOption = (item: string, onSelect: (item: string) => void) => (
    <TouchableOpacity style={styles.modalOption} onPress={() => onSelect(item)} activeOpacity={0.7}>
      <Text style={styles.modalOptionText}>{item}</Text>
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
            {error && (
              <Text style={{ color: '#991B1B', marginTop: 8 }}>
                {error.message || 'There was a problem loading your account limits.'}
              </Text>
            )}
            {!canAddMore && (
              <Text style={{ color: '#991B1B', marginTop: 8 }}>
                You have reached the maximum limit of {summary?.maxAllowed ?? 10} accounts.
              </Text>
            )}
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
                onPress={() => setShowBankModal(true)}
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
          <Text
            style={{
              marginTop: 8,
              textAlign: 'center',
              color: Colors.text.secondary,
              fontFamily: Typography.regular,
              fontSize: 12,
            }}
          >
          
          </Text>
        </View>
      </SafeAreaView>

      {/* Bank Selection Modal */}
      <Modal
        visible={showBankModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBankModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Bank</Text>
              <TouchableOpacity onPress={() => setShowBankModal(false)} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={bankOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => renderModalOption(item, handleBankSelect)}
              keyboardShouldPersistTaps="handled"
            />
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
              renderItem={({ item }) => renderModalOption(item.code, handleCurrencySelect)}
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
  modalContainer: { backgroundColor: Colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 34 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { color: '#35297F', fontFamily: Typography.medium, fontSize: 18, fontWeight: '600' },
  modalCloseButton: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  modalCloseText: { color: Colors.text.secondary, fontSize: 24, fontWeight: 'bold' },
  modalOption: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F3F4' },
  modalOptionText: { color: Colors.text.primary, fontFamily: Typography.regular, fontSize: 16, fontWeight: '400' },
});

export default AddBankScreen;
