// screens/history/TransactionReceiptScreen.tsx
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  Clipboard,
  Share,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

type TokenDetails = {
  transactionId?: string;
  currency?: string;
  network?: string;
  address?: string;
  hash?: string;
  fee?: number | string;
  narration?: string;
  createdAt?: string;
  category?: 'token';
};

type UtilityDetails = {
  orderId?: string;
  requestId?: string;
  productName?: string;
  quantity?: number | string;
  network?: string;
  customerInfo?: string;
  billType?: string;
  paymentCurrency?: string;
  category?: 'utility';
};

export type APIDetail =
  | TokenDetails
  | UtilityDetails
  | (Record<string, any> & { category?: 'token' | 'utility' });

export type APITransaction = {
  id: string;
  type: string; // "Deposit" | "Withdrawal" | "Swap" | bill label
  status: string; // "Successful" | "Failed" | "Pending"
  amount: string; // "+₦10,000" | "-0.1 BTC"
  date: string; // human-readable
  createdAt?: string;
  details?: APIDetail;
};

// ---------- helpers ----------
const maskMiddle = (v?: string, lead = 6, tail = 4) => {
  if (!v) return '—';
  const s = String(v);
  if (s.length <= lead + tail) return s;
  return `${s.slice(0, lead)}…${s.slice(-tail)}`;
};

const asText = (v: any) => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return v.trim().length ? v : '—';
  return String(v);
};

const statusStyles = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'successful' || s === 'success')
    return { bg: '#E8F7EF', text: '#166534', border: '#BBE7CC' };
  if (s === 'failed' || s === 'error')
    return { bg: '#FDECEC', text: '#991B1B', border: '#F6CACA' };
  return { bg: '#FFF8E6', text: '#92400E', border: '#FBE1B3' };
};

// prefer value → or first truthy alias from rawTx
const pick = (value: any, raw: any, keys: string[]) => {
  if (value !== undefined && value !== null && value !== '') return value;
  if (!raw) return undefined;
  for (const k of keys) {
    const v = raw[k];
    if (v !== undefined && v !== null && `${v}`.length) return v;
  }
  return undefined;
};

const prettyNetwork = (net?: string) => {
  if (!net) return '—';
  const key = String(net).toUpperCase();
  const map: Record<string, string> = {
    ETHEREUM: 'Ethereum (ERC-20)',
    TRON: 'Tron (TRC-20)',
    BSC: 'BNB Smart Chain (BEP-20)',
    POLYGON: 'Polygon',
    AVALANCHE_C: 'Avalanche C-Chain',
    AVALANCHE_X: 'Avalanche X-Chain',
    AVALANCHE_P: 'Avalanche P-Chain',
    BITCOIN: 'Bitcoin',
    SOLANA: 'Solana',
  };
  return map[key] || net;
};

