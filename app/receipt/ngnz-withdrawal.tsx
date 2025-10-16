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

  const formatAmount = (amount: string | number | undefined) => {
    if (!amount) return '₦0';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₦${Math.round(numAmount).toLocaleString('en-NG')}`;
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
        return { bg: '#D1FAE5', border: '#10B981', text: '#065F46' };
      case 'pending':
      case 'processing':
        return { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' };
      case 'failed':
      case 'rejected':
        return { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' };
      default:
        return { bg: '#F3F4F6', border: '#6B7280', text: '#374151' };
    }
  };

  const generateWithdrawalReceiptHTML = (withdrawal: WithdrawalDetails) => {
    const statusColors = getStatusColor(withdrawal.status);
    const amount = formatAmount(withdrawal.amount);
    const date = formatDate(withdrawal.createdAt);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>NGNZ Withdrawal Receipt</title>
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
            <h1 class="title">Withdrawal Receipt</h1>
            <p class="subtitle">NGNZ to Bank Transfer</p>
          </div>
          
          <div style="text-align: center;">
            <span class="status-badge">${withdrawal.status || 'Processing'}</span>
          </div>
          
          <div class="amount-section">
            <div class="amount-label">Amount Withdrawn</div>
            <div class="amount-value">${amount}</div>
          </div>
          
          <div class="details-section">
            <div class="detail-row">
              <span class="detail-label">Reference ID</span>
              <span class="detail-value">${withdrawal.reference || withdrawal.withdrawalId || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Transaction Date</span>
              <span class="detail-value">${date}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Bank Name</span>
              <span class="detail-value">${withdrawal.bankName || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Account Name</span>
              <span class="detail-value">${withdrawal.accountName || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Account Number</span>
              <span class="detail-value">${withdrawal.accountNumber || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Bank Code</span>
              <span class="detail-value">${withdrawal.bankCode || 'N/A'}</span>
            </div>
            ${withdrawal.fee ? `
            <div class="detail-row">
              <span class="detail-label">Transaction Fee</span>
              <span class="detail-value">${formatAmount(withdrawal.fee)}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Provider</span>
              <span class="detail-value">${withdrawal.provider || 'ZeusODX'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="detail-value">${withdrawal.obiexStatus || withdrawal.status || 'Processing'}</span>
            </div>
          </div>
          
          ${withdrawal.narration ? `
          <div class="note">
            <strong>Note:</strong> ${withdrawal.narration}
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

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const handleDone = () => {
    router.push('/user/wallet');
  };

  if (!withdrawalData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No withdrawal data found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColors = getStatusColor(withdrawalData.status);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Image source={backIcon} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdrawal Receipt</Text>
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
        <Text style={styles.title}>Withdrawal Successful</Text>

        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount Withdrawn</Text>
          <Text style={styles.amountValue}>{formatAmount(withdrawalData.amount)}</Text>
        </View>

        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg, borderColor: statusColors.border }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {withdrawalData.status || 'Processing'}
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
              onPress={() => copyToClipboard(withdrawalData.reference || withdrawalData.withdrawalId || '', 'Reference ID')}
            >
              <Text style={styles.detailValue} numberOfLines={1}>
                {withdrawalData.reference || withdrawalData.withdrawalId || 'N/A'}
              </Text>
              <Image source={copyIcon} style={styles.copyIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction Date</Text>
            <Text style={styles.detailValue}>{formatDate(withdrawalData.createdAt)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bank Name</Text>
            <Text style={styles.detailValue}>{withdrawalData.bankName || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Account Name</Text>
            <Text style={styles.detailValue}>{withdrawalData.accountName || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Account Number</Text>
            <TouchableOpacity 
              style={styles.detailValueContainer}
              onPress={() => copyToClipboard(withdrawalData.accountNumber || '', 'Account Number')}
            >
              <Text style={styles.detailValue} numberOfLines={1}>
                {withdrawalData.accountNumber || 'N/A'}
              </Text>
              <Image source={copyIcon} style={styles.copyIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bank Code</Text>
            <Text style={styles.detailValue}>{withdrawalData.bankCode || 'N/A'}</Text>
          </View>

          {withdrawalData.fee && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction Fee</Text>
              <Text style={styles.detailValue}>{formatAmount(withdrawalData.fee)}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Provider</Text>
            <Text style={styles.detailValue}>{withdrawalData.provider || 'ZeusODX'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.detailValue}>{withdrawalData.obiexStatus || withdrawalData.status || 'Processing'}</Text>
          </View>
        </View>

        {/* Note */}
        {withdrawalData.narration && (
          <View style={styles.noteContainer}>
            <Text style={styles.noteTitle}>Note</Text>
            <Text style={styles.noteText}>{withdrawalData.narration}</Text>
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
