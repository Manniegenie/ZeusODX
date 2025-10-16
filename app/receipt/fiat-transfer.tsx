// app/receipt/fiat-transfer.tsx
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
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

// Icons
// @ts-ignore
import backIcon from '../../components/icons/backy.png';
// @ts-ignore
import successImage from '../../components/icons/check-check.png';
// @ts-ignore
import copyIcon from '../../components/icons/copy-icon.png';

type TransferDetails = {
  transactionId?: string;
  reference?: string;
  amount?: number | string;
  currency?: string;
  recipientUsername?: string;
  recipientName?: string;
  transferType?: string;
  fee?: number | string;
  narration?: string;
  status?: string;
  createdAt?: string;
  provider?: string;
  balanceAfter?: number | string;
};

export default function FiatTransferReceiptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extract transfer data from params
  const transferData = useMemo(() => {
    try {
      const data = {
        transactionId: params.transactionId as string,
        reference: params.reference as string,
        amount: params.amount as string,
        currency: params.currency as string || 'NGNZ',
        recipientUsername: params.recipientUsername as string,
        recipientName: params.recipientName as string,
        transferType: params.transferType as string || 'Transfer',
        fee: params.fee as string,
        narration: params.narration as string,
        status: params.status as string,
        createdAt: params.createdAt as string,
        provider: params.provider as string,
        balanceAfter: params.balanceAfter as string,
      } as TransferDetails;
      
      // DEBUG: Log the received transfer data
      console.log('🔍 Received Transfer Data in Receipt:', data);
      console.log('🔍 All Params:', params);
      
      return data;
    } catch (error) {
      console.error('Error parsing transfer data:', error);
      return null;
    }
  }, [params]);

  const formatAmount = (amount: string | number | undefined, currency: string | undefined) => {
    if (!amount) return `${currency || ''} 0`;
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (currency === 'NGNZ' || currency === 'NGN') {
      return `₦${Math.round(numAmount).toLocaleString('en-NG')}`;
    }
    
    return `${numAmount.toFixed(2)} ${currency || ''}`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
    try {
      return new Date(dateString).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'successful':
      case 'completed':
      case 'success':
        return { bg: '#D1FAE5', border: '#10B981', text: '#065F46' };
      case 'pending':
      case 'processing':
        return { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' };
      case 'failed':
      case 'rejected':
        return { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' };
      default:
        return { bg: '#D1FAE5', border: '#10B981', text: '#065F46' }; // Default to success
    }
  };

  const generateTransferReceiptHTML = (transfer: TransferDetails) => {
    const statusColors = getStatusColor(transfer.status);
    const amount = formatAmount(transfer.amount, transfer.currency);
    const date = formatDate(transfer.createdAt);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${transfer.transferType || 'Transfer'} Receipt</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: #111827;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #E5E7EB;
          }
          .logo {
            width: 60px;
            height: 60px;
            margin: 0 auto 15px;
            background: #35297F;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
          }
          .title {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin: 0;
          }
          .subtitle {
            font-size: 14px;
            color: #6B7280;
            margin: 5px 0 0;
          }
          .receipt-content {
            max-width: 500px;
            margin: 0 auto;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 20px;
            background-color: ${statusColors.bg};
            color: ${statusColors.text};
            border: 1px solid ${statusColors.border};
          }
          .amount-section {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: #F8F9FA;
            border-radius: 12px;
            border: 1px solid #E5E7EB;
          }
          .amount-label {
            font-size: 14px;
            color: #6B7280;
            margin-bottom: 8px;
          }
          .amount-value {
            font-size: 32px;
            font-weight: 700;
            color: #111827;
          }
          .details-section {
            margin-bottom: 30px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #F3F4F6;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-size: 14px;
            color: #6B7280;
            font-weight: 500;
          }
          .detail-value {
            font-size: 14px;
            color: #111827;
            font-weight: 600;
            text-align: right;
            max-width: 60%;
            word-break: break-all;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            text-align: center;
            color: #6B7280;
            font-size: 12px;
          }
          .note {
            background: #FEF3C7;
            border: 1px solid #F59E0B;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400E;
          }
        </style>
      </head>
      <body>
        <div class="receipt-content">
          <div class="header">
            <div class="logo">Z</div>
            <h1 class="title">${transfer.transferType || 'Transfer'} Receipt</h1>
            <p class="subtitle">${transfer.currency || 'NGNZ'} Transfer</p>
          </div>
          
          <div style="text-align: center;">
            <span class="status-badge">${transfer.status || 'Successful'}</span>
          </div>
          
          <div class="amount-section">
            <div class="amount-label">Amount Sent</div>
            <div class="amount-value">${amount}</div>
          </div>
          
          <div class="details-section">
            <div class="detail-row">
              <span class="detail-label">Reference ID</span>
              <span class="detail-value">${transfer.reference || transfer.transactionId || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Transaction Date</span>
              <span class="detail-value">${date}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Recipient</span>
              <span class="detail-value">${transfer.recipientUsername ? `@${transfer.recipientUsername}` : transfer.recipientName || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Transfer Type</span>
              <span class="detail-value">${transfer.transferType || 'Transfer'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Currency</span>
              <span class="detail-value">${transfer.currency || 'NGNZ'}</span>
            </div>
            ${transfer.fee ? `
            <div class="detail-row">
              <span class="detail-label">Transaction Fee</span>
              <span class="detail-value">${formatAmount(transfer.fee, transfer.currency)}</span>
            </div>
            ` : ''}
            ${transfer.balanceAfter ? `
            <div class="detail-row">
              <span class="detail-label">Balance After</span>
              <span class="detail-value">${formatAmount(transfer.balanceAfter, transfer.currency)}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Provider</span>
              <span class="detail-value">${transfer.provider || 'ZeusODX'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="detail-value">${transfer.status || 'Successful'}</span>
            </div>
          </div>
          
          ${transfer.narration ? `
          <div class="note">
            <strong>Note:</strong> ${transfer.narration}
          </div>
          ` : ''}
          
          <div class="footer">
            <p>This receipt was generated by ZeusODX</p>
            <p>For support, contact our customer service team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const onShare = async () => {
    try {
      if (!transferData) {
        Alert.alert('Error', 'No transfer data to share');
        return;
      }

      const htmlContent = generateTransferReceiptHTML(transferData);

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
          dialogTitle: 'Share Transfer Receipt',
          UTI: 'com.adobe.pdf',
        });
        return;
      }

      await Share.share({
        title: 'Transfer Receipt',
        message: 'Transfer receipt attached.',
        url: Platform.OS === 'ios' ? uri : `file://${uri}`,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Share failed', 'Could not generate PDF receipt. Please try again.');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const handleDone = () => {
    router.push('/user/wallet');
  };

  if (!transferData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No transfer data found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColors = getStatusColor(transferData.status);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Image source={backIcon} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transfer Receipt</Text>
        <TouchableOpacity style={styles.shareButton} onPress={onShare}>
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Image
            source={successImage}
            style={styles.checkmarkIcon}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>{transferData.transferType || 'Transfer'} Successful</Text>

        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount Sent</Text>
          <Text style={styles.amountValue}>{formatAmount(transferData.amount, transferData.currency)}</Text>
        </View>

        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg, borderColor: statusColors.border }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {transferData.status || 'Successful'}
            </Text>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Transaction Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference ID</Text>
            <TouchableOpacity 
              style={styles.detailValueContainer}
              onPress={() => copyToClipboard(transferData.reference || transferData.transactionId || '', 'Reference ID')}
            >
              <Text style={styles.detailValue} numberOfLines={1}>
                {transferData.reference || transferData.transactionId || 'N/A'}
              </Text>
              <Image source={copyIcon} style={styles.copyIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction Date</Text>
            <Text style={styles.detailValue}>{formatDate(transferData.createdAt)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recipient</Text>
            <Text style={styles.detailValue}>
              {transferData.recipientUsername ? `@${transferData.recipientUsername}` : transferData.recipientName || 'N/A'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transfer Type</Text>
            <Text style={styles.detailValue}>{transferData.transferType || 'Transfer'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Currency</Text>
            <Text style={styles.detailValue}>{transferData.currency || 'NGNZ'}</Text>
          </View>

          {transferData.fee && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction Fee</Text>
              <Text style={styles.detailValue}>{formatAmount(transferData.fee, transferData.currency)}</Text>
            </View>
          )}

          {transferData.balanceAfter && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Balance After</Text>
              <Text style={styles.detailValue}>{formatAmount(transferData.balanceAfter, transferData.currency)}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Provider</Text>
            <Text style={styles.detailValue}>{transferData.provider || 'ZeusODX'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.detailValue}>{transferData.status || 'Successful'}</Text>
          </View>
        </View>

        {/* Note */}
        {transferData.narration && (
          <View style={styles.noteContainer}>
            <Text style={styles.noteTitle}>Note</Text>
            <Text style={styles.noteText}>{transferData.narration}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>This receipt was generated by ZeusODX</Text>
          <Text style={styles.footerSubtext}>For support, contact our customer service team</Text>
        </View>
      </ScrollView>

      {/* Done Button */}
      <View style={styles.buttonSection}>
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  headerTitle: {
    color: '#35297F',
    fontFamily: Typography.medium,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  shareButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#35297F',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Typography.medium,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  checkmarkIcon: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 24,
    fontFamily: Typography.medium,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  amountSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Typography.regular,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontFamily: Typography.medium,
    fontWeight: '700',
    color: '#111827',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
    fontFamily: Typography.medium,
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailsTitle: {
    fontSize: 18,
    fontFamily: Typography.medium,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Typography.regular,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontFamily: Typography.medium,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  copyIcon: {
    width: 16,
    height: 16,
    marginLeft: 8,
    resizeMode: 'contain',
  },
  noteContainer: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  noteTitle: {
    fontSize: 14,
    fontFamily: Typography.medium,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    fontFamily: Typography.regular,
    color: '#92400E',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Typography.regular,
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Typography.regular,
    textAlign: 'center',
  },
  buttonSection: {
    paddingHorizontal: 16,
    paddingBottom: 34,
    paddingTop: 16,
  },
  doneButton: {
    backgroundColor: '#35297F',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Typography.medium,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: Typography.regular,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#35297F',
    fontSize: 16,
    fontFamily: Typography.medium,
    fontWeight: '600',
  },
});

