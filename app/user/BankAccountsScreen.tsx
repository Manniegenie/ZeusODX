// app/user/BankAccountsScreen.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
// @ts-ignore
import ErrorDisplay from '../../components/ErrorDisplay';
import FiatTransferConfirmationModal from '../../components/FiatConfirm';
// @ts-ignore
import naijaFlag from '../../components/icons/naija-flag.png';
import { useBankAccounts } from '../../hooks/usebankAccount';
// Icons - Updated to match btc-bsc screen
// @ts-ignore
import backIcon from '../../components/icons/backy.png';

// PIN + 2FA modals and withdrawal hook
import TwoFactorAuthModal from '../../components/2FA';
import PinEntryModal from '../../components/PinEntry';
import { useNGNZWithdrawal } from '../../hooks/useNGNZService';
import AppsFlyerService from '../../services/appsFlyerService';
import { useNairaBanks } from '../../hooks/usenairaBanks';
import { useResolveAccount } from '../../hooks/useAccountname';

// No longer using FiatWithdrawalReceiptModal - using full-screen receipt instead

interface BankAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
}

interface AccountSummary {
  totalAccounts: number;
  maxAllowed: number;
  remainingSlots: number;
  canAddMore: boolean;
}

const BankAccountsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extract transfer parameters if in selection mode
  const transferAmount = params.transferAmount as string;
  const transferFee = params.transferFee as string;
  const netAmount = params.netAmount as string;
  const mode = params.mode as string; // 'select' for transfer selection mode

  const isSelectionMode = mode === 'select';

  // Store transfer amount for display purposes only
  const transferAmountNum = useMemo(() => {
    return parseFloat(transferAmount || '0');
  }, [transferAmount]);

  const {
    bankAccounts,
    accountsSummary,
    loading,
    error,
    getBankAccounts,
    deleteBankAccount,
  } = useBankAccounts() as {
    bankAccounts: BankAccount[];
    accountsSummary: AccountSummary | null;
    loading: boolean;
    error: any;
    getBankAccounts: () => Promise<any>;
    deleteBankAccount: (accountId: string) => Promise<any>;
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedBankForTransfer, setSelectedBankForTransfer] = useState<BankAccount | null>(null);
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

  // NGNZ withdrawal hook + auth modal states
  const { loading: wdLoading, submit } = useNGNZWithdrawal({ autoPoll: true, pollMs: 8000 });

  // Naira banks + account resolver for manual entry
  const {
    filteredBanks: nairaBanks,
    loading: banksLoading,
    searchTerm: bankSearchTerm,
    searchBanks,
    clearSearch: clearBankSearch,
    formatBankName,
  } = useNairaBanks();
  const { account: resolvedAccount, loading: resolving, error: resolveError, load: resolveLoad } = useResolveAccount({ auto: false });

  const [showPinModal, setShowPinModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [passwordPin, setPasswordPin] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Manual bank entry state – 'saved' = saved accounts tab, 'manual' = new account tab
  const [entryMode, setEntryMode] = useState<'saved' | 'manual'>('saved');
  const [manualBankName, setManualBankName] = useState('');
  const [manualBankCode, setManualBankCode] = useState('');
  const [manualAccountNumber, setManualAccountNumber] = useState('');
  const [manualAccountName, setManualAccountName] = useState('');
  const [showManualBankModal, setShowManualBankModal] = useState(false);

  // No longer using receipt modal state - using full-screen receipt instead

  // Auto-fetch bank accounts on mount
  useEffect(() => {
    getBankAccounts();
  }, [getBankAccounts]);

  // Auto-resolve account name for manual entry when bank + 10-digit number are set
  useEffect(() => {
    if (manualBankCode && manualAccountNumber.length === 10) {
      resolveLoad({ sortCode: manualBankCode, accountNumber: manualAccountNumber });
    } else {
      setManualAccountName('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualBankCode, manualAccountNumber]);

  useEffect(() => {
    if (resolvedAccount?.accountName) {
      setManualAccountName(resolvedAccount.accountName);
    }
  }, [resolvedAccount]);

  useEffect(() => {
    if (resolveError) {
      setErrorDisplayConfig({
        visible: true,
        type: 'validation',
        title: 'Account not found',
        message: resolveError.message || 'Could not verify account details. Please check the account number and try again.',
      });
    }
  }, [resolveError]);

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
      case 'LIMIT_EXCEEDED':
        return 'limit';
      case 'INVALID_2FA_CODE':
        return 'auth';
      case 'INVALID_OTP':
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
  const summary = accountsSummary;
  const accounts = bankAccounts;
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

  const handleUseManualAccount = () => {
    if (!manualBankName || !manualBankCode || !manualAccountNumber || !manualAccountName) return;
    setSelectedBankForTransfer({
      id: 'manual',
      accountNumber: manualAccountNumber,
      accountName: manualAccountName,
      bankName: manualBankName,
      bankCode: manualBankCode,
    });
    setShowTransferModal(true);
  };

  const getHeaderTitle = () => {
    return isSelectionMode ? 'Select Bank Account' : 'Bank Accounts';
  };

  const getDescriptionText = () => {
    return isSelectionMode
      ? 'Select a bank account to receive your Naira'
      : 'Here are all the bank details you added for crypto to cash payment.';
  };

  // PIN modal handlers
  const handlePinModalClose = () => {
    setShowPinModal(false);
    setPasswordPin('');
  };

  const handlePinSubmit = (pin: string) => {
    setPasswordPin(pin);
    setShowPinModal(false);
    setShowTwoFactorModal(true);
  };

  // 2FA modal handlers
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

    // Use the full transfer amount - backend will handle fee deduction
    const amountNumber = parseFloat(transferAmount || '0');

    if (!amountNumber || amountNumber <= 0) {
      setTransferLoading(false);
      showError('validation', 'Invalid Amount', 'Please go back and enter a valid amount.');
      return;
    }

    const payload = {
      amount: amountNumber, // Send full amount - backend handles fee deduction
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

      AppsFlyerService.logEvent('Withdrawal', {
        amount: String(transferAmount || netAmount || 0),
        currency: 'NGN',
        withdrawal_method: 'bank',
      }).catch(() => {});

      // Try to normalize upstream payloads (res.data | res.withdrawal | res.result | res.payload)
      const wd = (res as any).data || (res as any).withdrawal || (res as any).result || (res as any).payload || {};
      const status = wd.status || wd.providerStatus || 'Pending';

      // Prefer NGN figures from the API, else fall back to the entered amount
      const ngnAmount =
        wd.ngnAmount ?? wd.amountNGN ?? wd.amountNgn ?? wd.amount ?? Number(transferAmount || netAmount || 0);
      const formattedNaira = `-₦${Math.round(Number(ngnAmount || 0)).toLocaleString('en-NG')}`;

      const now = new Date();

      // Navigate to full-screen withdrawal receipt instead of modal
      // DEBUG: Log the full account number to verify it's not masked
      console.log('🔍 Full Account Number:', selectedBankForTransfer?.accountNumber);
      console.log('🔍 Backend Response Account Number:', wd.destination?.accountNumber);
      
      router.push({
        pathname: '/receipt/ngnz-withdrawal',
        params: {
          withdrawalId: String(wd.id ?? wd.reference ?? Date.now()),
          reference: wd.reference ?? wd.id,
          amount: String(ngnAmount || 0),
          currency: 'NGN',
          bankName: selectedBankForTransfer?.bankName,
          accountName: selectedBankForTransfer?.accountName,
          accountNumber: selectedBankForTransfer?.accountNumber, // Using FULL account number from selected bank
          bankCode: selectedBankForTransfer?.bankCode,
          fee: String(wd.fee ?? wd.feeNGN ?? wd.charge ?? 0),
          narration: 'NGNZ withdrawal to bank',
          status: String(status),
          createdAt: wd.createdAt ?? now.toISOString(),
          provider: wd.provider ?? wd.psp ?? 'ZeusODX',
          obiexStatus: wd.status ?? wd.providerStatus,
        },
      });

      // clear selection after we captured it for the receipt
      setSelectedBankForTransfer(null);
      return;
    } else {
      const errorCode = (res as any)?.error || 'GENERAL_ERROR';
      const errorMessage =
        (res as any)?.message ||
        (res as any)?.details?.message ||
        'Withdrawal failed. Please try again.';
      const details = (res as any)?.details || {};

      if (errorCode === 'LIMIT_EXCEEDED') {
        const rec = details?.upgradeRecommendation;
        // Show the API error message first, append recommendation if available
        const displayMessage = rec ? `${errorMessage}\n\n${rec}` : errorMessage;
        showError(
          mapErrorType(errorCode),
          'Daily limit exceeded',
          displayMessage
        );
      } else if (errorCode === 'INVALID_PASSWORDPIN') {
        showError(mapErrorType(errorCode), 'Invalid PIN', 'The password PIN you entered is incorrect.');
      } else if (errorCode === 'INVALID_2FA_CODE' || errorCode === 'INVALID_OTP') {
        showError(mapErrorType(errorCode), 'Invalid 2FA', 'The two-factor code you entered is incorrect.');
      } else {
        showError(mapErrorType(errorCode), 'Withdrawal failed', errorMessage);
      }
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
          {/* Header Section - Updated to match btc-bsc screen */}
          <View style={[styles.headerSection, isAnyOperationInProgress && styles.headerSectionDisabled]}>
            <View style={styles.headerContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleGoBack}
                activeOpacity={isAnyOperationInProgress ? 1 : 0.7}
                disabled={isAnyOperationInProgress}
                delayPressIn={0}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Image source={backIcon} style={[styles.backIcon, isAnyOperationInProgress && styles.backIconDisabled]} />
              </TouchableOpacity>

              <View style={styles.headerGroup}>
                <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
              </View>

              <View style={styles.headerRight} />
            </View>
          </View>

          {/* Transfer Summary (only in selection mode) */}
          {isSelectionMode && transferAmount && (
            <View style={styles.transferSummarySection}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Transfer Details</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Amount:</Text>
                  <Text style={styles.summaryValue}>
                    {parseFloat(transferAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NGNZ
                  </Text>
                </View>
                {transferFee && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Fee:</Text>
                    <Text style={styles.summaryValue}>
                      {parseFloat(transferFee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NGNZ
                    </Text>
                  </View>
                )}
                {netAmount && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>You will receive:</Text>
                    <Text style={[styles.summaryValue, styles.summaryHighlight]}>
                      ₦{transferAmountNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

          {/* Mode Switch - only in selection mode */}
          {isSelectionMode && (
            <View style={styles.modeSwitch}>
              <TouchableOpacity
                style={[
                  styles.modeSwitchSegment,
                  entryMode === 'saved' && styles.modeSwitchSegmentActive,
                  entryMode === 'saved' && styles.modeSwitchSegmentActiveLeft,
                ]}
                onPress={() => setEntryMode('saved')}
                activeOpacity={0.7}
                disabled={isAnyOperationInProgress}
              >
                <Text style={[styles.modeSwitchText, entryMode === 'saved' && styles.modeSwitchTextActive]}>
                  Saved Banks
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeSwitchSegment,
                  entryMode === 'manual' && styles.modeSwitchSegmentActive,
                  entryMode === 'manual' && styles.modeSwitchSegmentActiveRight,
                ]}
                onPress={() => setEntryMode('manual')}
                activeOpacity={0.7}
                disabled={isAnyOperationInProgress}
              >
                <Text style={[styles.modeSwitchText, entryMode === 'manual' && styles.modeSwitchTextActive]}>
                  New Account
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Loading */}
          {loading && (!isSelectionMode || entryMode === 'saved') && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
              <Text style={styles.loadingText}>Loading accounts…</Text>
            </View>
          )}

          {/* Error */}
          {!loading && error && (!isSelectionMode || entryMode === 'saved') && (
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
          {(!isSelectionMode || entryMode === 'saved') && <View style={styles.accountsSection}>
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
          </View>}

          {/* Manual Entry Form - shown when 'New Account' tab is active */}
          {isSelectionMode && entryMode === 'manual' && (
            <View style={styles.manualEntrySection}>
              <View style={styles.manualEntryCard}>
                <Text style={styles.manualEntryTitle}>Account Details</Text>

                <Text style={styles.manualInputLabel}>Bank</Text>
                <TouchableOpacity
                  style={styles.manualBankSelector}
                  onPress={() => setShowManualBankModal(true)}
                  activeOpacity={0.7}
                  disabled={isAnyOperationInProgress}
                >
                  <Text style={[styles.manualBankSelectorText, !manualBankName && styles.manualPlaceholder]}>
                    {manualBankName || 'Select bank'}
                  </Text>
                  <Text style={styles.manualDropdownArrow}>▾</Text>
                </TouchableOpacity>

                <Text style={styles.manualInputLabel}>Account Number</Text>
                <TextInput
                  style={styles.manualInput}
                  placeholder="Enter 10-digit account number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={10}
                  value={manualAccountNumber}
                  onChangeText={setManualAccountNumber}
                  editable={!isAnyOperationInProgress}
                />

                <Text style={styles.manualInputLabel}>Account Name</Text>
                <View style={[styles.manualInput, styles.manualAccountNameRow]}>
                  {resolving ? (
                    <ActivityIndicator size="small" color="#35297F" style={{ flex: 1 }} />
                  ) : (
                    <TextInput
                      style={styles.manualAccountNameInput}
                      placeholder="Auto-filled after verifying account"
                      placeholderTextColor="#9CA3AF"
                      value={manualAccountName}
                      onChangeText={setManualAccountName}
                      editable={!resolving && !isAnyOperationInProgress}
                    />
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.useAccountButton,
                    (!manualBankName || !manualAccountNumber || !manualAccountName || isAnyOperationInProgress) && styles.useAccountButtonDisabled,
                  ]}
                  onPress={handleUseManualAccount}
                  disabled={!manualBankName || !manualAccountNumber || !manualAccountName || isAnyOperationInProgress}
                  activeOpacity={0.8}
                >
                  <Text style={styles.useAccountButtonText}>Continue with this account</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
            netAmount: (parseFloat(transferAmount) - parseFloat(transferFee)).toFixed(2), // Amount after fee deduction
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

      {/* Manual Bank Picker Modal - Full Screen */}
      <Modal
        visible={showManualBankModal}
        animationType="slide"
        onRequestClose={() => { setShowManualBankModal(false); clearBankSearch(); }}
      >
        <SafeAreaView style={styles.bankModalFullScreen}>
          <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
          {/* Header - matches the rest of the app */}
          <View style={styles.bankModalHeader}>
            <TouchableOpacity
              style={styles.bankModalBackBtn}
              onPress={() => { setShowManualBankModal(false); clearBankSearch(); }}
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Image source={backIcon} style={styles.bankModalBackIcon} />
            </TouchableOpacity>
            <Text style={styles.bankModalTitle}>Select Bank</Text>
            <View style={styles.bankModalHeaderRight} />
          </View>

          <KeyboardAvoidingView
            style={styles.bankModalBody}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <TextInput
              style={styles.bankSearchInput}
              placeholder="Search bank..."
              placeholderTextColor="#9CA3AF"
              value={bankSearchTerm}
              onChangeText={searchBanks}
            />
            {banksLoading ? (
              <ActivityIndicator size="small" color="#35297F" style={{ marginTop: 20, marginBottom: 20 }} />
            ) : (
              <FlatList
                data={nairaBanks}
                keyExtractor={(item: any) => item.sortCode || item.uuid || item.name}
                renderItem={({ item }: any) => (
                  <TouchableOpacity
                    style={styles.bankListItem}
                    onPress={() => {
                      setManualBankName(formatBankName(item));
                      setManualBankCode(item.sortCode || item.uuid);
                      setManualAccountName('');
                      setShowManualBankModal(false);
                      clearBankSearch();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.bankListItemText}>{formatBankName(item)}</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={{ paddingBottom: 34 }}
              />
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

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
        loading={wdLoading || transferLoading}
        title="Two-Factor Authentication"
        subtitle="Enter the 6-digit code from your authenticator app"
      />

      {/* No longer using FiatWithdrawalReceiptModal - using full-screen receipt instead */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },

  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerSectionDisabled: { 
    opacity: 0.7 
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
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  backIconDisabled: {
    opacity: 0.5,
  },
  headerGroup: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  headerTitle: {
    color: '#35297F',
    fontFamily: Typography.medium,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },

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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
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

  // Mode switch (segmented control)
  modeSwitch: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: Colors.border,
    borderRadius: 20,
    padding: 3,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  modeSwitchSegment: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSwitchSegmentActive: {
    backgroundColor: '#35297F',
  },
  modeSwitchSegmentActiveLeft: {
    borderTopLeftRadius: 17,
    borderBottomLeftRadius: 17,
  },
  modeSwitchSegmentActiveRight: {
    borderTopRightRadius: 17,
    borderBottomRightRadius: 17,
  },
  modeSwitchText: {
    fontFamily: Typography.medium,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  modeSwitchTextActive: {
    color: '#FFFFFF',
  },

  // Manual entry section
  manualEntrySection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  manualEntryToggle: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  manualEntryToggleText: {
    color: '#35297F',
    fontFamily: Typography.medium,
    fontSize: 14,
    fontWeight: '600',
  },
  manualEntryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
  },
  manualEntryTitle: {
    color: '#35297F',
    fontFamily: Typography.medium,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  manualInputLabel: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 13,
    marginBottom: 6,
    marginTop: 10,
  },
  manualBankSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  manualBankSelectorText: {
    color: Colors.text.primary,
    fontFamily: Typography.regular,
    fontSize: 14,
    flex: 1,
  },
  manualPlaceholder: {
    color: '#9CA3AF',
  },
  manualDropdownArrow: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  manualInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 14,
    color: Colors.text.primary,
    fontFamily: Typography.regular,
    fontSize: 14,
  },
  manualAccountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  manualAccountNameInput: {
    flex: 1,
    color: Colors.text.primary,
    fontFamily: Typography.regular,
    fontSize: 14,
    padding: 0,
  },
  useAccountButton: {
    backgroundColor: '#35297F',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  useAccountButtonDisabled: {
    backgroundColor: '#C4B9E8',
  },
  useAccountButtonText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium,
    fontSize: 15,
    fontWeight: '600',
  },

  // Bank picker modal - full screen
  bankModalFullScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bankModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  bankModalBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankModalBackIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  bankModalTitle: {
    flex: 1,
    color: '#35297F',
    fontFamily: Typography.medium,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  bankModalHeaderRight: {
    width: 40,
  },
  bankModalBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  bankSearchInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: Colors.text.primary,
    fontFamily: Typography.regular,
    fontSize: 14,
    marginBottom: 12,
  },
  bankListItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bankListItemText: {
    color: Colors.text.primary,
    fontFamily: Typography.regular,
    fontSize: 14,
  },
});

export default BankAccountsScreen;