// app/receipt/bill-receipt.tsx
import Clipboard from '@react-native-clipboard/clipboard';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useMemo } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../constants/Colors';

// Icons
// @ts-ignore
import backIcon from '../../components/icons/backy.png';
// @ts-ignore

type BillDetails = {
  orderId?: string;
  requestId?: string;
  productName?: string;
  quantity?: number | string;
  network?: string;
  customerInfo?: string;
  billType?: string;
  paymentCurrency?: string;
  category?: 'utility';
  // Electricity specific fields
  token?: string;
  units?: number | string;
  band?: string;
  customerName?: string;
  customerAddress?: string;
};

export type BillTransaction = {
  id: string;
  type: string;
  status: string;
  amount: string;
  date: string;
  createdAt?: string;
  details?: BillDetails;
  utilityType?: string;
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
  if (typeof v === 'string' && v.trim() === '') return '—';
  return String(v);
};

const statusStyles = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'successful':
    case 'completed':
    case 'confirmed':
      return { color: '#10B981', backgroundColor: '#E8F5E8' };
    case 'failed':
    case 'rejected':
      return { color: '#EF4444', backgroundColor: '#FFE8E8' };
    case 'pending':
    case 'processing':
    case 'approved':
      return { color: '#F59E0B', backgroundColor: '#FFF3E0' };
    default:
      return { color: '#6B7280', backgroundColor: '#F3F4F6' };
  }
};

const formatAmtSym = (amount: string | number, currency: string = 'NGN') => {
  if (!amount) return '—';
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : amount;
  if (isNaN(num)) return '—';
  
  if (currency === 'NGN' || currency === 'NGNZ' || currency === 'NGNB') {
    return `₦${num.toLocaleString('en-NG')}`;
  }
  return `${num.toLocaleString()} ${currency}`;
};

const formatToken = (token?: string) => {
  if (!token) return '—';
  return token.replace(/(.{4})/g, '$1 ').trim();
};

const formatUnits = (units?: number | string) => {
  if (!units) return '—';
  const num = typeof units === 'string' ? parseFloat(units) : units;
  if (isNaN(num)) return '—';
  return `${num.toLocaleString()} kWh`;
};

