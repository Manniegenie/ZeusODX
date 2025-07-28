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
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';

// Import cable TV provider icons
const DstvIcon = require('../../components/icons/Dstv.png');
const GotvIcon = require('../../components/icons/Gotv.png');
const StarTimesIcon = require('../../components/icons/StarTimes.png');
const checkmarkIcon = require('../../components/icons/green-checkmark.png');

// Mock data for cable TV providers
const cableTvProviders = [
  { id: 'dstv', name: 'DStv', icon: DstvIcon },
  { id: 'gotv', name: 'GOtv', icon: GotvIcon },
  { id: 'startimes', name: 'StarTimes', icon: StarTimesIcon },
];

// Mock plans for each provider
const providerPlans = {
  dstv: [
    { id: 'dstv-padi', name: 'DStv Padi', price: 2150 },
    { id: 'dstv-yanga', name: 'DStv Yanga', price: 2950 },
    { id: 'dstv-confam', name: 'DStv Confam', price: 5300 },
    { id: 'dstv-compact', name: 'DStv Compact', price: 9000 },
    { id: 'dstv-compact-plus', name: 'DStv Compact Plus', price: 14250 },
    { id: 'dstv-premium', name: 'DStv Premium', price: 21000 },
  ],
  gotv: [
    { id: 'gotv-smallie', name: 'GOtv Smallie', price: 900 },
    { id: 'gotv-jinja', name: 'GOtv Jinja', price: 1900 },
    { id: 'gotv-jolli', name: 'GOtv Jolli', price: 2800 },
    { id: 'gotv-max', name: 'GOtv Max', price: 4150 },
    { id: 'gotv-supa', name: 'GOtv Supa', price: 5500 },
  ],
  startimes: [
    { id: 'nova', name: 'Nova', price: 900 },
    { id: 'basic', name: 'Basic', price: 1850 },
    { id: 'smart', name: 'Smart', price: 2600 },
    { id: 'classic', name: 'Classic', price: 3300 },
    { id: 'super', name: 'Super', price: 4900 },
  ],
};

// Colors from your electricity screen
const Colors = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: {
    primary: '#111827',
    secondary: '#6B7280'
  }
};

// Typography from your electricity screen
const Typography = {
  regular: 'System',
  medium: 'System'
};

