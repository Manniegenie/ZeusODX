// screens/withdrawal/WithdrawalReceiptScreen.tsx
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

// Brand/logo
import successImage from '../../components/icons/logo1.png';

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
  type: string;      // "Deposit" | "Withdrawal" | "Swap" | bill label
  status: string;    // "Successful" | "Failed" | "Pending"
  amount: string;    // "+₦10,000" | "-0.1 BTC"
  date: string;      // human-readable
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
export default function WithdrawalReceiptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const parsedTx = safeParseParam(params.tx) as APITransaction | undefined;
  const rawTx = safeParseParam(params.raw) as any | undefined;
  const transaction = parsedTx;

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

  const d = (transaction?.details || {}) as TokenDetails;
  const merged: TokenDetails = {
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
  };

  const onShare = async () => {
    try {
      const core = [
        `Type: ${transaction?.type ?? '—'}`,
        `Status: ${transaction?.status ?? '—'}`,
        `Amount: ${transaction?.amount ?? '—'}`,
        `Date: ${transaction?.date ?? '—'}`,
      ];

      const extra = [
        `Transaction ID: ${merged.transactionId ?? '—'}`,
        `Currency: ${merged.currency || '—'}`,
        `Network: ${merged.network || '—'}`,
        `Destination: ${merged.address ?? '—'}`,
        ...(merged.hash ? [`Hash: ${merged.hash}`] : []),
        ...(merged.fee !== undefined && merged.fee !== null ? [`Fee: ${merged.fee}`] : []),
        ...(merged.narration ? [`Narration: ${merged.narration}`] : []),
      ];

      const message = ['Withdrawal Receipt', '', ...core, '', ...extra].join('\n');
      await Share.share({ message });
    } catch {
      Alert.alert('Share failed', 'Could not open share sheet.');
    }
  };

  const handleDone = () => {
    router.push('/user/wallet');
  };

  // ---------- UI ----------
  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Image source={successImage} style={styles.headerLogo} resizeMode="contain" />
          <View style={styles.headerRight} />
        </View>
        <View style={[styles.centerContent, { padding: 24 }]}>
          <Text style={styles.emptyTitle}>No withdrawal data found</Text>
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleDone}
              activeOpacity={0.95}
            >
              <Text style={styles.primaryButtonText}>Go to Wallet</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Image source={successImage} style={styles.headerLogo} resizeMode="contain" />
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Withdrawal confirmation message */}
        <View style={styles.confirmationSection}>
          <Text style={styles.confirmationTitle}>Withdrawal Initiated</Text>
          <Text style={styles.confirmationSubtitle}>
            Your withdrawal request has been submitted successfully. You will receive a notification when the transaction is processed.
          </Text>
        </View>

        {/* Amount display */}
        <View style={styles.amountRow}>
          <Text style={styles.amountText} numberOfLines={1}>
            {transaction.amount}
          </Text>
        </View>

        {/* Status display */}
        <View style={styles.centeredStatus}>
          <View style={[styles.statusPill, { backgroundColor: s.bg, borderColor: s.border }]}>
            <Text style={[styles.statusPillText, { color: s.text }]} numberOfLines={1}>
              {transaction.status}
            </Text>
          </View>
        </View>

        {/* Transaction details card */}
        <View style={styles.detailsCard}>
          <Row label="Type" value={asText(transaction.type)} />
          <Row label="Date" value={asText(transaction.date)} />
          <Row
            label="Transaction ID"
            value={asText(merged.transactionId)}
            copyableValue={merged.transactionId as string}
            onCopy={(v) => handleCopy('Transaction ID', v)}
          />
          <Row label="Currency" value={asText(merged.currency)} />
          <Row label="Network" value={asText(merged.network)} />
          {!!merged.address && (
            <Row
              label="Destination"
              value={maskMiddle(asText(merged.address))}
              copyableValue={typeof merged.address === 'string' ? merged.address : undefined}
              onCopy={(v) => handleCopy('Destination Address', v)}
            />
          )}
          {!!merged.hash && (
            <Row
              label="Hash"
              value={maskMiddle(asText(merged.hash))}
              copyableValue={typeof merged.hash === 'string' ? merged.hash : undefined}
              onCopy={(v) => handleCopy('Transaction Hash', v)}
            />
          )}
          {merged.fee !== undefined && merged.fee !== null && (
            <Row label="Network Fee" value={asText(merged.fee)} />
          )}
          {!!merged.narration && <Row label="Note" value={asText(merged.narration)} />}
        </View>

        {/* Important notice */}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Important</Text>
          <Text style={styles.noticeText}>
            • Processing time may vary depending on network congestion{'\n'}
            • You will receive a notification once the transaction is confirmed{'\n'}
            • Keep this receipt for your records
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleDone}
            activeOpacity={0.95}
          >
            <Text style={styles.primaryButtonText}>Go to Wallet</Text>
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
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { fontSize: 24, color: '#1F2937', fontWeight: '400' },
  headerLogo: { width: 100, height: 44 },
  headerRight: { width: 44 },

  centerContent: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  emptyTitle: {
    fontSize: 16,
    color: Colors.text?.primary || '#111827',
    marginBottom: 12,
  },

  confirmationSection: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  confirmationTitle: {
    fontFamily: Typography.bold || 'System',
    fontSize: 18,
    color: Colors.text?.primary || '#111827',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationSubtitle: {
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    color: Colors.text?.secondary || '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 6,
    marginTop: 16,
  },
  amountText: {
    fontFamily: Typography.bold || 'System',
    fontSize: 24,
    color: Colors.text?.primary || '#111827',
    fontWeight: '700',
  },

  centeredStatus: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout?.spacing?.lg || 16,
  },
  statusPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  statusPillText: { fontFamily: Typography.medium || 'System', fontSize: 14, fontWeight: '600' },

  detailsCard: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: Layout?.spacing?.lg || 16,
  },

  noticeCard: {
    width: '100%',
    backgroundColor: '#FFF8E6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#FBE1B3',
    marginBottom: Layout?.spacing?.lg || 16,
  },
  noticeTitle: {
    fontFamily: Typography.medium || 'System',
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
    marginBottom: 8,
  },
  noticeText: {
    fontFamily: Typography.regular || 'System',
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 8 },
  rowLabel: {
    flexShrink: 0,
    width: 120,
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
    paddingVertical: Layout?.spacing?.md || 16,
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
    paddingVertical: Layout?.spacing?.md || 16,
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