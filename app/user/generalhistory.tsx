// app/user/TransactionHistoryScreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, StatusBar,
  ScrollView, Modal, TouchableWithoutFeedback, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useHistory } from '../../hooks/useGeneralHistory';
import emptyStateIcon from '../../components/icons/empty-black.png';

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TransactionHistoryScreen = () => {
  const router = useRouter();
  const { currency, tokenName } = useLocalSearchParams();

  // Generate available months (last 12 months)
  const generateAvailableMonths = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      months.push({
        id: label.toLowerCase().replace(' ', '_'),
        label,
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
      });
    }
    return months;
  };

  const availableMonths = generateAvailableMonths();

  // Default to MOST RECENT month
  const [selectedMonth, setSelectedMonth] = useState(
    availableMonths[0]?.label || ''
  );
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [modalType, setModalType] = useState(null); // 'category' | 'status' | 'month' | null

  const {
    transactions, loading, error, refreshTransactions, hasTransactions
  } = useHistory(currency || 'AVAX', { defaultPageSize: 50 });

  // Convert "Aug 2025" -> { startDate: '2025-08-01', endDate: '2025-08-31' }
  const getMonthRange = (label) => {
    if (!label) return { startDate: null, endDate: null };
    const [m, y] = label.split(' ');
    const year = parseInt(y, 10);
    const monthIndex = monthNames.indexOf(m);
    if (isNaN(year) || monthIndex < 0) return { startDate: null, endDate: null };

    // Use UTC to avoid timezone edge cases
    const start = new Date(Date.UTC(year, monthIndex, 1));
    const end = new Date(Date.UTC(year, monthIndex + 1, 0));
    const pad = (n) => String(n).padStart(2, '0');

    return {
      startDate: `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}-${pad(start.getUTCDate())}`,
      endDate: `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}`,
    };
  };

  // Fetch whenever the month, category, or status changes
  useEffect(() => {
    const { startDate, endDate } = getMonthRange(selectedMonth);
    refreshTransactions({ 
      startDate, 
      endDate,
      category: selectedCategory,
      status: selectedStatus
    });
  }, [selectedMonth, selectedCategory, selectedStatus, refreshTransactions]);

  const handleGoBack = () => router.back();
  const handleMonthSelect = () => setModalType('month');
  const handleCategorySelect = () => setModalType('category');
  const handleStatusSelect = () => setModalType('status');

  const handleMonthSelection = (month) => {
    setSelectedMonth(month.label);
    setModalType(null);
  };
  const handleCategorySelection = (category) => {
    setSelectedCategory(category.label);
    setModalType(null);
  };
  const handleStatusSelection = (status) => {
    setSelectedStatus(status.label);
    setModalType(null);
  };

  const onRefresh = useCallback(async () => {
    const { startDate, endDate } = getMonthRange(selectedMonth);
    await refreshTransactions({ 
      startDate, 
      endDate,
      category: selectedCategory,
      status: selectedStatus
    });
  }, [refreshTransactions, selectedMonth, selectedCategory, selectedStatus]);

  // Updated categories with new bill payment options
  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'deposit', label: 'Deposit' },
    { id: 'transfer', label: 'Transfer' },
    { id: 'swap', label: 'Swap' },
    { id: 'airtime', label: 'Airtime' },
    { id: 'data', label: 'Data' },
    { id: 'cable', label: 'Cable' },
    { id: 'electricity', label: 'Electricity' },
  ];

  const statuses = [
    { id: 'all', label: 'All Status' },
    { id: 'successful', label: 'Successful' },
    { id: 'pending', label: 'Pending' },
    { id: 'failed', label: 'Failed' },
  ];

  const getTransactionPrefix = (type, formattedAmount) => {
    if (type === 'DEPOSIT') return '+';
    if (type === 'WITHDRAWAL' || type === 'BILL_PAYMENT') return '-';
    if (type === 'SWAP') {
      if (formattedAmount && formattedAmount.startsWith('+-')) return '-';
      if (formattedAmount && formattedAmount.startsWith('+')) return '+';
      if (formattedAmount && formattedAmount.startsWith('-')) return '-';
      return '';
    }
    return '';
  };

  const getStatusColor = (status) => {
    if (status === 'SUCCESSFUL') return '#10B981';
    if (status === 'FAILED') return '#EF4444';
    return '#F59E0B';
  };
  const getStatusBackgroundColor = (status) => {
    if (status === 'SUCCESSFUL') return '#E8F5E8';
    if (status === 'FAILED') return '#FFE8E8';
    return '#FFF3E0';
  };
  const formatTransactionType = (type, billType) => {
    switch (type) {
      case 'DEPOSIT': return 'Deposit';
      case 'WITHDRAWAL': return 'Withdrawal';
      case 'SWAP': return 'Swap';
      case 'BILL_PAYMENT': 
        // Return the specific bill type instead of generic "Bill Payment"
        return billType || 'Bill Payment';
      default: return type || 'Unknown';
    }
  };
  const formatTransactionStatus = (status) => {
    switch (status) {
      case 'SUCCESSFUL': return 'Successful';
      case 'FAILED': return 'Failed';
      case 'PENDING': return 'Pending';
      default: return status || 'Unknown';
    }
  };
  const formatAmountForDisplay = (value, symbol) => {
    if (!symbol) return value.toString();
    switch (symbol) {
      case 'NGNZ':
        return value.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      case 'BTC':
        return Number(value.toFixed(8)).toString();
      case 'ETH':
        return Number(value.toFixed(6)).toString();
      case 'USDT':
      case 'USDC':
        return value.toFixed(2);
      default:
        if (value >= 1000) return value.toFixed(2);
        if (value >= 1) return Number(value.toFixed(4)).toString();
        if (value >= 0.01) return Number(value.toFixed(4)).toString();
        if (value >= 0.001) return Number(value.toFixed(6)).toString();
        return Number(value.toPrecision(3)).toString();
    }
  };
  const extractAmountValue = (transaction) => {
    const amountString = transaction.formattedAmount || '0';
    const cleanAmount = amountString.replace(/[+\-₦,\s]/g, '').replace(/[A-Z]/g, '').trim();
    return parseFloat(cleanAmount) || 0;
  };

  // ===== Helpers for receipt navigation (mirrors NGNZWalletScreen) =====
  const mapServiceTypeToUI = (t) => {
    switch (t) {
      case 'DEPOSIT': return 'Deposit';
      case 'WITHDRAWAL': return 'Withdrawal';
      case 'SWAP': return 'Swap';
      case 'BILL_PAYMENT': return 'Bill Payment';
      default: return t || 'Unknown';
    }
  };
  const mapServiceStatusToUI = (s) => {
    switch (s) {
      case 'SUCCESSFUL': return 'Successful';
      case 'FAILED': return 'Failed';
      case 'PENDING': return 'Pending';
      default: return s || 'Unknown';
    }
  };
  const displayBillType = (tx) => {
    const d = tx?.details || {};
    const raw =
      tx?.billType ||
      tx?.utilityType ||
      d.billCategory ||
      d.billType ||
      d.productName ||
      tx?.category ||
      '';
    if (!raw) return undefined;
    const v = String(raw).toLowerCase();
    if (v.includes('airtime')) return 'Airtime';
    if (v.includes('data')) return 'Data';
    if (v.includes('cable') || v.includes('tv') || v.includes('dstv') || v.includes('gotv') || v.includes('startimes')) return 'Cable';
    if (v.includes('electric')) return 'Electricity';
    return String(raw).charAt(0).toUpperCase() + String(raw).slice(1);
  };

  // Build the object TransactionReceipt expects
  const toAPITransaction = (tx) => {
    const serviceType = String(tx?.type || '');
    const serviceStatus = String(tx?.status || '');
    const amountNum = extractAmountValue(tx);
    const symbol = tx?.currency || tx?.symbol || tx?.asset || 'NGN';
    const prettyAmt = formatAmountForDisplay(amountNum, symbol);
    const sign = getTransactionPrefix(serviceType, tx?.formattedAmount);

    const isNaira = ['NGN','NGNB','NGNZ'].includes(String(symbol).toUpperCase());
    const amountStr = isNaira ? `${sign}₦${prettyAmt}` : `${sign}${prettyAmt} ${symbol}`;
    const dateText = tx?.formattedDate || (tx?.createdAt ? new Date(tx.createdAt).toLocaleString('en-NG') : '—');

    let details = {};
    let uiType = mapServiceTypeToUI(serviceType);

    if (serviceType === 'BILL_PAYMENT') {
      const d = tx?.details || {};
      uiType = displayBillType(tx) || 'Bill Payment';
      details = {
        category: 'utility',
        orderId: d.orderId || d.order_id || tx?.orderId,
        requestId: d.requestId || d.request_id || tx?.requestId,
        productName: d.productName || d.product || tx?.productName,
        quantity: d.quantity || d.units || tx?.quantity,
        network: d.network || d.provider || tx?.network || tx?.provider,
        customerInfo: d.customerInfo || d.customerPhone || d.phone || d.meterNo || d.account,
        billType: d.billType || d.type || displayBillType(tx),
        paymentCurrency: d.paymentCurrency || tx?.paymentCurrency || symbol,
      };
    } else {
      const d = tx?.details || {};
      details = {
        category: 'token',
        transactionId: d.transactionId || tx?.transactionId || tx?.txId || tx?.externalId || tx?.reference || tx?.id || tx?._id,
        currency: symbol,
        network: d.network || tx?.network || tx?.chain || tx?.blockchain,
        address: d.address || tx?.address || tx?.walletAddress || tx?.to || tx?.toAddress || tx?.receivingAddress,
        hash: d.hash || tx?.hash || tx?.txHash || tx?.transactionHash,
        fee: d.fee || tx?.fee || tx?.networkFee || tx?.gasFee || tx?.txFee,
        narration: d.narration || tx?.narration || tx?.note || tx?.description || tx?.memo || tx?.reason,
      };
      if (serviceType === 'SWAP') uiType = 'Swap';
    }

    return {
      id: (tx?.id || tx?._id || tx?.transactionId || tx?.reference || tx?.externalId || '') + '',
      type: uiType,
      status: mapServiceStatusToUI(serviceStatus),
      amount: amountStr,
      date: dateText,
      createdAt: tx?.createdAt,
      details,
    };
  };

  const FilterModal = ({ visible, title, options, selectedValue, onSelect, onClose }) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{title}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.optionsContent}>
                <View style={title === 'Select Month' ? styles.monthsGrid : styles.optionsGrid}>
                  {options.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        title === 'Select Month' ? styles.monthCard : styles.optionCard,
                        selectedValue === option.label && (title === 'Select Month' ? styles.monthCardSelected : styles.optionCardSelected)
                      ]}
                      onPress={() => onSelect(option)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.optionText, selectedValue === option.label && styles.optionTextSelected]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <SafeAreaView style={styles.modalSafeArea} />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderTransactionsList = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#35297F" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load transactions</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => onRefresh()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (!hasTransactions) {
      return (
        <View style={styles.emptyStateContainer}>
          <Image source={emptyStateIcon} style={styles.emptyStateImage} />
          <Text style={styles.emptyStateText}>No transactions yet</Text>
        </View>
      );
    }
    const list = transactions;
    if (list.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Image source={emptyStateIcon} style={styles.emptyStateImage} />
          <Text style={styles.emptyStateText}>No transactions match your filters</Text>
        </View>
      );
    }
    return (
      <View style={styles.transactionsList}>
        {list.map((tx, idx) => {
          const amountValue = extractAmountValue(tx);
          const formattedAmount = formatAmountForDisplay(amountValue, tx.currency);
          const prefix = getTransactionPrefix(tx.type, tx.formattedAmount);
          return (
            <TouchableOpacity
              key={tx.id || idx}
              style={styles.transactionItem}
              activeOpacity={0.85}
              onPress={() => {
                // Route exactly like NGNZWalletScreen
                const apiTx = toAPITransaction(tx);
                router.push({
                  pathname: '/history/TransactionReceipt',
                  params: {
                    tx: encodeURIComponent(JSON.stringify(apiTx)),
                    raw: encodeURIComponent(JSON.stringify(tx)),
                  },
                });
              }}
            >
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionType}>{formatTransactionType(tx.type, tx.billType)}</Text>
                <Text style={styles.transactionDate}>{tx.formattedDate || 'N/A'}</Text>
              </View>
              <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>{prefix}{formattedAmount} {tx.currency}</Text>
                <View style={[styles.statusContainer, { backgroundColor: getStatusBackgroundColor(tx.status) }]}>
                  <Text style={[styles.transactionStatus, { color: getStatusColor(tx.status) }]}>
                    {formatTransactionStatus(tx.status)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const modalConfig = (() => {
    switch (modalType) {
      case 'month':   return { title: 'Select Month', options: availableMonths, selectedValue: selectedMonth, onSelect: handleMonthSelection };
      case 'category':return { title: 'Categories',    options: categories,      selectedValue: selectedCategory, onSelect: handleCategorySelection };
      case 'status':  return { title: 'Status',        options: statuses,        selectedValue: selectedStatus,   onSelect: handleStatusSelection };
      default:        return null;
    }
  })();

  const displayTitle = tokenName ? `${tokenName} History` : 'Transaction History';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#F3F0FF" barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleGoBack} 
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{displayTitle}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={['#35297F']} />}
        >
          <View style={styles.dateSelector}>
            <TouchableOpacity style={styles.monthSelector} onPress={handleMonthSelect}>
              <Text style={styles.monthText}>{selectedMonth}</Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <TouchableOpacity style={styles.filterButton} onPress={handleCategorySelect}>
              <Text style={styles.filterText}>{selectedCategory}</Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton} onPress={handleStatusSelect}>
              <Text style={styles.filterText}>{selectedStatus}</Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionsContainer}>
            {renderTransactionsList()}
          </View>
        </ScrollView>

        {modalConfig && (
          <FilterModal
            visible={modalType !== null}
            title={modalConfig.title}
            options={modalConfig.options}
            selectedValue={modalConfig.selectedValue}
            onSelect={modalConfig.onSelect}
            onClose={() => setModalType(null)}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F0FF' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '500',
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontSize: 18,
    fontWeight: '600',
    color: '#35297F',
    textAlign: 'center',
    pointerEvents: 'none',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  dateSelector: { alignItems: 'center', paddingVertical: 20 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  monthText: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginRight: 8 },
  dropdownIcon: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  filterSection: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 20 },
  filterButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  filterText: { fontSize: 14, color: '#6B7280', fontWeight: '400' },
  transactionsContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  transactionsList: { borderRadius: 12, paddingHorizontal: 16 },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  transactionLeft: { flex: 1 },
  transactionType: { fontSize: 14, color: '#1F2937', fontWeight: '500', marginBottom: 4 },
  transactionDate: { fontSize: 12, color: '#6B7280' },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 14, color: '#1F2937', fontWeight: '500', marginBottom: 4 },
  statusContainer: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  transactionStatus: { fontSize: 12, fontWeight: '500' },
  loadingContainer: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { fontSize: 16, color: '#6B7280', marginTop: 12 },
  errorContainer: { alignItems: 'center', paddingVertical: 60 },
  errorText: { fontSize: 16, color: '#EF4444', marginBottom: 16, textAlign: 'center' },
  retryButton: { backgroundColor: '#35297F', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  emptyStateContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyStateImage: { width: 160, height: 156, marginBottom: 24, resizeMode: 'contain' },
  emptyStateText: { fontSize: 16, color: '#6B7280', fontWeight: '400', textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '65%', minHeight: 350 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, backgroundColor: '#FFFFFF' },
  modalTitle: { color: '#111827', fontFamily: Typography?.medium || 'System', fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center' },
  closeButton: { padding: 4 },
  closeButtonText: { color: '#6B7280', fontSize: 18, fontWeight: '500' },
  optionsContainer: { flex: 1, paddingHorizontal: 20 },
  optionsContent: { paddingBottom: 20 },
  modalSafeArea: { backgroundColor: '#FFFFFF' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'flex-start' },
  monthsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
  optionCard: { backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 16, paddingHorizontal: 20, minWidth: '45%', alignItems: 'center', justifyContent: 'center' },
  monthCard: { backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 12, paddingHorizontal: 16, width: '31%', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  optionCardSelected: { backgroundColor: '#F8F7FF', borderColor: '#35297F', borderWidth: 2 },
  monthCardSelected: { backgroundColor: '#F8F7FF', borderColor: '#35297F', borderWidth: 2 },
  optionText: { color: '#6B7280', fontFamily: Typography?.medium || 'System', fontSize: 14, fontWeight: '500', textAlign: 'center' },
  optionTextSelected: { color: '#35297F', fontWeight: '600' },
});

export default TransactionHistoryScreen;
