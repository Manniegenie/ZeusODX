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
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import naijaFlag from '../../components/icons/naija-flag.png';
import { useBankAccounts } from '../../hooks/usebankAccount';
import ErrorDisplay from '../../components/ErrorDisplay';
import FiatTransferConfirmationModal from '../../components/FiatConfirm';

// ↓↓↓ Added: PIN + 2FA modals and withdrawal hook ↓↓↓
import PinEntryModal from '../../components/PinEntry';
import TwoFactorAuthModal from '../../components/2FA';
import { useNGNZWithdrawal } from '../../hooks/useNGNZService';

// ↓↓↓ Added: Fiat Withdrawal Receipt Modal ↓↓↓
import FiatWithdrawalReceiptModal, {
  APITransaction as ReceiptTx,
} from '../../components/FiatTransactionReciept';

const BankAccountsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extract transfer parameters if in selection mode
  const transferAmount = params.transferAmount as string;
  const transferFee = params.transferFee as string;
  const netAmount = params.netAmount as string;
  const mode = params.mode as string; // 'select' for transfer selection mode

  const isSelectionMode = mode === 'select';

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
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedBankForTransfer, setSelectedBankForTransfer] = useState<any>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [errorDisplayConfig, setErrorDisplayConfig] = useState<{
    visible: boolean;
    type:
      | 'network'
      | 'validation'
      | 'auth'
      | 'server'
      | 'notFound'
      | 'general'
      | 'setup'
      | 'limit'
      | 'balance';
    title?: string;
    message?: string;
  }>({
    visible: false,
    type: 'general',
  });

  // ↓↓↓ Added: NGNZ withdrawal hook + auth modal states ↓↓↓
  const { loading: wdLoading, submit } = useNGNZWithdrawal({ autoPoll: true, pollMs: 8000 });

  const [showPinModal, setShowPinModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [passwordPin, setPasswordPin] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // ↓↓↓ Added: Receipt modal state ↓↓↓
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptTx, setReceiptTx] = useState<ReceiptTx | undefined>(undefined);
  const [receiptRaw, setReceiptRaw] = useState<any | undefined>(undefined);

  // Auto-fetch bank accounts on mount
  useEffect(() => {
    getBankAccounts();
  }, [getBankAccounts]);

  const showError = (
    type:
      | 'network'
      | 'validation'
      | 'server'
      | 'limit'
      | 'general'
      | 'auth'
      | 'setup'
      | 'notFound'
      | 'balance',
    title?: string,
    message?: string
  ) => {
    setErrorDisplayConfig({
      visible: true,
      type,
      title,
      message,
    });
  };

  const hideError = () => {
    setErrorDisplayConfig((prev) => ({ ...prev, visible: false }));
  };

  // Map backend error codes to your ErrorDisplay types
  const mapErrorType = (code?: string):
    | 'network'
    | 'validation'
    | 'auth'
    | 'server'
    | 'notFound'
    | 'general'
    | 'setup'
    | 'limit'
    | 'balance' => {
    switch (code) {
      case '2FA_NOT_SETUP':
        return 'setup';
      case 'PIN_NOT_SETUP':
        return 'setup';
      case 'INVALID_2FA_CODE':
        return 'auth';
      case 'INVALID_PASSWORDPIN':
        return 'auth';
      case 'INSUFFICIENT_BALANCE':
        return 'balance';
      case 'WITHDRAWAL_NOT_FOUND':
        return 'notFound';
      case 'VALIDATION_ERROR':
        return 'validation';
      case 'NETWORK_ERROR':
        return 'network';
      case 'UPSTREAM_ERROR':
        return 'server';
      default:
        return 'general';
    }
  };

  // Map hook data to match current component expectations
  const maskedAccounts = useMemo(() => {
    return bankAccounts.map((account) => ({
      ...account,
      maskedNumber: formatAccountNumber(account.accountNumber),
    }));
  }, [bankAccounts, formatAccountNumber]);

  const summary = accountsSummary;
  const accounts = maskedAccounts;
  const canAddMore = summary?.canAddMore !== false;

  const selectedDeleting = useMemo(
    () => Boolean(selectedAccountId && deletingId === selectedAccountId),
    [selectedAccountId, deletingId]
  );

  // Check if any operation is in progress (include wdLoading + transferLoading)
  const isAnyOperationInProgress = loading || selectedDeleting || transferLoading || wdLoading;

  const handleGoBack = () => {
    if (isAnyOperationInProgress) return;
    router.back();
  };

  const handleAddNewAccount = () => {
    if (isAnyOperationInProgress) return;

    if (!canAddMore) {
      showError(
        'limit',
        'Account Limit Reached',
        `You can only add up to ${summary?.maxAllowed ?? 10} bank accounts.`
      );
      return;
    }

    if (isSelectionMode) {
      // In selection mode, navigate to add bank with transfer context
      router.push({
        pathname: '/profile/add-bank',
        params: {
          transferAmount,
          transferFee,
          netAmount,
          mode: 'transfer',
        },
      });
    } else {
      router.push('/profile/add-bank');
    }
  };

  const handleAccountSelect = (account: any) => {
    if (isAnyOperationInProgress) return;

    if (isSelectionMode) {
      // Show transfer confirmation modal
      setSelectedBankForTransfer(account);
      setShowTransferModal(true);
    }
  };

  // On confirm, follow Airtime flow: close confirm → open PIN modal (no API yet)
  const handleTransferConfirm = async () => {
    if (!selectedBankForTransfer) return;

    setShowTransferModal(false);
    setShowPinModal(true);
  };

  const handleCloseTransferModal = () => {
    if (transferLoading) return;
    setShowTransferModal(false);
    setSelectedBankForTransfer(null);
  };

  const handleAccountOptions = (accountId: string) => {
    if (isAnyOperationInProgress || isSelectionMode) return;
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

  const getHeaderTitle = () => {
    return isSelectionMode ? 'Select Bank Account' : 'Bank Accounts';
  };

  const getDescriptionText = () => {
    return isSelectionMode
      ? 'Select a bank account to receive your converted money'
      : 'Here are all the bank details you added for crypto to cash payment.';
  };

  // ----- PIN modal handlers -----
  const handlePinModalClose = () => {
    setShowPinModal(false);
    setPasswordPin('');
  };

  const handlePinSubmit = (pin: string) => {
    setPasswordPin(pin);
    setShowPinModal(false);
    setShowTwoFactorModal(true);
  };

  // ----- 2FA modal handlers -----
  const handleTwoFactorModalClose = () => {
    setShowTwoFactorModal(false);
    setTwoFactorCode('');
    // allow user to adjust PIN again if needed
    setShowPinModal(true);
  };

  const handleTwoFactorSubmit = async (code: string) => {
    if (!selectedBankForTransfer) return;

    setTwoFactorCode(code);
    hideError();
    setTransferLoading(true);

    // Calculate amountNumber as calculatedNetAmount
    const transferAmountNum = parseFloat(transferAmount || '0');
    const transferFeeNum = parseFloat(transferFee || '0');
    const calculatedNetAmount = transferAmountNum - transferFeeNum;
    const amountNumber = calculatedNetAmount;

    if (!amountNumber || amountNumber <= 0) {
      setTransferLoading(false);
      showError('validation', 'Invalid Amount', 'Please go back and enter a valid amount.');
      return;
    }

    const payload = {
      amount: amountNumber,
      narration: 'NGNZ withdrawal to bank',
      destination: {
        bankName: selectedBankForTransfer.bankName,
        bankCode: selectedBankForTransfer.bankCode,
        accountNumber: selectedBankForTransfer.accountNumber,
        accountName: selectedBankForTransfer.accountName,
      },
      twoFactorCode: code.trim(),
      passwordpin: passwordPin.trim(),
    };

    const res = await submit(payload);

    setTransferLoading(false);

    if (res.success) {
      setShowTwoFactorModal(false);
      setPasswordPin('');
      setTwoFactorCode('');

      // Try to normalize upstream payloads (res.data | res.withdrawal | res.result | res.payload)
      const wd: any = res.data || res.withdrawal || res.result || res.payload || {};
      const status = wd.status || wd.providerStatus || 'Pending';

      // Prefer NGN figures from the API, else fall back to the entered amount
      const ngnAmount =
        wd.ngnAmount ?? wd.amountNGN ?? wd.amountNgn ?? wd.amount ?? Number(transferAmount || netAmount || 0);
      const formattedNaira = `-₦${Math.round(Number(ngnAmount || 0)).toLocaleString('en-NG')}`;

      const now = new Date();

      const txForReceipt: ReceiptTx = {
        id: String(wd.id ?? wd.reference ?? Date.now()),
        type: 'Withdrawal',
        status: String(status),
        amount: formattedNaira,
        date: now.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }),
        details: { currency: 'NGN' },
      };

      const rawForReceipt = {
        reference: wd.reference ?? wd.id,
        provider: wd.provider ?? wd.psp ?? '—',
        obiexStatus: wd.status ?? wd.providerStatus,
        bankName: selectedBankForTransfer?.bankName,
        bankCode: selectedBankForTransfer?.bankCode,
        accountName: selectedBankForTransfer?.accountName,
        accountNumber: selectedBankForTransfer?.accountNumber,
        fee: wd.fee ?? wd.feeNGN ?? wd.charge,
        narration: 'NGNZ withdrawal to bank',
        createdAt: wd.createdAt ?? now.toISOString(),
      };

      // Set receipt state and show modal
      setReceiptTx(txForReceipt);
      setReceiptRaw(rawForReceipt);
      setShowReceipt(true);

      // clear selection after we captured it for the receipt
      setSelectedBankForTransfer(null);
      return;
    }

    // Re-open relevant modal for quick retry
    if (res.error === 'INVALID_PASSWORDPIN') {
      setPasswordPin('');
      setShowPinModal(true);
    } else if (res.error === 'INVALID_2FA_CODE') {
      setTwoFactorCode('');
      setShowTwoFactorModal(true);
    } else {
      // Re-open relevant modal for quick retry
      setShowTwoFactorModal(false);
      setShowPinModal(false);
    }
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
          <View
            style={[styles.headerSection, isAnyOperationInProgress && styles.headerSectionDisabled]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleGoBack}
              activeOpacity={isAnyOperationInProgress ? 1 : 0.7}
              disabled={isAnyOperationInProgress}
            >
              <Text
                style={[styles.backButtonText, isAnyOperationInProgress && styles.backButtonTextDisabled]}
              >
                ←
              </Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Transfer Summary (only in selection mode) */}
          {isSelectionMode && transferAmount && (
            <View style={styles.transferSummarySection}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Transfer Details</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Amount:</Text>
                  <Text style={styles.summaryValue}>
                    {parseFloat(transferAmount).toLocaleString()} NGNZ
                  </Text>
                </View>
                {transferFee && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Fee:</Text>
                    <Text style={styles.summaryValue}>
                      {parseFloat(transferFee).toFixed(2)} NGNZ
                    </Text>
                  </View>
                )}
                {netAmount && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>You will receive:</Text>
                    <Text style={[styles.summaryValue, styles.summaryHighlight]}>
                      {calculatedNetAmount.toLocaleString()} NGNZ
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Description Section */}
          <View style={styles.descriptionSection}>
            <Text style={[styles.descriptionText, isAnyOperationInProgress && styles.descriptionTextDisabled]}>
              {getDescriptionText()}
            </Text>
          </View>

          {/* Loading */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
              <Text style={styles.loadingText}>Loading accounts…</Text>
            </View>
          )}

          {/* Error */}
          {!loading && error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load bank accounts</Text>
              <TouchableOpacity
                style={[styles.retryButton, isAnyOperationInProgress && styles.retryButtonDisabled]}
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
                <Text
                  style={[styles.emptyStateText, isAnyOperationInProgress && styles.emptyStateTextDisabled]}
                >
                  No bank accounts added yet
                </Text>
                <Text
                  style={[styles.emptyStateSubtext, isAnyOperationInProgress && styles.emptyStateTextDisabled]}
                >
                  {isSelectionMode
                    ? 'Add a bank account to receive your transfer'
                    : 'Add your first bank account to get started'}
                </Text>
              </View>
            ) : (
              accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountCard,
                    isAnyOperationInProgress && styles.accountCardDisabled,
                    isSelectionMode && styles.accountCardSelectable,
                  ]}
                  onPress={() => (isSelectionMode ? handleAccountSelect(account) : undefined)}
                  activeOpacity={isSelectionMode ? 0.7 : 1}
                  disabled={isAnyOperationInProgress}
                >
                  <View style={styles.accountHeader}>
                    <View style={styles.accountInfo}>
                      <Image
                        source={naijaFlag}
                        style={[styles.flagIcon, isAnyOperationInProgress && styles.flagIconDisabled]}
                      />
                      <View style={styles.accountDetails}>
                        <Text
                          style={[styles.accountNumber, isAnyOperationInProgress && styles.accountTextDisabled]}
                        >
                          {account.accountNumber}
                        </Text>
                        <Text style={[styles.bankName, isAnyOperationInProgress && styles.accountTextDisabled]}>
                          {account.bankName}
                        </Text>
                        <Text
                          style={[
                            styles.accountHolderName,
                            isAnyOperationInProgress && styles.accountTextDisabled,
                          ]}
                        >
                          {account.accountName}
                        </Text>
                      </View>
                    </View>
                    {!isSelectionMode && (
                      <TouchableOpacity
                        style={[styles.optionsButton, isAnyOperationInProgress && styles.optionsButtonDisabled]}
                        onPress={() => handleAccountOptions(account.id)}
                        activeOpacity={isAnyOperationInProgress ? 1 : 0.7}
                        disabled={isAnyOperationInProgress}
                      >
                        <Text
                          style={[styles.optionsIcon, isAnyOperationInProgress && styles.optionsIconDisabled]}
                        >
                          ⋮
                        </Text>
                      </TouchableOpacity>
                    )}
                    {isSelectionMode && (
                      <View style={styles.selectIndicator}>
                        <Text style={styles.selectText}>Tap to select</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>

        {/* Add New Account Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[styles.addButton, (!canAddMore || isAnyOperationInProgress) && styles.addButtonDisabled]}
            onPress={handleAddNewAccount}
            activeOpacity={isAnyOperationInProgress ? 1 : 0.7}
            disabled={isAnyOperationInProgress}
          >
            <Text style={[styles.addButtonIcon, isAnyOperationInProgress && styles.addButtonIconDisabled]}>+</Text>
            <Text style={[styles.addButtonText, isAnyOperationInProgress && styles.addButtonTextDisabled]}>
              {canAddMore ? 'Add new bank account' : 'Account limit reached'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading Overlay (include wdLoading/transferLoading) */}
        {(loading || transferLoading || wdLoading) && (
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

      {/* Fiat Transfer Confirmation Modal */}
      {selectedBankForTransfer && (
        <FiatTransferConfirmationModal
          visible={showTransferModal}
          onClose={handleCloseTransferModal}
          onConfirm={handleTransferConfirm}
          loading={transferLoading}
          transferData={{
            amount: transferAmount || '0',
            fee: transferFee || '0',
            netAmount: calculatedNetAmount.toLocaleString() || '0',
            bank: selectedBankForTransfer,
            currency: 'NGN',
          }}
        />
      )}

      {/* Delete Confirmation Modal (only shown in non-selection mode) */}
      <Modal
        visible={showDeleteModal && !loading && !isSelectionMode}
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
                  style={[styles.cancelButton, selectedDeleting && styles.cancelButtonDisabled]}
                  onPress={handleCancelDelete}
                  activeOpacity={selectedDeleting ? 1 : 0.7}
                  disabled={selectedDeleting}
                >
                  <Text style={[styles.cancelButtonText, selectedDeleting && styles.cancelButtonTextDisabled]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.deleteButton, selectedDeleting && styles.deleteButtonDisabled]}
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

      {/* PIN Entry Modal — same as airtime.js */}
      <PinEntryModal
        visible={showPinModal}
        onClose={handlePinModalClose}
        onSubmit={handlePinSubmit}
        loading={false}
        title="Enter Password PIN"
        subtitle="Please enter your 6-digit password PIN to continue"
      />

      {/* Two-Factor Authentication Modal — same as airtime.js */}
      <TwoFactorAuthModal
        visible={showTwoFactorModal}
        onClose={handleTwoFactorModalClose}
        onSubmit={handleTwoFactorSubmit}
        loading={wdLoading || transferLoading}
        title="Two-Factor Authentication"
        subtitle="Enter the 6-digit code from your authenticator app"
      />

      {/* Fiat Withdrawal Receipt Modal */}
      <FiatWithdrawalReceiptModal
        visible={showReceipt}
        onClose={() => setShowReceipt(false)} // or: () => { setShowReceipt(false); router.replace('/history'); }
        tx={receiptTx}
        raw={receiptRaw}
      />
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  backButtonText: { fontSize: 20, color: Colors.text.primary, fontWeight: '500' },
  backButtonTextDisabled: { opacity: 0.5 },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    color: '#35297F',
    fontFamily: Typography.medium,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    pointerEvents: 'none',
  },
  headerSpacer: { width: 40, height: 40 },

  transferSummarySection: { paddingHorizontal: 16, paddingBottom: 16 },
  summaryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTitle: {
    color: '#35297F',
    fontFamily: Typography.medium,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 14,
  },
  summaryValue: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 14,
    fontWeight: '600',
  },
  summaryHighlight: {
    color: '#35297F',
  },

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
    gap: 8,
  },
  loadingText: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 14,
  },

  errorContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: '#991B1B',
    fontFamily: Typography.regular,
    fontSize: 14,
    marginBottom: 8,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EF4444',
    borderRadius: 6,
  },
  retryButtonDisabled: { opacity: 0.5 },
  retryButtonText: {
    color: '#fff',
    fontFamily: Typography.medium,
    fontSize: 14,
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
  // Subtle selectable state: no purple border, keep the same border and add a tiny lift
  accountCardSelectable: {
    borderColor: '#E5E7EB',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
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

  selectIndicator: { alignItems: 'flex-end' },
  selectText: {
    color: '#35297F',
    fontFamily: Typography.medium,
    fontSize: 12,
    fontWeight: '600',
  },

  bottomSection: { paddingHorizontal: 16, paddingBottom: 34, paddingTop: 16 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#35297F',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  addButtonDisabled: { opacity: 0.6, borderColor: '#9CA3AF' },
  addButtonIcon: { color: '#35297F', fontSize: 18, fontWeight: '600', marginRight: 8 },
  addButtonIconDisabled: { color: '#9CA3AF' },
  addButtonText: {
    color: '#35297F',
    fontFamily: Typography.medium,
    fontSize: 16,
    fontWeight: '600',
  },
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