interface CableTvProvider {
  id: string;
  name: string;
  icon: any;
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

const CableTvScreen: React.FC = () => {
  const router = useRouter();
  
  // Form state
  const [selectedProvider, setSelectedProvider] = useState<CableTvProvider | null>(null);
  const [smartcardNumber, setSmartcardNumber] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  
  // Modal states
  const [showProviderModal, setShowProviderModal] = useState<boolean>(false);
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [proceedLoading, setProceedLoading] = useState<boolean>(false);

  // Navigation handlers
  const handleGoBack = (): void => {
    router.back();
  };

  const handleHistoryPress = (): void => {
    router.push('/history');
  };

  const handleProceedSmartcard = async (): Promise<void> => {
    if (!smartcardNumber.trim()) {
      Alert.alert('Smartcard Number Required', 'Please enter a smartcard number to proceed');
      return;
    }

    if (!selectedProvider) {
      Alert.alert('Provider Required', 'Please select a cable TV provider first');
      return;
    }

    setProceedLoading(true);
    
    // Simulate API call to verify smartcard
    setTimeout(() => {
      setProceedLoading(false);
      Alert.alert('Success', 'Smartcard number verified successfully');
    }, 2000);
  };

  const handleProviderSelect = (provider: CableTvProvider): void => {
    setSelectedProvider(provider);
    setSelectedPlan(null); // Reset plan when provider changes
    setShowProviderModal(false);
  };

  const handlePlanSelect = (plan: Plan): void => {
    setSelectedPlan(plan);
    setShowPlanModal(false);
  };

  const handleSmartcardNumberChange = (value: string): void => {
    setSmartcardNumber(value);
  };

  const validateForm = (): boolean => {
    if (!selectedProvider) {
      Alert.alert('Provider Required', 'Please select a cable TV provider to continue');
      return false;
    }
    if (!smartcardNumber.trim()) {
      Alert.alert('Smartcard Number Required', 'Please enter your smartcard number');
      return false;
    }
    if (!selectedPlan) {
      Alert.alert('Plan Required', 'Please select a subscription plan');
      return false;
    }
    return true;
  };

  const handleContinue = (): void => {
    if (validateForm()) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        Alert.alert('Success!', `Cable TV subscription successful for ${selectedProvider?.name} - ${selectedPlan?.name}`);
      }, 2000);
    }
  };

  const isFormValid: boolean = !!(
    selectedProvider && 
    smartcardNumber.trim() &&
    selectedPlan
  );

  const getAvailablePlans = (): Plan[] => {
    if (!selectedProvider) return [];
    return providerPlans[selectedProvider.id] || [];
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.headerSection}>
            <View style={styles.headerContainer}>
              <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Cable</Text>
              <TouchableOpacity onPress={handleHistoryPress}>
                <Text style={styles.historyLink}>History</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Provider Selection Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select provider</Text>
            <View style={styles.providerGrid}>
              {cableTvProviders.map((provider) => (
                <TouchableOpacity
                  key={provider.id}
                  style={styles.providerContainer}
                  onPress={() => handleProviderSelect(provider)}
                  activeOpacity={0.8}
                >
                  <Image 
                    source={provider.icon}
                    style={[
                      styles.providerIcon,
                      selectedProvider?.id === provider.id && styles.providerIconSelected
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
            <Text style={styles.sectionTitle}>Smartcard number</Text>
            <View style={styles.smartcardInputContainer}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter smartcard number"
                  placeholderTextColor={Colors.text?.secondary}
                  value={smartcardNumber}
                  onChangeText={handleSmartcardNumberChange}
                  keyboardType="numeric"
                  maxLength={15}
                />
              </View>
              <TouchableOpacity
                style={styles.proceedButton}
                onPress={handleProceedSmartcard}
                disabled={!smartcardNumber.trim() || proceedLoading || !selectedProvider}
                activeOpacity={0.8}
              >
                {proceedLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.proceedButtonText}>Proceed</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Plan Selection Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plan</Text>
            <TouchableOpacity
              style={styles.planSelector}
              onPress={() => setShowPlanModal(true)}
              disabled={!selectedProvider}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.planSelectorText,
                !selectedPlan && styles.planSelectorPlaceholder
              ]}>
                {selectedPlan ? `${selectedPlan.name} - ₦${selectedPlan.price.toLocaleString()}` : 'Select a plan'}
              </Text>
              <Text style={styles.dropdownArrow}>↓</Text>
            </TouchableOpacity>
          </View>
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
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Plan Selection Modal */}
      {showPlanModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Plan</Text>
              <TouchableOpacity 
                onPress={() => setShowPlanModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {getAvailablePlans().map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planOption,
                    selectedPlan?.id === plan.id && styles.planOptionSelected
                  ]}
                  onPress={() => handlePlanSelect(plan)}
                  activeOpacity={0.7}
                >
                  <View style={styles.planDetails}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planPrice}>₦{plan.price.toLocaleString()}</Text>
                  </View>
                  {selectedPlan?.id === plan.id && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background || '#F8F9FA' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  backButtonText: { fontSize: 20, color: Colors.text?.primary || '#111827', fontWeight: '500' },
  headerTitle: {
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  historyLink: { color: '#35297F', fontFamily: Typography.medium || 'System', fontSize: 14, fontWeight: '500' },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 16,
  },
  providerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  providerContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  providerIcon: {
    width: 97,
    height: 48,
    backgroundColor: 'transparent',
  },
  providerIconSelected: {
    opacity: 0.8,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: -8,
    right: 8,
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
  input: { color: Colors.text?.primary || '#111827', fontFamily: Typography.regular || 'System', fontSize: 16, fontWeight: '400', paddingVertical: 4 },
  proceedButton: {
    backgroundColor: '#35297F',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 12,
    fontWeight: '600',
  },
  planSelector: {
    backgroundColor: Colors.surface || '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  planSelectorText: { 
    color: Colors.text?.primary || '#111827', 
    fontFamily: Typography.regular || 'System', 
    fontSize: 16, 
    fontWeight: '400', 
    flex: 1 
  },
  planSelectorPlaceholder: { color: Colors.text?.secondary || '#6B7280' },
  dropdownArrow: { color: Colors.text?.secondary || '#6B7280', fontSize: 16, fontWeight: '500' },
  buttonContainer: { paddingHorizontal: 16, paddingVertical: 24, backgroundColor: Colors.background || '#F8F9FA' },
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
  continueButtonDisabled: { backgroundColor: '#9CA3AF', elevation: 0, shadowOpacity: 0 },
  continueButtonText: { color: '#FFFFFF', fontFamily: Typography.medium || 'System', fontSize: 16, fontWeight: '600' },
  
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: Colors.surface || '#FFFFFF',
    borderRadius: 12,
    margin: 20,
    maxHeight: '70%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text?.primary || '#111827',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  modalCloseText: {
    fontSize: 20,
    color: Colors.text?.secondary || '#6B7280',
  },
  modalContent: {
    maxHeight: 400,
  },
  planOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  planOptionSelected: {
    backgroundColor: '#F8F7FF',
  },
  planDetails: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    color: Colors.text?.primary || '#111827',
    fontWeight: '500',
  },
  planPrice: {
    fontSize: 14,
    color: Colors.text?.secondary || '#6B7280',
    marginTop: 2,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#35297F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
});

export default CableTvScreen;