const generateBillReceiptHTML = (
  transaction: BillTransaction,
  merged: BillDetails,
  statusStyle: any,
  billType: string
) => {
  const currentDate = new Date().toLocaleString();
  const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAACjQAAAIACAYAAAAvoxf9AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUABP5aSURBVHgB7P0JtCTZeR92fneJJSP3t7/au7t6R4MgAVkESdOgLcsiRdmmRMCkPZ7RyD6kl2N5tJFnKIEsmBJtS+dY1ozsH1HWoceSZathUrJEQqJECU0SIAgBDQLo7uqt9uXtL/fMWO+9c29kvqpX1d21dFd1v+r6/6ri5RYRGZkZ+/3i+xg95IwxbP9Dxhi9d6fkU4d3mmFzfskztCCYXyt0ERlSNU5mgRhraUMV4kySocBORNM+V2ekQ0bcsyOwz1HVTkzFTo20j+1gtiPyDTM+EePlc8y4593rwnZuwu3Us/JjEAAAwC0UuR6MhslgNEqHhsz2/FztzBNPLb/01HOPzz359NH1Z59a3H7uE0fXg9BL7822EQAAAAAAAAAAAAAAAAAAAODWJD3kGGPmnV6bBTu+XRQH/8Y3vsF+7dd+zbzzgqb5eWMfv1o5d66IAiPC1tzlUPitmijUAkmvrY2KOLFQM1a1b9YyxBqMUWA0k8wFKZKuM8Nq5J4zRtpp8tx9OwWefV4a+8dOqAtiFPYONy6YkcwsyPF6ACPCTQAAAAAAAAAAAAAAAAAAAAAAAOBB9dAHNN7OP/7HZ7xjxxpepeIJ3xfC8xpy9+r58Ny5zPe85/jjj1/h585d9XTarDarcZUZ7kvpB4axyAjRJM2axE1omAmYodAFMxKjmr3vERlBzHjcBTpqE3Hi0jCSxr7GGPMZad+ORxiXN5K5LI1lsGOZmdFMMzZOAxunGCE7IwAAAAAAAAAAAAAAAAAAAAAAADygPrQBjfeilLTL3vjFXzrP3ty+GDBfBvWl0OPFRmU8iRubV4e1wfbYj4eFV6Q88OzL';

  const detailRows: string[] = [];
  detailRows.push(`<tr><td>Type</td><td>${asText(transaction.type)}</td></tr>`);
  detailRows.push(`<tr><td>Date</td><td>${asText(transaction.date)}</td></tr>`);
  detailRows.push(`<tr><td>Status</td><td>${asText(transaction.status)}</td></tr>`);
  detailRows.push(`<tr><td>Amount</td><td>${asText(transaction.amount)}</td></tr>`);
  
  if (merged.orderId) {
    detailRows.push(`<tr><td>Order ID</td><td>${asText(merged.orderId)}</td></tr>`);
  }
  if (merged.requestId) {
    detailRows.push(`<tr><td>Request ID</td><td>${asText(merged.requestId)}</td></tr>`);
  }
  if (merged.productName) {
    detailRows.push(`<tr><td>Product</td><td>${asText(merged.productName)}</td></tr>`);
  }
  if (merged.network) {
    detailRows.push(`<tr><td>Provider</td><td>${asText(merged.network)}</td></tr>`);
  }
  if (merged.customerInfo) {
    detailRows.push(`<tr><td>Customer Info</td><td>${asText(merged.customerInfo)}</td></tr>`);
  }
  
  // Electricity specific fields
  if (billType === 'electricity') {
    if (merged.customerName) {
      detailRows.push(`<tr><td>Customer Name</td><td>${asText(merged.customerName)}</td></tr>`);
    }
    if (merged.customerAddress) {
      detailRows.push(`<tr><td>Address</td><td>${asText(merged.customerAddress)}</td></tr>`);
    }
    if (merged.token) {
      detailRows.push(`<tr><td>Token</td><td>${asText(merged.token)}</td></tr>`);
    }
    if (merged.units) {
      detailRows.push(`<tr><td>Units</td><td>${asText(merged.units)} kWh</td></tr>`);
    }
    if (merged.band) {
      detailRows.push(`<tr><td>Band</td><td>${asText(merged.band)}</td></tr>`);
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bill Receipt</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background: #f8fafc;
          color: #1f2937;
          line-height: 1.6;
        }
        .receipt-container {
          max-width: 400px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 24px 20px;
          text-align: center;
        }
        .logo {
          width: 60px;
          height: 60px;
          margin: 0 auto 16px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
        }
        .title {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 8px;
        }
        .subtitle {
          font-size: 14px;
          opacity: 0.9;
          margin: 0;
        }
        .amount-section {
          padding: 24px 20px;
          text-align: center;
          background: #f8fafc;
        }
        .amount {
          font-size: 32px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 8px;
        }
        .status {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: ${statusStyle.color};
          background: ${statusStyle.backgroundColor};
        }
        .details {
          padding: 20px;
        }
        .details-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 16px;
          color: #374151;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
        }
        .details-table td {
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: top;
        }
        .details-table td:first-child {
          font-weight: 500;
          color: #6b7280;
          width: 40%;
        }
        .details-table td:last-child {
          color: #1f2937;
          word-break: break-all;
        }
        .footer {
          padding: 20px;
          background: #f8fafc;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer-text {
          font-size: 12px;
          color: #6b7280;
          margin: 0 0 8px;
        }
        .footer-date {
          font-size: 11px;
          color: #9ca3af;
          margin: 0;
        }
        .token-display {
          font-family: 'Courier New', monospace;
          font-size: 14px;
          background: #f3f4f6;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div class="logo">Z</div>
          <h1 class="title">${billType} Receipt</h1>
          <p class="subtitle">Transaction Details</p>
        </div>
        
        <div class="amount-section">
          <div class="amount">${asText(transaction.amount)}</div>
          <div class="status">${asText(transaction.status)}</div>
        </div>
        
        <div class="details">
          <h3 class="details-title">Transaction Details</h3>
          <table class="details-table">
            ${detailRows.join('')}
          </table>
        </div>
        
        <div class="footer">
          <p class="footer-text">Thank you for using ZeusODX</p>
          <p class="footer-date">Generated on ${currentDate}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const BillReceiptScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const transaction = useMemo(() => {
    try {
      return JSON.parse(decodeURIComponent(params.tx as string));
    } catch {
      return null;
    }
  }, [params.tx]);

  const raw = useMemo(() => {
    try {
      return JSON.parse(decodeURIComponent(params.raw as string));
    } catch {
      return null;
    }
  }, [params.raw]);

  const merged = useMemo(() => {
    if (!transaction?.details) return {};
    return { ...transaction.details };
  }, [transaction]);

  const statusStyle = useMemo(() => {
    return statusStyles(transaction?.status || '');
  }, [transaction?.status]);

  const billType = useMemo(() => {
    return transaction?.utilityType || transaction?.type || 'Bill';
  }, [transaction?.utilityType, transaction?.type]);

  const handleGoBack = () => {
    router.back();
  };

  const handleShare = async () => {
    try {
      const message = `${billType} Receipt\n\nAmount: ${transaction?.amount}\nStatus: ${transaction?.status}\nDate: ${transaction?.date}`;
      await Share.share({ message });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const htmlContent = generateBillReceiptHTML(
        transaction, 
        merged, 
        statusStyle, 
        billType
      );

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
          dialogTitle: 'Share Bill Receipt',
        });
      } else {
        Alert.alert('Sharing not available', 'PDF generated but sharing is not available on this device.');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      Alert.alert('Export Failed', 'Failed to generate PDF. Please try again.');
    }
  };

  const copyToken = () => {
    if (merged.token) {
      Clipboard.setString(merged.token);
      Alert.alert('Copied', 'Token copied to clipboard');
    }
  };

  const copyOrderId = () => {
    if (merged.orderId) {
      Clipboard.setString(merged.orderId);
      Alert.alert('Copied', 'Order ID copied to clipboard');
    }
  };

  if (!transaction) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
              <Image source={backIcon} style={styles.backIcon} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Bill Receipt</Text>
            <View style={styles.headerRight} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Invalid receipt data</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
              <Image source={backIcon} style={styles.backIcon} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{billType} Receipt</Text>
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Text style={styles.shareText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Amount Display */}
          <View style={styles.amountSection}>
            <Text style={styles.amountText}>{transaction.amount}</Text>
            <View style={[styles.statusPill, { backgroundColor: statusStyle.backgroundColor }]}>
              <Text style={[styles.statusText, { color: statusStyle.color }]}>
                {transaction.status}
              </Text>
            </View>
          </View>

          {/* Details Card */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Transaction Details</Text>
            
            <Row label="Type" value={asText(transaction.type)} />
            <Row label="Date" value={asText(transaction.date)} />
            <Row label="Amount" value={asText(transaction.amount)} />
            
            {merged.orderId && (
              <Row 
                label="Order ID" 
                value={asText(merged.orderId)}
                rightAdornment={
                  <TouchableOpacity onPress={copyOrderId} style={styles.copyButton}>
                    <Text style={styles.copyText}>Copy</Text>
                  </TouchableOpacity>
                }
              />
            )}
            
            {merged.requestId && (
              <Row label="Request ID" value={asText(merged.requestId)} />
            )}
            
            {merged.productName && (
              <Row label="Product" value={asText(merged.productName)} />
            )}
            
            {merged.network && (
              <Row label="Provider" value={asText(merged.network)} />
            )}
            
            {merged.customerInfo && (
              <Row label="Customer Info" value={asText(merged.customerInfo)} />
            )}

            {/* Electricity specific fields */}
            {billType === 'Electricity' && (
              <>
                {merged.customerName && (
                  <Row label="Customer Name" value={asText(merged.customerName)} />
                )}
                {merged.customerAddress && (
                  <Row label="Address" value={asText(merged.customerAddress)} />
                )}
                {merged.token && (
                  <Row 
                    label="Token" 
                    value={formatToken(merged.token)}
                    rightAdornment={
                      <TouchableOpacity onPress={copyToken} style={styles.copyButton}>
                        <Text style={styles.copyText}>Copy</Text>
                      </TouchableOpacity>
                    }
                  />
                )}
                {merged.units && (
                  <Row label="Units" value={formatUnits(merged.units)} />
                )}
                {merged.band && (
                  <Row label="Band" value={asText(merged.band)} />
                )}
              </>
            )}
          </View>

          {/* Footer Message */}
          <View style={styles.footerMessage}>
            <Text style={styles.footerText}>
              Thank you for using ZeusODX. Keep this receipt for your records.
            </Text>
          </View>
        </ScrollView>

        {/* CTA Row */}
        <View style={styles.ctaRow}>
          <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
            <Text style={styles.exportButtonText}>Export PDF</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

// Row component for consistent detail display
const Row = ({ 
  label, 
  value, 
  rightAdornment 
}: { 
  label: string; 
  value: string; 
  rightAdornment?: React.ReactNode;
}) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <View style={styles.rowValueContainer}>
      <Text style={styles.rowValue}>{value}</Text>
      {rightAdornment}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  
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
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: { width: 40 },
  shareButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  shareText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  
  amountSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  amountText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  statusPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  detailsCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.secondary,
    flex: 1,
  },
  rowValueContainer: {
    flex: 2,
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  rowValue: {
    fontSize: 14,
    color: Colors.text.primary,
    textAlign: 'right',
    flex: 1,
  },
  copyButton: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  copyText: {
    fontSize: 12,
    color: Colors.surface,
    fontWeight: '500',
  },
  
  footerMessage: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  ctaRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  exportButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface,
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

export default BillReceiptScreen;
