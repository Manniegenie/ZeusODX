// screens/history/SpecificTransactionHistoryScreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, StatusBar,
  ScrollView, Modal, TouchableWithoutFeedback, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useHistory } from '../../hooks/useHistory';
import emptyStateIcon from '../../components/icons/empty-black.png';

type TokenDetails = {
  transactionId?: string;
  currency?: string;
  network?: string;
  address?: string;
  hash?: string;
  fee?: number | string;
  narration?: string;
  category?: 'token';
};

type APIDetail = TokenDetails | (Record<string, any> & { category?: 'token' });

type APITransaction = {
  id: string;
  type: string;
  status: string;
  amount: string;
  date: string;
  createdAt?: string;
  details?: APIDetail;
};

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TransactionHistoryScreen = () => {
  const router = useRouter();
  const { currency, tokenName } = useLocalSearchParams();

  // Generate months (last 12)
  const availableMonths = (() => {
    const months: { id: string; label: string; year: number; monthIndex: number }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      months.push({ id: label.toLowerCase().replace(' ', '_'), label, year: d.getFullYear(), monthIndex: d.getMonth() });
    }
    return months;
  })();

  // UI filters - FIXED: Only token-specific categories
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0]?.label || '');
  const [selectedCategory, setSelectedCategory] = useState<
    'All Categories' | 'Deposit' | 'Transfer' | 'Swap'
  >('All Categories');
  const [selectedStatus, setSelectedStatus] = useState<'All Status' | 'Successful' | 'Pending' | 'Failed'>('All Status');
  const [modalType, setModalType] = useState<null | 'category' | 'status' | 'month'>(null);

  // Data
  const {
    transactions,
    loading,
    error,
    refreshTransactions,
    hasTransactions,
    mapCategoryToType,
  } = useHistory((currency as string) || 'AVAX', { defaultPageSize: 50 });

  // Month range → ISO
  const getMonthRange = (label: string) => {
    if (!label) return { startDate: null, endDate: null };
    const [m, y] = label.split(' ');
    const year = parseInt(y, 10);
    const monthIndex = monthNames.indexOf(m);
    if (isNaN(year) || monthIndex < 0) return { startDate: null, endDate: null };
    const start = new Date(Date.UTC(year, monthIndex, 1));
    const end = new Date(Date.UTC(year, monthIndex + 1, 0));
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      startDate: `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}-${pad(start.getUTCDate())}`,
      endDate: `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}`,
    };
  };

  // FIXED: Proper filter mapping - let the hook handle the mapping
  const toServerFilters = () => {
    const statusMap: Record<string, string | undefined> = {
      Successful: 'SUCCESSFUL',
      Pending: 'PENDING',
      Failed: 'FAILED',
      'All Status': undefined
    };
    
    return {
      category: selectedCategory, // ✅ Pass category as-is, let hook handle mapping
      status: statusMap[selectedStatus],
    };
  };

  // Initial & month-change refetch
  useEffect(() => {
    const { startDate, endDate } = getMonthRange(selectedMonth);
    const serverFilters = toServerFilters();
    refreshTransactions({ startDate, endDate, ...serverFilters });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, refreshTransactions]);

  // Also refetch when Category/Status change
  useEffect(() => {
    const { startDate, endDate } = getMonthRange(selectedMonth);
    const serverFilters = toServerFilters();
    refreshTransactions({ startDate, endDate, ...serverFilters });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedStatus]);

  // UI events
  const handleGoBack = () => router.back();
  const handleMonthSelect = () => setModalType('month');
  const handleCategorySelect = () => setModalType('category');
  const handleStatusSelect = () => setModalType('status');

  const handleMonthSelection = (m: any) => { setSelectedMonth(m.label); setModalType(null); };
  const handleCategorySelection = (c: any) => { setSelectedCategory(c.label); setModalType(null); };
  const handleStatusSelection = (s: any) => { setSelectedStatus(s.label); setModalType(null); };

  const onRefresh = useCallback(async () => {
    const { startDate, endDate } = getMonthRange(selectedMonth);
    const serverFilters = toServerFilters();
    await refreshTransactions({ startDate, endDate, ...serverFilters });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTransactions, selectedMonth, selectedCategory, selectedStatus]);

  // FIXED: Only token-specific categories
  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'deposit', label: 'Deposit' },
    { id: 'transfer', label: 'Transfer' }, // Maps to WITHDRAWAL internally
    { id: 'swap', label: 'Swap' },
  ];
  
  const statuses = [
    { id: 'all', label: 'All Status' },
    { id: 'successful', label: 'Successful' },
    { id: 'pending', label: 'Pending' },
    { id: 'failed', label: 'Failed' },
  ];

  // ----- Helpers for list + receipt mapping -----
  const mapServiceTypeToUI = (t: string) => {
    switch (t) {
      case 'DEPOSIT': return 'Deposit';
      case 'WITHDRAWAL': return 'Withdrawal';
      case 'SWAP': return 'Swap';
      default: return t || 'Unknown';
    }
  };

  const mapServiceStatusToUI = (s: string) => {
    switch (s) {
      case 'SUCCESSFUL': return 'Successful';
      case 'FAILED': return 'Failed';
      case 'PENDING': return 'Pending';
      default: return s || 'Unknown';
    }
  };

  const getTransactionPrefix = (type: string, formattedAmount?: string) => {
    if (type === 'DEPOSIT') return '+';
    if (type === 'WITHDRAWAL') return '-';
    if (type === 'SWAP') {
      if (formattedAmount?.startsWith('+-')) return '-';
      if (formattedAmount?.startsWith('+')) return '+';
      if (formattedAmount?.startsWith('-')) return '-';
      return '';
    }
    return '';
  };

  const getStatusColor = (status: string) =>
    status === 'SUCCESSFUL' ? '#10B981' : status === 'FAILED' ? '#EF4444' : '#F59E0B';
  const getStatusBackgroundColor = (status: string) =>
    status === 'SUCCESSFUL' ? '#E8F5E8' : status === 'FAILED' ? '#FFE8E8' : '#FFF3E0';

  const formatAmountForDisplay = (value: number, symbol: string) => {
    if (!symbol) return value.toString();
    switch (String(symbol).toUpperCase()) {
      case 'NGN':
      case 'NGNZ':
      case 'NGNB':
        return value.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      case 'BTC':  return Number(value.toFixed(8)).toString();
      case 'ETH':  return Number(value.toFixed(6)).toString();
      case 'USDT':
      case 'USDC': return value.toFixed(2);
      default:
        if (value >= 1000) return value.toFixed(2);
        if (value >= 1) return Number(value.toFixed(4)).toString();
        if (value >= 0.01) return Number(value.toFixed(4)).toString();
        if (value >= 0.001) return Number(value.toFixed(6)).toString();
        return Number(value.toPrecision(3)).toString();
    }
  };

  const extractAmountValue = (tx: any) => {
    if (tx?.formattedAmount) {
      const clean = tx.formattedAmount.replace(/[+\-₦,\s]/g, '').replace(/[A-Z]/g, '').trim();
      const n = parseFloat(clean);
      if (!isNaN(n)) return n;
    }
    const candidates = [tx?.amount, tx?.amountNaira, tx?.amountNGNB, tx?.amountNGNZ];
    for (const c of candidates) {
      if (typeof c === 'number' && !isNaN(c)) return c;
      if (typeof c === 'string') {
        const n = parseFloat(c);
        if (!isNaN(n)) return n;
      }
    }
    return 0;
  };

  const toAPITransaction = (tx: any): APITransaction => {
    const serviceType = String(tx?.type || '');
    const serviceStatus = String(tx?.status || '');
    const amountNum = extractAmountValue(tx);
    const symbol = tx?.currency || tx?.symbol || tx?.asset || 'NGN';
    const prettyAmt = formatAmountForDisplay(amountNum, symbol);
    const sign = getTransactionPrefix(serviceType, tx?.formattedAmount);

    const isNaira = ['NGN','NGNB','NGNZ'].includes(String(symbol).toUpperCase());
    const amountStr = isNaira ? `${sign}₦${prettyAmt}` : `${sign}${prettyAmt} ${symbol}`;
    const dateText = tx?.formattedDate || (tx?.createdAt ? new Date(tx.createdAt).toLocaleString('en-NG') : '—');

    const d = tx?.details || {};
    const details: TokenDetails = {
      category: 'token',
      transactionId: d.transactionId || tx?.transactionId || tx?.txId || tx?.externalId || tx?.reference || tx?.id || tx?._id,
      currency: symbol,
      network: d.network || tx?.network || tx?.chain || tx?.blockchain,
      address: d.address || tx?.address || tx?.walletAddress || tx?.to || tx?.toAddress || tx?.receivingAddress,
      hash: d.hash || tx?.hash || tx?.txHash || tx?.transactionHash,
      fee: d.fee || tx?.fee || tx?.networkFee || tx?.gasFee || tx?.txFee,
      narration: d.narration || tx?.narration || tx?.note || tx?.description || tx?.memo || tx?.reason,
    };

    return {
      id: (tx?.id || tx?._id || tx?.transactionId || tx?.reference || tx?.externalId || '') + '',
      type: mapServiceTypeToUI(serviceType),
      status: mapServiceStatusToUI(serviceStatus),
      amount: amountStr,
      date: dateText,
      createdAt: tx?.createdAt,
      details,
    };
  };

  // REMOVED: Client-side filtering since backend should handle it properly now

  // Filter sheet component
  const FilterModal = ({
    visible, title, options, selectedValue, onSelect, onClose
  }: {
    visible: boolean; title: string; options: any[]; selectedValue: string;
    onSelect: (opt: any) => void; onClose: () => void;
  }) => (
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

    // Use transactions directly from hook since backend filtering should work
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
        {list.map((tx: any, idx: number) => {
          const amountNum = extractAmountValue(tx);
          const symbol = tx?.currency || tx?.symbol || tx?.asset || 'NGN';
          const formattedAmount = formatAmountForDisplay(amountNum, symbol);
          const prefix = getTransactionPrefix(tx.type, tx.formattedAmount);
          const humanType = mapServiceTypeToUI(tx.type);

          return (
            <TouchableOpacity
              key={(tx.id ?? tx._id ?? idx) as React.Key}
              style={styles.transactionItem}
              activeOpacity={0.85}
              onPress={() => {
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
                <Text style={styles.transactionType}>{humanType}</Text>
                <Text style={styles.transactionDate}>{tx.formattedDate || 'N/A'}</Text>
              </View>
              <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>{prefix}{formattedAmount} {symbol}</Text>
                <View style={[styles.statusContainer, { backgroundColor: getStatusBackgroundColor(tx.status) }]}>
                  <Text style={[styles.transactionStatus, { color: getStatusColor(tx.status) }]}>{mapServiceStatusToUI(tx.status)}</Text>
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
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleGoBack}
            activeOpacity={0.7}
            delayPressIn={0}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{displayTitle}</Text>
          <View style={styles.headerRight} />
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

          <View style={styles.transactionsContainer}>{renderTransactionsList()}</View>
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

// Styles remain the same...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F0FF' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F3F0FF',
  },
  backButton: { 
    width: 48, height: 48, justifyContent: 'center', alignItems: 'center',
    borderRadius: 24, backgroundColor: 'rgba(0, 0, 0, 0.02)', overflow: 'hidden',
  },
  backButtonText: { fontSize: 24, color: '#1F2937', fontWeight: '400' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', flex: 1, textAlign: 'center', marginRight: 48 },
  headerRight: { width: 0 },
  dateSelector: { alignItems: 'center', paddingVertical: 20 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  monthText: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginRight: 8 },
  dropdownIcon: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  filterSection: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 20 },
  filterButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  filterText: { fontSize: 14, color: '#6B7280', fontWeight: '400' },
  transactionsContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  transactionsList: { borderRadius: 12, paddingHorizontal: 16 },
  transactionItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
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
  modalContainer: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '50%', minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, backgroundColor: '#FFFFFF',
  },
  modalTitle: { color: '#111827', fontFamily: Typography?.medium || 'System', fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center' },
  closeButton: { padding: 4 },
  closeButtonText: { color: '#6B7280', fontSize: 18, fontWeight: '500' },
  optionsContainer: { flex: 1, paddingHorizontal: 20 },
  optionsContent: { paddingBottom: 20 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'flex-start' },
  monthsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
  optionCard: {
    backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
    paddingVertical: 16, paddingHorizontal: 20, minWidth: '45%', alignItems: 'center', justifyContent: 'center',
  },
  monthCard: {
    backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB',
    paddingVertical: 12, paddingHorizontal: 16, width: '31%', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  optionCardSelected: { backgroundColor: '#F8F7FF', borderColor: '#35297F', borderWidth: 2 },
  monthCardSelected: { backgroundColor: '#F8F7FF', borderColor: '#35297F', borderWidth: 2 },
  optionText: { color: '#6B7280', fontFamily: Typography?.medium || 'System', fontSize: 14, fontWeight: '500', textAlign: 'center' },
  optionTextSelected: { color: '#35297F', fontWeight: '600' },
});

export default TransactionHistoryScreen;