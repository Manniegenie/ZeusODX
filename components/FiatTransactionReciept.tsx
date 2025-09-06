// app/components/FiatWithdrawalReceiptModal.tsx
import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Share,
  Clipboard, // keep consistent with your existing TransactionReceiptScreen
} from 'react-native';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
// @ts-ignore - Layout typing may be loose in your project
import { Layout } from '../constants/Layout';

// ======== Types (aligned with your TransactionReceiptScreen) ========
type APIDetail = Record<string, any> & { category?: 'token' | 'utility' };

export type APITransaction = {
  id: string;
  type: string;     // "Withdrawal" | "Deposit" | "Swap" | etc
  status: string;   // "Successful" | "Failed" | "Pending"
  amount: string;   // e.g. "-₦120,000"
  date: string;     // human-readable
  createdAt?: string;
  details?: APIDetail;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  /**
   * High-level normalized transaction (like you pass to TransactionReceiptScreen via params.tx)
   */
  tx?: APITransaction;
  /**
   * Raw payout/withdrawal object (e.g. provider result or your own DB model),
   * we will pick common fields from this as well
   */
  raw?: any;
  /**
   * Optional override title (defaults to "Withdrawal Receipt")
   */
  title?: string;
};

// ======== Helpers (mirroring your screen) ========
const maskMiddle = (v?: string, lead = 3, tail = 4) => {
  if (!v) return '—';
  const s = String(v);
  if (s.length <= lead + tail) return s;
  return `${s.slice(0, lead)}***${s.slice(-tail)}`;
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

// ======== Row component (same style language as screen) ========
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
              source={require('./icons/copy-icon.png')}
              style={styles.copyIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

// ======== Modal ========
export default function FiatWithdrawalReceiptModal({
  visible,
  onClose,
  tx,
  raw,
  title = 'Withdrawal Receipt',
}: Props) {
  const s = statusStyles(tx?.status || '');

  const merged = useMemo(() => {
    // Normalize common fiat withdrawal fields from either tx.details or raw
    const d = (tx?.details || {}) as Record<string, any>;
    return {
      // identifiers
      transactionId: pick(d.transactionId, raw, ['transactionId', 'txId', 'externalId', 'id', '_id']),
      reference: pick(d.reference, raw, ['reference', 'obiexReference', 'ref', 'requestId']),

      // provider & status
      provider: pick(d.provider, raw, ['provider', 'psp', 'source']) || '—',
      providerStatus: pick(d.providerStatus, raw, ['obiexStatus', 'providerStatus', 'pspStatus']),

      // bank details
      bankName: pick(d.bankName, raw, ['bankName']),
      bankCode: pick(d.bankCode, raw, ['bankCode']),
      accountName: pick(d.accountName, raw, ['accountName', 'beneficiaryName']),
      accountNumber: pick(d.accountNumber, raw, ['accountNumber', 'beneficiaryAccount']),

      // money fields
      currency: pick(d.currency, raw, ['currency', 'symbol']) || 'NGN',
      fee: pick(d.fee, raw, ['fee', 'charge', 'transactionFee']),
      amountText: tx?.amount, // already formatted like "-₦120,000"
      amount: pick(d.amount, raw, ['amount', 'value', 'ngnAmount']),

      // misc
      narration: pick(d.narration, raw, ['narration', 'note', 'reason', 'description']),
      date: tx?.date || pick(d.createdAt, raw, ['createdAt', 'updatedAt']),
    };
  }, [tx, raw]);

  const handleCopy = async (label: string, value?: string) => {
    if (!value) return;
    try {
      await Clipboard.setString(value);
      Alert.alert('Copied!', `${label} copied to clipboard`);
    } catch {
      Alert.alert('Copy failed', `Unable to copy ${label.toLowerCase()}`);
    }
  };

  const onShare = async () => {
    try {
      const lines = [
        'Fiat Withdrawal Receipt',
        '',
        `Type: ${tx?.type ?? 'Withdrawal'}`,
        `Status: ${tx?.status ?? '—'}`,
        `Amount: ${merged.amountText ?? merged.amount ?? '—'}`,
        `Date: ${merged.date ?? '—'}`,
        '',
        `Transaction ID: ${merged.transactionId ?? '—'}`,
        `Reference: ${merged.reference ?? '—'}`,
        `Provider: ${merged.provider ?? '—'}`,
        '',
        `Bank: ${merged.bankName ?? '—'}`,
        `Account Name: ${merged.accountName ?? '—'}`,
        `Account Number: ${merged.accountNumber ?? '—'}`,
        `Bank Code: ${merged.bankCode ?? '—'}`,
        '',
        `Fee: ${asText(merged.fee)}`,
        ...(merged.narration ? [`Narration: ${merged.narration}`] : []),
      ];
      await Share.share({ message: lines.join('\n') });
    } catch {
      Alert.alert('Share failed', 'Could not open share sheet.');
    }
  };

  // Render nothing if not visible to avoid unnecessary layout work
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Status Icon (same static icon as your TransactionReceiptScreen) */}
            <View style={styles.iconContainer}>
              <Image
                source={require('./icons/check-check.png')}
                style={styles.statusIcon}
                resizeMode="contain"
              />
            </View>

            {/* Title + Amount + Status */}
            <Text style={styles.title} numberOfLines={2}>
              {tx?.type || 'Withdrawal'}
            </Text>

            <View style={styles.amountRow}>
              <Text style={styles.amountText} numberOfLines={1}>
                {tx?.amount || '—'}
              </Text>
              <View style={[styles.statusPill, { backgroundColor: s.bg, borderColor: s.border }]}>
                <Text style={[styles.statusPillText, { color: s.text }]} numberOfLines={1}>
                  {tx?.status || '—'}
                </Text>
              </View>
            </View>

            <Text style={styles.metaLine} numberOfLines={1}>
              {merged.date || '—'}
            </Text>

            {/* Details Card */}
            <View style={styles.detailsCard}>
              <Row
                label="Transaction ID"
                value={asText(merged.transactionId)}
                copyableValue={merged.transactionId}
                onCopy={(v) => handleCopy('Transaction ID', v)}
              />
              <Row
                label="Reference"
                value={asText(merged.reference)}
                copyableValue={merged.reference}
                onCopy={(v) => handleCopy('Reference', v)}
              />
              <Row label="Provider" value={asText(merged.provider)} />
              {!!merged.providerStatus && <Row label="Provider Status" value={asText(merged.providerStatus)} />}

              <Row label="Bank" value={asText(merged.bankName)} />
              <Row label="Account Name" value={asText(merged.accountName)} />
              <Row
                label="Account Number"
                value={maskMiddle(asText(merged.accountNumber))}
                copyableValue={typeof merged.accountNumber === 'string' ? merged.accountNumber : undefined}
                onCopy={(v) => handleCopy('Account Number', v)}
              />
              {!!merged.bankCode && <Row label="Bank Code" value={asText(merged.bankCode)} />}

              {!!merged.fee && <Row label="Fee" value={asText(merged.fee)} />}
              {!!merged.narration && <Row label="Narration" value={asText(merged.narration)} />}
            </View>

            {/* CTAs */}
            <View style={styles.ctaRow}>
              <TouchableOpacity style={styles.primaryButton} onPress={onClose} activeOpacity={0.95}>
                <Text style={styles.primaryButtonText}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={onShare} activeOpacity={0.85}>
                <Text style={styles.secondaryButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ======== Styles ========
const styles = StyleSheet.create({
  // Overlay
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 20, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface || '#FFFFFF',
    borderTopLeftRadius: Layout?.borderRadius?.xl || 16,
    borderTopRightRadius: Layout?.borderRadius?.xl || 16,
    paddingTop: 8,
    maxHeight: '88%',
  },

  // Header
  header: {
    paddingHorizontal: Layout?.spacing?.xl || 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text?.primary || '#111827',
    textAlign: 'center',
  },
  closeBtn: { position: 'absolute', right: 16, top: 8, padding: 8 },
  closeBtnText: { fontSize: 18, color: '#6B7280' },

  // Body
  scroll: { maxHeight: '100%' },
  scrollContent: {
    paddingHorizontal: Layout?.spacing?.xl || 24,
    paddingBottom: Layout?.spacing?.xl || 24,
  },

  iconContainer: { alignItems: 'center', marginTop: 4, marginBottom: 8 },
  statusIcon: { width: 56, height: 56 },

  title: {
    fontFamily: Typography.bold || 'System',
    fontSize: 18,
    lineHeight: 22,
    color: Colors.text?.primary || '#111827',
    textAlign: 'center',
    marginBottom: Layout?.spacing?.xs || 6,
    fontWeight: '700',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Layout?.spacing?.xs || 6,
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

  ctaRow: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 4 },
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
