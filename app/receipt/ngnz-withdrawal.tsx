// app/receipt/ngnz-withdrawal.tsx
import Clipboard from '@react-native-clipboard/clipboard';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useMemo } from 'react';
import {
    Alert,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Typography } from '../../constants/Typography';
import { getPdfLayoutScale } from '../../utils/pdfLayout';

// Icons
// @ts-ignore
import backIcon from '../../components/icons/backy.png';
// @ts-ignore
import successImage from '../../components/icons/logo1.png';

type WithdrawalDetails = {
  withdrawalId?: string;
  reference?: string;
  amount?: number | string;
  currency?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  bankCode?: string;
  fee?: number | string;
  narration?: string;
  status?: string;
  createdAt?: string;
  provider?: string;
  obiexStatus?: string;
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

export default function NGNZWithdrawalReceiptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extract withdrawal data from params
  const withdrawalData = useMemo(() => {
    try {
      const data = {
        withdrawalId: params.withdrawalId as string,
        reference: params.reference as string,
        amount: params.amount as string,
        currency: params.currency as string || 'NGN',
        bankName: params.bankName as string,
        accountName: params.accountName as string,
        accountNumber: params.accountNumber as string,
        bankCode: params.bankCode as string,
        fee: params.fee as string,
        narration: params.narration as string,
        status: params.status as string,
        createdAt: params.createdAt as string,
        provider: params.provider as string,
        obiexStatus: params.obiexStatus as string,
      } as WithdrawalDetails;
      
      // DEBUG: Log the received account number to verify it's full
      console.log('🔍 Received Account Number in Receipt:', data.accountNumber);
      console.log('🔍 All Params:', params);
      
      return data;
    } catch (error) {
      console.error('Error parsing withdrawal data:', error);
      return null;
    }
  }, [params]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
    try {
      return new Date(dateString).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
    }
  };

  // ---------- PDF Generation ----------
  const generateWithdrawalReceiptHTML = (withdrawal: WithdrawalDetails) => {
    const currentDate = new Date().toLocaleString();
    const logoBase64 = '';
    const statusStyle = statusStyles(withdrawal.status || '');
    const amount = formatAmtSym(withdrawal.amount, 'NGN');
    const date = formatDate(withdrawal.createdAt);
    
    const detailRows: string[] = [];
    detailRows.push(`<tr><td>Type</td><td>Withdrawal</td></tr>`);
    detailRows.push(`<tr><td>Date</td><td>${date}</td></tr>`);
    detailRows.push(`<tr><td>Reference</td><td>${asText(withdrawal.reference || withdrawal.withdrawalId)}</td></tr>`);
    detailRows.push(`<tr><td>Bank Name</td><td>${asText(withdrawal.bankName)}</td></tr>`);
    detailRows.push(`<tr><td>Account Name</td><td>${asText(withdrawal.accountName)}</td></tr>`);
    detailRows.push(`<tr><td>Account Number</td><td>${asText(withdrawal.accountNumber)}</td></tr>`);
    detailRows.push(`<tr><td>Withdrawal Fee</td><td>₦100</td></tr>`);
    detailRows.push(`<tr><td>Currency</td><td>${asText(withdrawal.currency || 'NGN')}</td></tr>`);
    detailRows.push(`<tr><td>Status</td><td>${asText(withdrawal.obiexStatus || withdrawal.status)}</td></tr>`);

    const layoutScale = getPdfLayoutScale(detailRows.length, { extraSections: 5, baseRows: 9 });
    const fontScale = layoutScale.fontScale.toFixed(3);
    const spacingScale = layoutScale.spacingScale.toFixed(3);
    const contentScale = layoutScale.contentScale.toFixed(3);

    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Withdrawal Receipt</title>
          <style>
              :root {
                  --font-scale: ${fontScale};
                  --spacing-scale: ${spacingScale};
                  --content-scale: ${contentScale};
              }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              @page { size: A4; margin: 0; }
              html, body { height: 100%; }
              body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                  background: #F3F0FF;
                  color: #111827;
                  line-height: calc(1.45 * var(--font-scale));
                  -webkit-font-smoothing: antialiased;
                  font-size: calc(21px * var(--font-scale));
                  width: 100%;
                  margin: 0;
                  padding: 0;
                  min-height: 100vh;
                  overflow: hidden;
              }
              .container { 
                  width: 100%; 
                  margin: 0; 
                  background: #F3F0FF; 
                  min-height: 100vh; 
                  max-height: 100vh;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  page-break-inside: avoid;
              }
              .header { 
                  background: #F3F0FF; 
                  padding: calc(24px * var(--spacing-scale)) calc(36px * var(--spacing-scale)); 
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
              }
              .header-logo { width: 150px; height: 66px; object-fit: contain; }
              .scaled-block {
                  width: calc(100% / var(--content-scale));
                  transform: scale(var(--content-scale));
                  transform-origin: top center;
              }
              .content { 
                  padding: 0 calc(36px * var(--spacing-scale)) calc(48px * var(--spacing-scale)) calc(36px * var(--spacing-scale)); 
                  display: flex;
                  flex-direction: column;
                  gap: calc(18px * var(--spacing-scale));
              }
              .amount-section { text-align: center; margin: calc(30px * var(--spacing-scale)) 0 calc(9px * var(--spacing-scale)) 0; }
              .amount-text { font-size: calc(42px * var(--font-scale)); font-weight: bold; color: #111827; }
              .status-container { text-align: center; margin-bottom: calc(24px * var(--spacing-scale)); }
              .status-pill {
                  display: inline-block;
                  padding: calc(9px * var(--spacing-scale)) calc(15px * var(--spacing-scale));
                  border-radius: 999px;
                  border: 1px solid ${statusStyle.border};
                  background-color: ${statusStyle.bg};
                  color: ${statusStyle.text};
                  font-size: calc(18px * var(--font-scale));
                  font-weight: 600;
              }
              .details-card {
                  width: 100%;
                  background: #F8F9FA;
                  border-radius: 12px;
                  padding: calc(30px * var(--spacing-scale)) calc(24px * var(--spacing-scale));
                  border: 1px solid #E5E7EB;
                  margin-bottom: calc(30px * var(--spacing-scale));
                  page-break-inside: avoid;
              }
              .details-table { width: 100%; border-collapse: collapse; }
              .details-table tr { border-bottom: none; }
              .details-table td { padding: calc(18px * var(--spacing-scale)) 0; vertical-align: middle; border-bottom: none; }
              .details-table td:first-child {
                  width: 195px;
                  flex-shrink: 0;
                  color: #6B7280;
                  font-size: calc(21px * var(--font-scale));
                  font-weight: normal;
              }
              .details-table td:last-child {
                  color: #111827;
                  font-size: calc(21px * var(--font-scale));
                  font-weight: 500;
                  text-align: right;
                  word-break: break-word;
              }
              .footer-message { 
                  margin-bottom: calc(30px * var(--spacing-scale)); 
                  padding: 0 calc(36px * var(--spacing-scale)); 
              }
              .footer-text { 
                  font-size: calc(19px * var(--font-scale)); 
                  color: #6B7280; 
                  line-height: calc(1.4 * var(--font-scale)); 
                  margin: 0; 
                  text-align: left; 
              }
              .generation-footer {
                  text-align: center;
                  padding: calc(30px * var(--spacing-scale)) calc(36px * var(--spacing-scale));
                  color: #9CA3AF;
                  font-size: calc(18px * var(--font-scale));
                  border-top: 1px solid #E5E7EB;
                  margin-top: calc(30px * var(--spacing-scale));
              }
              .footer-message,
              .generation-footer,
              .content {
                  margin-left: auto;
                  margin-right: auto;
              }
              @media print {
                  body { background: #F3F0FF; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  .container { box-shadow: none; background: #F3F0FF; }
                  @page { margin: 0; }
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <img src="${logoBase64}" alt="Logo" class="header-logo">
              </div>
          <div class="content scaled-block">
                  <div class="amount-section">
                      <div class="amount-text">${amount}</div>
                  </div>
                  <div class="status-container">
                      <span class="status-pill">${withdrawal.status || 'Processing'}</span>
                  </div>
                  <div class="details-card">
                      <table class="details-table">
                          ${detailRows.join('')}
                      </table>
                  </div>
              </div>
          <div class="footer-message scaled-block">
                  <p class="footer-text">Thank you for choosing ZeusODX.</p>
              </div>
          <div class="generation-footer scaled-block">
                  Generated on: ${currentDate}
              </div>
          </div>
      </body>
      </html>
    `;
  };

  const onShare = async () => {
    try {
      if (!withdrawalData) {
        Alert.alert('Error', 'No withdrawal data to share');
        return;
      }

      const htmlContent = generateWithdrawalReceiptHTML(withdrawalData);

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        width: 612,
        height: 792,
        base64: false,
      });

      if (!uri) throw new Error('Failed to generate PDF');

      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Withdrawal Receipt',
          UTI: 'com.adobe.pdf',
        });
        return;
      }

      await Share.share({
        title: 'Withdrawal Receipt',
        message: 'Withdrawal receipt attached.',
        url: Platform.OS === 'ios' ? uri : `file://${uri}`,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Share failed', 'Could not generate PDF receipt. Please try again.');
    }
  };

  const handleCopy = (label: string, value?: string) => {
    if (!value) return;
    try {
      Clipboard.setString(value);
      Alert.alert('Copied!', `${label} copied to clipboard`);
    } catch {
      Alert.alert('Copy failed', `Unable to copy ${label.toLowerCase()}`);
    }
  };

  if (!withdrawalData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            activeOpacity={0.7}
            delayPressIn={0}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Image source={backIcon} style={styles.backIcon} />
          </TouchableOpacity>
          <Image source={successImage} style={styles.headerLogo} resizeMode="contain" />
          <View style={styles.headerRight} />
        </View>
        <View style={[styles.centerContent, { padding: 24 }]}>
          <Text style={styles.emptyTitle}>No withdrawal data found</Text>
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

  const s = statusStyles(withdrawalData.status || '');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.7}
          delayPressIn={0}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Image source={backIcon} style={styles.backIcon} />
        </TouchableOpacity>
        <Image source={successImage} style={styles.headerLogo} resizeMode="contain" />
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.amountRow}>
          <Text style={styles.amountText} numberOfLines={1}>
            {formatAmtSym(withdrawalData.amount, 'NGN')}
          </Text>
        </View>

        <View style={styles.centeredStatus}>
          <View style={[styles.statusPill, { backgroundColor: s.bg, borderColor: s.border }]}>
            <Text style={[styles.statusPillText, { color: s.text }]} numberOfLines={1}>
              {withdrawalData.status || 'Processing'}
            </Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Row label="Type" value="Withdrawal" />
          <Row label="Date" value={formatDate(withdrawalData.createdAt)} />
          <Row
            label="Reference"
            value={asText(withdrawalData.reference || withdrawalData.withdrawalId)}
            copyableValue={withdrawalData.reference || withdrawalData.withdrawalId as string}
            onCopy={(v) => handleCopy('Reference', v)}
          />
          <Row label="Bank Name" value={asText(withdrawalData.bankName)} />
          <Row label="Account Name" value={asText(withdrawalData.accountName)} />
          <Row
            label="Account Number"
            value={asText(withdrawalData.accountNumber)}
            copyableValue={withdrawalData.accountNumber as string}
            onCopy={(v) => handleCopy('Account Number', v)}
          />
          <Row 
            label="Withdrawal Fee" 
            value="₦100" 
          />
          <Row label="Currency" value={asText(withdrawalData.currency || 'NGN')} />
          <Row label="Status" value={asText(withdrawalData.obiexStatus || withdrawalData.status)} />
        </View>

        <View style={styles.footerMessage}>
          <Text style={styles.footerText}>Thank you for choosing ZeusODX.</Text>
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
  isHashLink = false,
  onHashPress,
}: {
  label: string;
  value: string;
  copyableValue?: string;
  onCopy?: (val: string) => void;
  isHashLink?: boolean;
  onHashPress?: () => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.rowValueWrap}>
        {isHashLink && onHashPress ? (
          <TouchableOpacity onPress={onHashPress} activeOpacity={0.7}>
            <Text style={[styles.rowValue, styles.linkText]} numberOfLines={1}>
              {value}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.rowValue} numberOfLines={1}>
            {value}
          </Text>
        )}
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
  headerLogo: { width: 100, height: 44 },
  headerRight: { width: 44 },

  centerContent: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  emptyTitle: {
    fontSize: 16,
    color: Colors.text?.primary || '#111827',
    marginBottom: 12,
  },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 6,
  },
  amountText: {
    fontFamily: Typography.bold || 'System',
    fontSize: 28,
    color: Colors.text?.primary || '#111827',
  },

  centeredStatus: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout?.spacing?.xs || 8,
  },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  statusPillText: { fontFamily: Typography.medium || 'System', fontSize: 12, top: 1 },

  detailsCard: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: Layout?.spacing?.lg || 16,
  },

  footerMessage: {
    width: '100%',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    lineHeight: 20,
    textAlign: 'left',
  },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 8 },
  rowLabel: {
    flexShrink: 0,
    width: 130,
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
  },
  rowValueWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end' },
  rowValue: { color: '#111827', fontFamily: Typography.medium || 'System', fontSize: 14, textAlign: 'right', flexShrink: 1 },
  
  linkText: {
    color: '#35297F',
    textDecorationLine: 'underline',
  },

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
