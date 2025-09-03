// app/user/BankAccountsScreen.tsx
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import naijaFlag from '../../components/icons/naija-flag.png';
import { useBankAccounts } from '../../hooks/usebankAccount';
import ErrorDisplay from '../../components/ErrorDisplay';

const BankAccountsScreen = () => {
  const router = useRouter();

  const {
    bankAccounts,
    accountsSummary,
    loading,
    error,
    getBankAccounts,
    deleteBankAccount,
    formatAccountNumber,
  } = useBankAccounts();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorDisplayConfig, setErrorDisplayConfig] = useState<{
    visible: boolean;
    type: 'network' | 'validation' | 'auth' | 'server' | 'notFound' | 'general' | 'setup' | 'limit' | 'balance';
    title?: string;
    message?: string;
  }>({
    visible: false,
    type: 'general'
  });

  // Auto-fetch bank accounts on mount
  useEffect(() => {
    getBankAccounts();
  }, [getBankAccounts]);

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

  // Map hook data to match current component expectations
  const maskedAccounts = useMemo(() => {
    return bankAccounts.map(account => ({
      ...account,
      maskedNumber: formatAccountNumber(account.accountNumber)
    }));
  }, [bankAccounts, formatAccountNumber]);

  const summary = accountsSummary;
  const accounts = maskedAccounts;
  const canAddMore = summary?.canAddMore !== false;

  const selectedDeleting = useMemo(
    () => Boolean(selectedAccountId && deletingId === selectedAccountId),
    [selectedAccountId, deletingId]
  );

  // Check if any operation is in progress
  const isAnyOperationInProgress = loading || selectedDeleting;

  const handleGoBack = () => {
    if (isAnyOperationInProgress) return;
    router.back();
  };

  const handleAddNewAccount = () => {
    if (isAnyOperationInProgress) return;
    
    if (!canAddMore) {
      showError('limit', 'Account Limit Reached', `You can only add up to ${summary?.maxAllowed ?? 10} bank accounts.`);
      return;
    }
    router.push('/profile/add-bank');
  };

  const handleAccountOptions = (accountId: string) => {
    if (isAnyOperationInProgress) return;
    setSelectedAccountId(accountId);
    setShowDeleteModal(true);
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccountId || selectedDeleting) return;
    
    setDeletingId(selectedAccountId);
    
    const res = await deleteBankAccount(selectedAccountId);
    
    setDeletingId(null);
    
    if (res?.success) {
      setShowDeleteModal(false);
      setSelectedAccountId(null);
    } else {
      // Determine error type based on response
      let errorType: 'network' | 'validation' | 'server' | 'general' = 'general';
      if (res?.error === 'NETWORK_ERROR') {
        errorType = 'network';
      } else if (res?.error === 'ACCOUNT_NOT_FOUND') {
        errorType = 'validation';
      } else if (res?.error === 'SERVER_ERROR') {
        errorType = 'server';
      }
      
      showError(errorType, 'Delete Failed', res?.message || 'Unable to delete bank account.');
    }
  };

  const handleCancelDelete = () => {
    if (selectedDeleting) return;
    setShowDeleteModal(false);
    setSelectedAccountId(null);
  };

  const refetch = () => {
    if (loading) return;
    getBankAccounts();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isAnyOperationInProgress}
        >
          {/* Header Section */}
          <View style={[
            styles.headerSection,
            isAnyOperationInProgress && styles.headerSectionDisabled
          ]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleGoBack}
              activeOpacity={isAnyOperationInProgress ? 1 : 0.7}
              disabled={isAnyOperationInProgress}
            >
              <Text style={[
                styles.backButtonText,
                isAnyOperationInProgress && styles.backButtonTextDisabled
              ]}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Bank Accounts</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Description Section */}
          <View style={styles.descriptionSection}>
            <Text style={[
              styles.descriptionText,
              isAnyOperationInProgress && styles.descriptionTextDisabled
            ]}>
              Here are all the bank details you added for crypto to cash payment.
            </Text>
          </View>

          {/* Loading */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
              <Text style={styles.loadingText}>
                Loading accounts…
              </Text>
            </View>
          )}

          {/* Error */}
          {!loading && error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                Failed to load bank accounts
              </Text>
              <TouchableOpacity 
                style={[
                  styles.retryButton,
                  isAnyOperationInProgress && styles.retryButtonDisabled
                ]} 
                onPress={() => {
                  if (loading) return;
                  getBankAccounts();
                }}
                disabled={isAnyOperationInProgress}
                activeOpacity={isAnyOperationInProgress ? 1 : 0.7}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bank Accounts List */}
          <View style={styles.accountsSection}>
            {!loading && accounts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[
                  styles.emptyStateText,
                  isAnyOperationInProgress && styles.emptyStateTextDisabled
                ]}>No bank accounts added yet</Text>
                <Text style={[
                  styles.emptyStateSubtext,
                  isAnyOperationInProgress && styles.emptyStateTextDisabled
                ]}>Add your first bank account to get started</Text>
              </View>
            ) : (
              accounts.map((account) => (
                <View 
                  key={account.id} 
                  style={[
                    styles.accountCard,
                    isAnyOperationInProgress && styles.accountCardDisabled
                  ]}
                >
                  <View style={styles.accountHeader}>
                    <View style={styles.accountInfo}>
                      <Image 
                        source={naijaFlag} 
                        style={[
                          styles.flagIcon,
                          isAnyOperationInProgress && styles.flagIconDisabled
                        ]} 
                      />
                      <View style={styles.accountDetails}>
                        <Text style={[
                          styles.accountNumber,
                          isAnyOperationInProgress && styles.accountTextDisabled
                        ]}>
                          {account.accountNumber}
                        </Text>
                        <Text style={[
                          styles.bankName,
                          isAnyOperationInProgress && styles.accountTextDisabled
                        ]}>
                          {account.bankName}
                        </Text>
                        <Text style={[
                          styles.accountHolderName,
                          isAnyOperationInProgress && styles.accountTextDisabled
                        ]}>
                          {account.accountName}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.optionsButton,
                        isAnyOperationInProgress && styles.optionsButtonDisabled
                      ]}
                      onPress={() => handleAccountOptions(account.id)}
                      activeOpacity={isAnyOperationInProgress ? 1 : 0.7}
                      disabled={isAnyOperationInProgress}
                    >
                      <Text style={[
                        styles.optionsIcon,
                        isAnyOperationInProgress && styles.optionsIconDisabled
                      ]}>⋮</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Add New Account Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[
              styles.addButton,
              (!canAddMore || isAnyOperationInProgress) && styles.addButtonDisabled
            ]}
            onPress={handleAddNewAccount}
            activeOpacity={isAnyOperationInProgress ? 1 : 0.7}
            disabled={isAnyOperationInProgress}
          >
            <Text style={[
              styles.addButtonIcon,
              isAnyOperationInProgress && styles.addButtonIconDisabled
            ]}>+</Text>
            <Text style={[
              styles.addButtonText,
              isAnyOperationInProgress && styles.addButtonTextDisabled
            ]}>
              {canAddMore ? 'Add new bank account' : 'Account limit reached'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#35297F" />
          </View>
        )}
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

      {/* Delete Confirmation Modal (sized to match 2FA modal: width 320, radius 16, padding 24) */}
      <Modal
        visible={showDeleteModal && !loading}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalContent}>
              <Text style={styles.deleteModalTitle}>Delete Bank Account</Text>
              <Text style={styles.deleteModalMessage}>
                Are you sure you want to delete this bank account? This action cannot be undone.
              </Text>

              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    selectedDeleting && styles.cancelButtonDisabled
                  ]}
                  onPress={handleCancelDelete}
                  activeOpacity={selectedDeleting ? 1 : 0.7}
                  disabled={selectedDeleting}
                >
                  <Text style={[
                    styles.cancelButtonText,
                    selectedDeleting && styles.cancelButtonTextDisabled
                  ]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    selectedDeleting && styles.deleteButtonDisabled
                  ]}
                  onPress={handleDeleteAccount}
                  activeOpacity={selectedDeleting ? 1 : 0.7}
                  disabled={selectedDeleting}
                >
                  {selectedDeleting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
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
  
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerSectionDisabled: { opacity: 0.7 },
  backButton: {
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20,
  },
  backButtonText: { fontSize: 20, color: Colors.text.primary, fontWeight: '500' },
  backButtonTextDisabled: { opacity: 0.5 },
  headerTitle: {
    position: 'absolute',
    left: 0, right: 0,
    color: '#35297F',
    fontFamily: Typography.medium,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    pointerEvents: 'none',
  },
  headerSpacer: { width: 40, height: 40 },

  descriptionSection: { paddingHorizontal: 16, paddingBottom: 24 },
  descriptionText: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  descriptionTextDisabled: { opacity: 0.6 },

  loadingContainer: { 
    paddingHorizontal: 16, 
    paddingBottom: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  loadingText: { 
    color: Colors.text.secondary, 
    fontFamily: Typography.regular, 
    fontSize: 14 
  },

  errorContainer: { 
    marginHorizontal: 16, 
    marginBottom: 12, 
    backgroundColor: '#FEE2E2', 
    borderColor: '#FCA5A5', 
    borderWidth: 1, 
    borderRadius: 8, 
    padding: 12 
  },
  errorText: { 
    color: '#991B1B', 
    fontFamily: Typography.regular, 
    fontSize: 14, 
    marginBottom: 8 
  },
  retryButton: { 
    alignSelf: 'flex-start', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    backgroundColor: '#EF4444', 
    borderRadius: 6 
  },
  retryButtonDisabled: { opacity: 0.5 },
  retryButtonText: { 
    color: '#fff', 
    fontFamily: Typography.medium, 
    fontSize: 14 
  },

  accountsSection: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyStateText: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  emptyStateTextDisabled: { opacity: 0.6 },

  accountCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  accountCardDisabled: { opacity: 0.7 },
  accountHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accountInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  flagIcon: { width: 20, height: 15, marginRight: 12, resizeMode: 'contain' },
  flagIconDisabled: { opacity: 0.5 },
  accountDetails: { flex: 1 },
  accountNumber: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  bankName: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  accountHolderName: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 12,
    fontWeight: '600',
  },
  accountTextDisabled: { opacity: 0.6 },

  optionsButton: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  optionsButtonDisabled: { opacity: 0.5 },
  optionsIcon: { color: Colors.text.secondary, fontSize: 18, fontWeight: 'bold' },
  optionsIconDisabled: { opacity: 0.5 },

  bottomSection: { paddingHorizontal: 16, paddingBottom: 34, paddingTop: 16 },
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent', borderWidth: 1, borderColor: '#35297F',
    borderRadius: 8, paddingVertical: 16, paddingHorizontal: 20,
  },
  addButtonDisabled: { opacity: 0.6, borderColor: '#9CA3AF' },
  addButtonIcon: { color: '#35297F', fontSize: 18, fontWeight: '600', marginRight: 8 },
  addButtonIconDisabled: { color: '#9CA3AF' },
  addButtonText: { color: '#35297F', fontFamily: Typography.medium, fontSize: 16, fontWeight: '600' },
  addButtonTextDisabled: { color: '#9CA3AF' },

  // Loading overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  // ===== Modal styles (match 2FA modal sizing) =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // same as 2FA overlay
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20, // same as 2FA overlay
  },
  // Match TwoFactorAuthModal: width: 320, radius: 16, white bg, padding 24
  deleteModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: 320,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  deleteModalContent: { paddingHorizontal: 24, paddingVertical: 24 },
  deleteModalTitle: {
    color: '#111827',
    fontFamily: Typography.medium,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  deleteModalMessage: {
    color: '#6B7280',
    fontFamily: Typography.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  deleteModalButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonDisabled: { opacity: 0.6 },
  cancelButtonText: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButtonTextDisabled: { opacity: 0.6 },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  deleteButtonDisabled: { opacity: 0.8 },
  deleteButtonText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default BankAccountsScreen;