const formatAmtSym = (amount?: number | string, symbol?: string) => {
  if (amount === undefined || amount === null) return '—';
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return '—';
  const s = (symbol || '').toUpperCase();
  if (['NGN', 'NGNB', 'NGNZ', '₦'].includes(s)) {
    return `₦${Math.round(n).toLocaleString('en-NG')}`;
  }
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 8 })} ${s || ''}`.trim();
};

// Parse: "Swap 20000 NGNZ to 12.11754014 USDT"
const parseSwapFromNarration = (narr?: string) => {
  if (!narr) return null;
  const r =
    /(Swap|Swapped)\s+([\d.,]+)\s+([A-Za-z]+)\s+(?:to|for)\s+([\d.,]+)\s+([A-Za-z]+)/i;
  const m = narr.match(r);
  if (!m) return null;
  const fromAmount = parseFloat(m[2].replace(/,/g, ''));
  const fromCurrency = m[3].toUpperCase();
  const toAmount = parseFloat(m[4].replace(/,/g, ''));
  const toCurrency = m[5].toUpperCase();
  return { fromAmount, fromCurrency, toAmount, toCurrency };
};

const safeParseParam = (val?: string | string[]) => {
  if (!val) return undefined;
  const s = Array.isArray(val) ? val[0] : val;
  try {
    return JSON.parse(decodeURIComponent(s));
  } catch {
    try {
      return JSON.parse(s);
    } catch {
      return undefined;
    }
  }
};

// ---------- screen ----------
function TransactionReceiptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const parsedTx = safeParseParam(params.tx) as APITransaction | undefined;
  const rawTx = safeParseParam(params.raw) as any | undefined;
  const transaction = parsedTx;

  const cat: 'token' | 'utility' = useMemo(() => {
    const c = transaction?.details?.category;
    if (c === 'token' || c === 'utility') return c;
    const d = transaction?.details || {};
    if ('transactionId' in d || 'currency' in d || 'hash' in d || 'address' in d)
      return 'token';
    if ('orderId' in d || 'productName' in d || 'billType' in d || 'customerInfo' in d)
      return 'utility';
    const t = (transaction?.type || '').toLowerCase();
    return ['airtime', 'data', 'electricity', 'cable tv', 'internet', 'betting', 'education', 'other'].includes(t)
      ? 'utility'
      : 'token';
  }, [transaction]);

  const isSwap = /swap/i.test(transaction?.type || '');
  const s = statusStyles(transaction?.status || '');

  const handleCopy = async (label: string, value?: string) => {
    if (!value) return;
    try {
      await Clipboard.setString(value);
      Alert.alert('Copied!', `${label} copied to clipboard`);
    } catch {
      Alert.alert('Copy failed', `Unable to copy ${label.toLowerCase()}`);
    }
  };

  const d = (transaction?.details || {}) as TokenDetails & UtilityDetails;
  const merged: TokenDetails & UtilityDetails = {
    ...d,
    transactionId: pick(d.transactionId, rawTx, [
      'transactionId',
      'txId',
      'externalId',
      'reference',
      'id',
      '_id',
    ]),
    currency: (pick(d.currency, rawTx, ['currency', 'symbol', 'asset']) || '') as string,
    network: prettyNetwork(pick(d.network, rawTx, ['network', 'chain', 'blockchain']) as string),
    address: pick(d.address, rawTx, [
      'address',
      'walletAddress',
      'to',
      'toAddress',
      'receivingAddress',
    ]),
    hash: pick(d.hash, rawTx, ['hash', 'txHash', 'transactionHash']),
    fee: pick(d.fee, rawTx, ['fee', 'networkFee', 'gasFee', 'txFee']),
    narration: pick(d.narration, rawTx, ['narration', 'note', 'description', 'memo', 'reason']),
    orderId: pick((d as any).orderId, rawTx, ['orderId', 'order_id']),
    requestId: pick((d as any).requestId, rawTx, ['requestId', 'request_id']),
    productName: pick((d as any).productName, rawTx, ['productName', 'product']),
    quantity: pick((d as any).quantity, rawTx, ['quantity', 'units']),
    customerInfo: pick((d as any).customerInfo, rawTx, [
      'customerInfo',
      'customerPhone',
      'phone',
      'meterNo',
      'account',
    ]),
    billType: pick((d as any).billType, rawTx, ['billType', 'type']),
    paymentCurrency: pick((d as any).paymentCurrency, rawTx, ['paymentCurrency']),
  };

  const swapInfo = useMemo(() => {
    if (!isSwap) return null;
    const viaNarr = parseSwapFromNarration(String(merged.narration || ''));
    if (viaNarr) return viaNarr;
    const fromCurrency = (
      merged.currency || pick(null, rawTx, ['currency', 'symbol', 'asset']) || ''
    )
      .toString()
      .toUpperCase();
    const toCurrency = (
      pick(null, rawTx, ['toCurrency', 'toSymbol', 'toAsset']) || ''
    )
      .toString()
      .toUpperCase() || undefined;
    const toAmount = pick(null, rawTx, ['toAmount', 'amountOut', 'received']) as
      | number
      | string
      | undefined;
    return (fromCurrency || toCurrency)
      ? { fromAmount: undefined, fromCurrency, toAmount, toCurrency }
      : null;
  }, [isSwap, merged.narration, merged.currency, rawTx]);

  const onShare = async () => {
    try {
      const core = [
        `Type: ${transaction?.type ?? '—'}`,
        `Status: ${transaction?.status ?? '—'}`,
        `Amount: ${transaction?.amount ?? '—'}`,
        `Date: ${transaction?.date ?? '—'}`,
      ];

      let extra: string[] = [];
      if (cat === 'token') {
        const baseTokenRows = [
          `Currency: ${merged.currency || '—'}`,
          `Network: ${merged.network || '—'}`,
          merged.hash ? `Hash: ${merged.hash}` : '',
          merged.fee !== undefined && merged.fee !== null ? `Fee: ${merged.fee}` : '',
        ].filter(Boolean) as string[];

        if (isSwap) {
          const f = [
            `From: ${formatAmtSym(
              swapInfo?.fromAmount,
              swapInfo?.fromCurrency || merged.currency
            )}`,
            `To: ${formatAmtSym(swapInfo?.toAmount, swapInfo?.toCurrency)}`,
          ];
          extra = [...f, ...baseTokenRows];
        } else {
          extra = [
            `Transaction ID: ${merged.transactionId ?? '—'}`,
            `Address: ${merged.address ?? '—'}`,
            ...(merged.narration ? [`Narration: ${merged.narration}`] : []),
            ...baseTokenRows,
          ];
        }
      } else {
        extra = [
          `Order ID: ${merged.orderId ?? '—'}`,
          `Product: ${merged.productName ?? '—'}`,
          `Quantity: ${merged.quantity ?? '—'}`,
          `Network: ${merged.network ?? '—'}`,
          `Customer: ${merged.customerInfo ?? '—'}`,
          `Bill Type: ${merged.billType ?? '—'}`,
          `Pay Currency: ${merged.paymentCurrency ?? '—'}`,
        ];
      }

      const message = ['Transaction Details', '', ...core, '', ...extra].join('\n');
      await Share.share({ message });
    } catch {
      Alert.alert('Share failed', 'Could not open share sheet.');
    }
  };

  // ---------- UI ----------
  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={[styles.centerContent, { padding: 24 }]}>
          <Text style={styles.title}>No transaction selected</Text>
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.back()}
              activeOpacity={0.95}
            >
              <Text style={styles.primaryButtonText}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={onShare} activeOpacity={0.85}>
              <Text style={styles.secondaryButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <Image
            source={require('../../components/icons/check-check.png')}
            style={styles.checkmarkIcon}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {transaction.type}
        </Text>

        <View style={styles.amountRow}>
          <Text style={styles.amountText} numberOfLines={1}>
            {transaction.amount}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: s.bg, borderColor: s.border }]}>
            <Text style={[styles.statusPillText, { color: s.text }]} numberOfLines={1}>
              {transaction.status}
            </Text>
          </View>
        </View>

        {/* Always show date */}
        <Text style={styles.metaLine} numberOfLines={1}>
          {transaction.date}
        </Text>

        <View style={styles.detailsCard}>
          {/* Also include Date inside card */}
          <Row label="Date" value={asText(transaction.date)} />

          {cat === 'token' ? (
            <>
              {isSwap && (
                <>
                  <Row
                    label="From"
                    value={
                      swapInfo
                        ? `${formatAmtSym(
                            swapInfo.fromAmount,
                            swapInfo.fromCurrency || merged.currency
                          )}`
                        : `${merged.currency || '—'}`
                    }
                  />
                  <Row
                    label="To"
                    value={swapInfo ? `${formatAmtSym(swapInfo.toAmount, swapInfo.toCurrency)}` : '—'}
                  />
                </>
              )}

              {/* Only hide ID/Address/Narration for swaps */}
              {!isSwap && (
                <>
                  <Row
                    label="Transaction ID"
                    value={asText(merged.transactionId)}
                    copyableValue={merged.transactionId as string}
                    onCopy={(v) => handleCopy('Transaction ID', v)}
                  />
                  {!!merged.address && (
                    <Row
                      label="Address"
                      value={maskMiddle(asText(merged.address))}
                      copyableValue={typeof merged.address === 'string' ? merged.address : undefined}
                      onCopy={(v) => handleCopy('Address', v)}
                    />
                  )}
                  {!!merged.narration && <Row label="Narration" value={asText(merged.narration)} />}
                </>
              )}

              <Row label="Currency" value={asText(merged.currency)} />
              <Row label="Network" value={asText(merged.network)} />
              {!!merged.hash && (
                <Row
                  label="Hash"
                  value={maskMiddle(asText(merged.hash))}
                  copyableValue={typeof merged.hash === 'string' ? merged.hash : undefined}
                  onCopy={(v) => handleCopy('Hash', v)}
                />
              )}
              {merged.fee !== undefined && merged.fee !== null && (
                <Row label="Fee" value={asText(merged.fee)} />
              )}
            </>
          ) : (
            <>
              <Row label="Order ID" value={asText(merged.orderId)} />
              <Row label="Product" value={asText(merged.productName)} />
              <Row label="Quantity" value={asText(merged.quantity)} />
              <Row label="Network" value={asText(merged.network)} />
              <Row label="Customer" value={asText(merged.customerInfo)} />
              <Row label="Bill Type" value={asText(merged.billType)} />
              <Row label="Pay Currency" value={asText(merged.paymentCurrency)} />
            </>
          )}
        </View>

        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.back()}
            activeOpacity={0.95}
          >
            <Text style={styles.primaryButtonText}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={onShare} activeOpacity={0.85}>
            <Text style={styles.secondaryButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  copyableValue,
  onCopy,
}: {
  label: string;
  value: string;
  copyableValue?: string;
  onCopy?: (val: string) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.rowValueWrap}>
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
        {copyableValue ? (
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => onCopy && onCopy(copyableValue)}
            activeOpacity={0.8}
          >
            <Image
              source={require('../../components/icons/copy-icon.png')}
              style={styles.copyIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

// ---------- styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background || '#FFFFFF' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Layout?.spacing?.xl || 24, paddingBottom: 32 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout?.spacing?.xl || 24,
    paddingVertical: 12,
    backgroundColor: '#F3F0FF',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { fontSize: 24, color: '#1F2937', fontWeight: '400' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  headerRight: { width: 0 },

  centerContent: { alignItems: 'center', justifyContent: 'center', flex: 1 },

  iconContainer: {
    marginTop: 16,
    marginBottom: Layout?.spacing?.md || 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkIcon: { width: 64, height: 64 },

  title: {
    fontFamily: Typography.bold || 'System',
    fontSize: 20,
    lineHeight: 24,
    color: Colors.text?.primary || '#111827',
    textAlign: 'center',
    marginBottom: Layout?.spacing?.xs || 8,
    fontWeight: '700',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Layout?.spacing?.xs || 8,
    justifyContent: 'center',
  },
  amountText: { fontFamily: Typography.bold || 'System', fontSize: 17, color: Colors.text?.primary || '#111827' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  statusPillText: { fontFamily: Typography.medium || 'System', fontSize: 12, top: 1 },

  metaLine: {
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 12,
    marginBottom: Layout?.spacing?.md || 12,
    textAlign: 'center',
  },

  detailsCard: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: Layout?.spacing?.lg || 16,
  },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  rowLabel: {
    flexShrink: 0,
    width: 130,
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 13,
  },
  rowValueWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end' },
  rowValue: { color: '#111827', fontFamily: Typography.medium || 'System', fontSize: 13, textAlign: 'right', flexShrink: 1 },

  ctaRow: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary || '#35297F',
    paddingVertical: Layout?.spacing?.md || 14,
    borderRadius: Layout?.borderRadius?.lg || 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface || '#FFFFFF',
    fontFamily: Typography.medium || 'System',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.surface || '#FFFFFF',
    paddingVertical: Layout?.spacing?.md || 14,
    borderRadius: Layout?.borderRadius?.lg || 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '600', color: '#111827', fontFamily: Typography.medium || 'System' },

  copyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface || '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  copyIcon: { width: 16, height: 16 },
});

export default TransactionReceiptScreen;
export { TransactionReceiptScreen };
