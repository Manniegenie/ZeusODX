// app/components/FiatWithdrawalReceiptModal.tsx
import { Asset } from 'expo-asset';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useMemo } from 'react';
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
// @ts-ignore - Layout typing may be loose in your project
import { Layout } from '../constants/Layout';

// Brand/logo (local asset)
import successImage from '../components/icons/logo1.png';

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
  tx?: APITransaction;
  raw?: any;
  title?: string;
};

// ======== Helpers (mirroring your screen) ========
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
              source={require('../components/icons/copy-icon.png')}
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
  const router = useRouter();
  const s = statusStyles(tx?.status || '');

  const merged = useMemo(() => {
    const d = (tx?.details || {}) as Record<string, any>;
    return {
      transactionId: pick(d.transactionId, raw, ['transactionId', 'txId', 'externalId', 'id', '_id']),
      reference: pick(d.reference, raw, ['reference', 'obiexReference', 'ref', 'requestId']),
      provider: pick(d.provider, raw, ['provider', 'psp', 'source']) || '—',
      providerStatus: pick(d.providerStatus, raw, ['obiexStatus', 'providerStatus', 'pspStatus']),
      bankName: pick(d.bankName, raw, ['bankName']),
      accountName: pick(d.accountName, raw, ['accountName', 'beneficiaryName']),
      accountNumber: pick(d.accountNumber, raw, ['accountNumber', 'beneficiaryAccount']),
      currency: pick(d.currency, raw, ['currency', 'symbol']) || 'NGN',
      fee: pick(d.fee, raw, ['fee', 'charge', 'transactionFee']),
      amountText: tx?.amount,
      amount: pick(d.amount, raw, ['amount', 'value', 'ngnAmount']),
      narration: pick(d.narration, raw, ['narration', 'note', 'reason', 'description']),
      date: tx?.date || pick(d.createdAt, raw, ['createdAt', 'updatedAt']),
    };
  }, [tx, raw]);

  const handleCopy = async (label: string, value?: string) => {
    if (!value) return;
    try {
      await Clipboard.setStringAsync(value);
      Alert.alert('Copied!', `${label} copied to clipboard`);
    } catch {
      Alert.alert('Copy failed', `Unable to copy ${label.toLowerCase()}`);
    }
  };

  // Generate HTML with embedded logoBase64
  const generateHtmlWithLogo = async (logoDataUri: string) => {
    const date = merged.date ?? '—';
    const amount = merged.amountText ?? merged.amount ?? tx?.amount ?? '—';
    const provider = merged.provider ?? '—';
    const rows = [
      ['Transaction ID', merged.transactionId],
      ['Reference', merged.reference],
      ['Provider', provider],
      ['Bank', merged.bankName],
      ['Account Name', merged.accountName],
      ['Account Number', merged.accountNumber],
      ['Fee', asText(merged.fee)],
      ['Narration', merged.narration],
    ];

    const rowsHtml = rows
      .filter(([, v]) => v !== undefined && v !== null && `${v}`.length)
      .map(
        ([k, v]) =>
          `<tr><td style="padding:8px 0;font-weight:600;color:#6B7280;width:40%">${k}</td><td style="padding:8px 0;text-align:right">${v}</td></tr>`
      )
      .join('');

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width,initial-scale=1"/>
          <title>${title}</title>
        </head>
        <body style="font-family: Arial, Helvetica, sans-serif; color:#111827; padding:24px;">
          <div style="max-width:680px;margin:0 auto;">
            <div style="text-align:center; background:#F3F0FF; padding:20px; border-radius:8px;">
              <img src="${logoDataUri}" alt="logo" style="height:40px; display:block; margin:0 auto 8px;" />
              <h2 style="margin:0; color:#111827;">${title}</h2>
            </div>

            <div style="margin-top:20px; text-align:center;">
              <div style="font-size:20px; font-weight:700;">${amount}</div>
              <div style="display:inline-block; margin-top:8px; padding:6px 10px; border-radius:20px; background:${s.bg}; color:${s.text}; border:1px solid ${s.border};">
                ${tx?.status ?? '—'}
              </div>
              <div style="margin-top:8px;color:#6B7280">${date}</div>
            </div>

            <table style="width:100%; margin-top:20px; border-collapse:collapse;">
              ${rowsHtml}
            </table>

            <div style="margin-top:24px; color:#6B7280; font-size:12px; border-top:1px solid #E5E7EB; padding-top:12px; text-align:center;">
              Thank you for using our services.
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const onShare = async () => {
    try {
      // Load asset and convert to base64
      const asset = Asset.fromModule(successImage);
      await asset.downloadAsync();
      const localUri = asset.localUri || asset.uri;
      let base64 = '';
      if (localUri) {
        base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
      }
      const logoDataUri = `data:image/png;base64,${base64}`;

      const html = await generateHtmlWithLogo(logoDataUri);
      const { uri } = await Print.printToFileAsync({ html });
      if (!uri) throw new Error('Failed to generate PDF');
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: title });
      } else {
        Alert.alert('Share not available', `PDF generated at: ${uri}`);
      }
    } catch (err) {
      console.error('PDF/Share error', err);
      Alert.alert('Share failed', 'Could not generate or share PDF. Please try again.');
    }
  };

  const handleDone = () => {
    router.push('../../user/wallet');
    onClose?.();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
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
            {/* Amount centered */}
            <View style={styles.amountRow}>
              <Text style={styles.amountText} numberOfLines={1}>
                {tx?.amount ?? merged.amountText ?? '—'}
              </Text>
            </View>

            {/* Status pill */}
            <View style={styles.centeredStatus}>
              <View style={[styles.statusPill, { backgroundColor: s.bg, borderColor: s.border }]}>
                <Text style={[styles.statusPillText, { color: s.text }]} numberOfLines={1}>
                  {tx?.status ?? '—'}
                </Text>
              </View>
            </View>

            <Text style={styles.metaLine} numberOfLines={1}>
              {merged.date ?? '—'}
            </Text>

            {/* Details card */}
            <View style={styles.detailsCard}>
              <Row
                label="Type"
                value={asText(tx?.type)}
              />
              <Row label="Date" value={asText(tx?.date)} />

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
                value={asText(merged.accountNumber)}
                copyableValue={typeof merged.accountNumber === 'string' ? merged.accountNumber : undefined}
                onCopy={(v) => handleCopy('Account Number', v)}
              />

              {!!merged.fee && <Row label="Fee" value={asText(merged.fee)} />}
              {!!merged.narration && <Row label="Narration" value={asText(merged.narration)} />}
            </View>

            {/* CTAs */}
            <View style={styles.ctaRow}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleDone} activeOpacity={0.95}>
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

// ======== Styles (mirrored from TransactionReceiptScreen) ========
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 20, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface || '#FFFFFF',
    borderTopLeftRadius: Layout?.borderRadius?.xl || 16,
    borderTopRightRadius: Layout?.borderRadius?.xl || 16,
    paddingTop: 0,
    maxHeight: '88%',
  },

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

  scroll: { maxHeight: '100%' },
  scrollContent: {
    paddingHorizontal: Layout?.spacing?.xl || 24,
    paddingBottom: Layout?.spacing?.xl || 24,
  },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 6,
  },
  amountText: {
    fontFamily: Typography.bold || 'System',
    fontSize: 20,
    color: Colors.text?.primary || '#111827',
  },

  centeredStatus: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout?.spacing?.xs || 8,
  },
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
