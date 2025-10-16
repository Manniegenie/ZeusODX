// screens/history/TransactionReceiptScreen.tsx
import Clipboard from '@react-native-clipboard/clipboard';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useMemo } from 'react';
import {
  Alert,
  Image,
  Linking,
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
import { Layout } from '../../constants/Layout';
import { Typography } from '../../constants/Typography';

// Icons
import backIcon from '../../components/icons/backy.png';
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
  category?: 'token' | 'withdrawal';
  isNGNZWithdrawal?: boolean;
  hasReceiptData?: boolean;
  withdrawalReference?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  amountSentToBank?: number | string;
  withdrawalFee?: number | string;
  swapDetails?: {
    fromAmount?: string;
    fromCurrency?: string;
    toAmount?: string;
    toCurrency?: string;
    rate?: string | number;
    exchangeRate?: string | number;
  };
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
  | (Record<string, any> & { category?: 'token' | 'utility' | 'withdrawal' });

export type APITransaction = {
  id: string;
  type: string;
  status: string;
  amount: string;
  date: string;
  createdAt?: string;
  details?: APIDetail;
  isNGNZWithdrawal?: boolean;
  withdrawalReference?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  amountSentToBank?: number | string;
  withdrawalFee?: number | string;
  receiptData?: any;
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

const extractField = (
  transaction: any,
  details: any,
  rawTx: any,
  fieldNames: string[]
): any => {
  for (const field of fieldNames) {
    if (transaction?.[field] !== undefined && transaction?.[field] !== null && transaction?.[field] !== '') {
      return transaction[field];
    }
  }
  
  for (const field of fieldNames) {
    if (details?.[field] !== undefined && details?.[field] !== null && details?.[field] !== '') {
      return details[field];
    }
  }
  
  for (const field of fieldNames) {
    if (rawTx?.[field] !== undefined && rawTx?.[field] !== null && rawTx?.[field] !== '') {
      return rawTx[field];
    }
  }
  
  for (const field of fieldNames) {
    if (field.includes('.')) {
      const parts = field.split('.');
      let value = rawTx;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined || value === null) break;
      }
      if (value !== undefined && value !== null && value !== '') return value;
    }
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

const getExplorerUrl = (network?: string, hash?: string) => {
  if (!network || !hash) return null;
  
  const net = String(network).toUpperCase().trim();
  const explorerMap: Record<string, string> = {
    ETHEREUM: 'https://etherscan.io/tx/',
    ETH: 'https://etherscan.io/tx/',
    'ERC-20': 'https://etherscan.io/tx/',
    ERC20: 'https://etherscan.io/tx/',
    TRON: 'https://tronscan.org/#/transaction/',
    TRX: 'https://tronscan.org/#/transaction/',
    'TRC-20': 'https://tronscan.org/#/transaction/',
    TRC20: 'https://tronscan.org/#/transaction/',
    BSC: 'https://bscscan.com/tx/',
    BNB: 'https://bscscan.com/tx/',
    'BEP-20': 'https://bscscan.com/tx/',
    BEP20: 'https://bscscan.com/tx/',
    BINANCE: 'https://bscscan.com/tx/',
    'BINANCE SMART CHAIN': 'https://bscscan.com/tx/',
    POLYGON: 'https://polygonscan.com/tx/',
    MATIC: 'https://polygonscan.com/tx/',
    AVALANCHE: 'https://snowtrace.io/tx/',
    AVALANCHE_C: 'https://snowtrace.io/tx/',
    AVALANCHE_X: 'https://avascan.info/blockchain/x/tx/',
    AVALANCHE_P: 'https://avascan.info/blockchain/p/tx/',
    AVAX: 'https://snowtrace.io/tx/',
    BITCOIN: 'https://blockstream.info/tx/',
    BTC: 'https://blockstream.info/tx/',
    SOLANA: 'https://solscan.io/tx/',
    SOL: 'https://solscan.io/tx/',
  };
  
  const baseUrl = explorerMap[net];
  return baseUrl ? `${baseUrl}${hash}` : null;
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

const parseSwapFromNarration = (narr?: string) => {
  if (!narr) return null;
  const r =
    /(Swap|Swapped|Crypto Swap:)\s+([\d.,]+)\s+([A-Za-z]+)\s+(?:to|for)\s+([\d.,]+)\s+([A-Za-z]+)/i;
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

// ---------- PDF Generation ----------
const generateTransactionReceiptHTML = (
  transaction: APITransaction,
  merged: TokenDetails & UtilityDetails,
  statusStyle: any,
  category: 'token' | 'utility' | 'withdrawal',
  isNGNZWithdrawal: boolean,
  isSwap: boolean,
  swapInfo?: any,
  rawNetwork?: string
) => {
  const currentDate = new Date().toLocaleString();
  const logoBase64 = '';

  const detailRows: string[] = [];
  detailRows.push(`<tr><td>Type</td><td>${asText(transaction.type)}</td></tr>`);
  detailRows.push(`<tr><td>Date</td><td>${asText(transaction.date)}</td></tr>`);

  if (category === 'withdrawal' && isNGNZWithdrawal) {
    if (merged.withdrawalReference) {
      detailRows.push(`<tr><td>Reference</td><td>${asText(merged.withdrawalReference)}</td></tr>`);
    }
    detailRows.push(`<tr><td>Bank Name</td><td>${asText(merged.bankName)}</td></tr>`);
    detailRows.push(`<tr><td>Account Name</td><td>${asText(merged.accountName)}</td></tr>`);
    detailRows.push(`<tr><td>Account Number</td><td>${asText(merged.accountNumber)}</td></tr>`);
    detailRows.push(`<tr><td>Sent to Bank</td><td>${formatAmtSym(merged.amountSentToBank, 'NGN')}</td></tr>`);
    detailRows.push(`<tr><td>Withdrawal Fee</td><td>${formatAmtSym(merged.withdrawalFee, 'NGN')}</td></tr>`);
    detailRows.push(`<tr><td>Currency</td><td>${asText(merged.currency)}</td></tr>`);
    
  } else if (category === 'token') {
    if (isSwap) {
      detailRows.push(`<tr><td>From</td><td>${swapInfo ? formatAmtSym(swapInfo.fromAmount, swapInfo.fromCurrency || merged.currency) : merged.currency || '—'}</td></tr>`);
      detailRows.push(`<tr><td>To</td><td>${swapInfo ? formatAmtSym(swapInfo.toAmount, swapInfo.toCurrency) : '—'}</td></tr>`);
    } else {
      if (merged.transactionId) {
        detailRows.push(`<tr><td>Transaction ID</td><td>${asText(merged.transactionId)}</td></tr>`);
      }
      if (merged.address) {
        detailRows.push(`<tr><td>Address</td><td>${maskMiddle(asText(merged.address))}</td></tr>`);
      }
      if (merged.narration) {
        detailRows.push(`<tr><td>Narration</td><td>${asText(merged.narration)}</td></tr>`);
      }
    }
    
    detailRows.push(`<tr><td>Currency</td><td>${asText(merged.currency)}</td></tr>`);
    detailRows.push(`<tr><td>Network</td><td>${asText(merged.network)}</td></tr>`);
    
    if (merged.hash) {
      const explorerUrl = getExplorerUrl(rawNetwork, merged.hash as string);
      if (explorerUrl) {
        detailRows.push(`<tr><td>Hash</td><td><a href="${explorerUrl}" target="_blank" style="color: #35297F; text-decoration: underline;">${maskMiddle(asText(merged.hash))}</a></td></tr>`);
      } else {
        detailRows.push(`<tr><td>Hash</td><td>${maskMiddle(asText(merged.hash))}</td></tr>`);
      }
    }
    if (merged.fee !== undefined && merged.fee !== null) {
      detailRows.push(`<tr><td>Fee</td><td>${asText(merged.fee)}</td></tr>`);
    }
    
  } else {
    detailRows.push(`<tr><td>Order ID</td><td>${asText(merged.orderId)}</td></tr>`);
    detailRows.push(`<tr><td>Product</td><td>${asText(merged.productName)}</td></tr>`);
    detailRows.push(`<tr><td>Quantity</td><td>${asText(merged.quantity)}</td></tr>`);
    detailRows.push(`<tr><td>Network</td><td>${asText(merged.network)}</td></tr>`);
    detailRows.push(`<tr><td>Customer</td><td>${asText(merged.customerInfo)}</td></tr>`);
    detailRows.push(`<tr><td>Bill Type</td><td>${asText(merged.billType)}</td></tr>`);
    detailRows.push(`<tr><td>Pay Currency</td><td>${asText(merged.paymentCurrency)}</td></tr>`);
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Transaction Receipt</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: A4; margin: 0; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background: #F3F0FF;
                color: #111827;
                line-height: 1.5;
                -webkit-font-smoothing: antialiased;
                font-size: 21px;
                width: 100%;
                margin: 0;
                padding: 0;
            }
            .container { width: 100%; margin: 0; background: #F3F0FF; min-height: 100vh; }
            .header { background: #F3F0FF; padding: 24px 36px; display: flex; align-items: center; justify-content: center; }
            .header-logo { width: 150px; height: 66px; object-fit: contain; }
            .content { padding: 0 36px 48px 36px; }
            .amount-section { text-align: center; margin: 30px 0 9px 0; }
            .amount-text { font-size: 42px; font-weight: bold; color: #111827; }
            .status-container { text-align: center; margin-bottom: 24px; }
            .status-pill {
                display: inline-block;
                padding: 9px 15px;
                border-radius: 999px;
                border: 1px solid ${statusStyle.border};
                background-color: ${statusStyle.bg};
                color: ${statusStyle.text};
                font-size: 18px;
                font-weight: 600;
            }
            .details-card {
                width: 100%;
                background: #F8F9FA;
                border-radius: 12px;
                padding: 30px 24px;
                border: 1px solid #E5E7EB;
                margin-bottom: 30px;
            }
            .details-table { width: 100%; border-collapse: collapse; }
            .details-table tr { border-bottom: none; }
            .details-table td { padding: 18px 0; vertical-align: center; border-bottom: none; }
            .details-table td:first-child {
                width: 195px;
                flex-shrink: 0;
                color: #6B7280;
                font-size: 21px;
                font-weight: normal;
            }
            .details-table td:last-child {
                color: #111827;
                font-size: 21px;
                font-weight: 500;
                text-align: right;
                word-break: break-word;
            }
            .footer-message { width: 100%; margin-bottom: 30px; padding: 0 36px; }
            .footer-text { font-size: 19px; color: #6B7280; line-height: 1.5; margin: 0; text-align: left; }
            .generation-footer {
                text-align: center;
                padding: 30px 36px;
                color: #9CA3AF;
                font-size: 18px;
                border-top: 1px solid #E5E7EB;
                margin-top: 30px;
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
            <div class="content">
                <div class="amount-section">
                    <div class="amount-text">${transaction.amount}</div>
                </div>
                <div class="status-container">
                    <span class="status-pill">${transaction.status}</span>
                </div>
                <div class="details-card">
                    <table class="details-table">
                        ${detailRows.join('')}
                    </table>
                </div>
            </div>
            <div class="footer-message">
                <p class="footer-text">Thank you for choosing ZeusODX.</p>
            </div>
            <div class="generation-footer">
                Generated on: ${currentDate}
            </div>
        </div>
    </body>
    </html>
  `;
};

// ---------- screen ----------
export default function TransactionReceiptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const parsedTx = safeParseParam(params.tx) as APITransaction | undefined;
  const rawTx = safeParseParam(params.raw) as any | undefined;
  const transaction = parsedTx;

  useEffect(() => {
    if (transaction) {
      console.log('📄 TransactionReceipt received:', {
        isNGNZWithdrawal: transaction.isNGNZWithdrawal,
        type: transaction.type,
        topLevel: {
          withdrawalReference: transaction.withdrawalReference,
          bankName: transaction.bankName,
          accountNumber: transaction.accountNumber,
        },
        details: transaction.details,
        fullTransaction: JSON.stringify(transaction, null, 2)
      });
    }
  }, [transaction]);

  const isNGNZWithdrawal = useMemo(() => {
    return transaction?.isNGNZWithdrawal || 
           transaction?.details?.isNGNZWithdrawal ||
           (transaction?.details?.currency === 'NGNZ' && 
            transaction?.type?.toLowerCase().includes('withdrawal'));
  }, [transaction]);

  const cat: 'token' | 'utility' | 'withdrawal' = useMemo(() => {
    if (isNGNZWithdrawal) return 'withdrawal';
    
    const c = transaction?.details?.category;
    if (c === 'token' || c === 'utility' || c === 'withdrawal') return c;
    const d = transaction?.details || {};
    if ('transactionId' in d || 'currency' in d || 'hash' in d || 'address' in d)
      return 'token';
    if ('orderId' in d || 'productName' in d || 'billType' in d || 'customerInfo' in d)
      return 'utility';
    const t = (transaction?.type || '').toLowerCase();
    return ['airtime', 'data', 'electricity', 'cable tv', 'internet', 'betting', 'education', 'other'].includes(t)
      ? 'utility'
      : 'token';
  }, [transaction, isNGNZWithdrawal]);

  const isSwap = /swap/i.test(transaction?.type || '');
  const s = statusStyles(transaction?.status || '');

  const handleCopy = (label: string, value?: string) => {
    if (!value) return;
    try {
      Clipboard.setString(value);
      Alert.alert('Copied!', `${label} copied to clipboard`);
    } catch {
      Alert.alert('Copy failed', `Unable to copy ${label.toLowerCase()}`);
    }
  };

  const handleOpenHash = async (network?: string, hash?: string) => {
    if (!network || !hash) return;
    
    const explorerUrl = getExplorerUrl(network, hash);
    if (!explorerUrl) {
      Alert.alert(
        'No Explorer Available', 
        `No blockchain explorer available for network: "${network}".`
      );
      return;
    }

    try {
      const supported = await Linking.canOpenURL(explorerUrl);
      if (supported) {
        await Linking.openURL(explorerUrl);
      } else {
        Alert.alert('Cannot Open', 'Unable to open blockchain explorer');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open blockchain explorer');
      console.error('Failed to open URL:', error);
    }
  };

  const d = (transaction?.details || {}) as TokenDetails & UtilityDetails;
  
  const merged: TokenDetails & UtilityDetails = {
    ...d,
    transactionId: extractField(transaction, d, rawTx, ['transactionId', 'txId', 'externalId', 'reference', 'id', '_id']),
    currency: extractField(transaction, d, rawTx, ['currency', 'symbol', 'asset']) as string || '',
    network: prettyNetwork(extractField(transaction, d, rawTx, ['network', 'chain', 'blockchain']) as string),
    address: extractField(transaction, d, rawTx, ['address', 'walletAddress', 'to', 'toAddress', 'receivingAddress']),
    hash: extractField(transaction, d, rawTx, ['hash', 'txHash', 'transactionHash']),
    fee: extractField(transaction, d, rawTx, ['fee', 'networkFee', 'gasFee', 'txFee']),
    narration: extractField(transaction, d, rawTx, ['narration', 'note', 'description', 'memo', 'reason']),
    
    orderId: extractField(transaction, d, rawTx, ['orderId', 'order_id']),
    requestId: extractField(transaction, d, rawTx, ['requestId', 'request_id']),
    productName: extractField(transaction, d, rawTx, ['productName', 'product']),
    quantity: extractField(transaction, d, rawTx, ['quantity', 'units']),
    customerInfo: extractField(transaction, d, rawTx, ['customerInfo', 'customerPhone', 'phone', 'meterNo', 'account']),
    billType: extractField(transaction, d, rawTx, ['billType', 'type']),
    paymentCurrency: extractField(transaction, d, rawTx, ['paymentCurrency']),
    
    isNGNZWithdrawal,
    withdrawalReference: extractField(transaction, d, rawTx, [
      'withdrawalReference', 
      'reference', 
      'ref',
      'txRef',
      'transactionReference',
      'receiptData.reference'
    ]),
    bankName: extractField(transaction, d, rawTx, [
      'bankName', 
      'bank',
      'bankDetails.name',
      'destinationBank',
      'beneficiaryBank',
      'receiptData.bankName'
    ]),
    accountName: extractField(transaction, d, rawTx, [
      'accountName',
      'accountHolderName',
      'beneficiaryName',
      'recipientName',
      'receiptData.accountName'
    ]),
    accountNumber: extractField(transaction, d, rawTx, [
      'accountNumber',
      'accountNo',
      'beneficiaryAccount',
      'account',
      'receiptData.accountNumber'
    ]),
    amountSentToBank: extractField(transaction, d, rawTx, [
      'amountSentToBank',
      'bankAmount',
      'netAmount',
      'settlementAmount',
      'receiptData.amountSentToBank'
    ]),
    withdrawalFee: extractField(transaction, d, rawTx, [
      'withdrawalFee',
      'fee',
      'charges',
      'transactionFee',
      'receiptData.withdrawalFee'
    ]),
    
    swapDetails: d.swapDetails,
  };

  useEffect(() => {
    if (isNGNZWithdrawal) {
      console.log('💳 Extracted NGNZ Withdrawal Details:', {
        withdrawalReference: merged.withdrawalReference,
        bankName: merged.bankName,
        accountName: merged.accountName,
        accountNumber: merged.accountNumber,
        amountSentToBank: merged.amountSentToBank,
        withdrawalFee: merged.withdrawalFee,
      });
    }
  }, [isNGNZWithdrawal, merged]);

  const rawNetwork = extractField(transaction, d, rawTx, ['network', 'chain', 'blockchain']) as string;

  const swapInfo = useMemo(() => {
    if (!isSwap) return null;
    
    const swapDetails = (transaction?.details as any)?.swapDetails;
    if (swapDetails && swapDetails.fromAmount && swapDetails.toCurrency) {
      return {
        fromAmount: parseFloat(swapDetails.fromAmount),
        fromCurrency: swapDetails.fromCurrency,
        toAmount: parseFloat(swapDetails.toAmount),
        toCurrency: swapDetails.toCurrency,
      };
    }
    
    const viaNarr = parseSwapFromNarration(String(merged.narration || ''));
    if (viaNarr) return viaNarr;
    
    const fromCurrency = (merged.currency || '').toString().toUpperCase();
    const toCurrency = extractField(transaction, d, rawTx, ['toCurrency', 'toSymbol', 'toAsset'])?.toString().toUpperCase();
    const toAmount = extractField(transaction, d, rawTx, ['toAmount', 'amountOut', 'received']);
    return (fromCurrency || toCurrency)
      ? { fromAmount: undefined, fromCurrency, toAmount, toCurrency }
      : null;
  }, [isSwap, transaction?.details, merged.narration, merged.currency, d, rawTx]);

  const onShare = async () => {
    try {
      if (!transaction) {
        Alert.alert('Error', 'No transaction data to share');
        return;
      }

      const htmlContent = generateTransactionReceiptHTML(
        transaction, 
        merged, 
        s, 
        cat, 
        isNGNZWithdrawal, 
        isSwap, 
        swapInfo,
        rawNetwork
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
          dialogTitle: 'Share Transaction Receipt',
          UTI: 'com.adobe.pdf',
        });
        return;
      }

      await Share.share({
        title: 'Transaction Receipt',
        message: 'Transaction receipt attached.',
        url: Platform.OS === 'ios' ? uri : `file://${uri}`,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Share failed', 'Could not generate PDF receipt. Please try again.');
    }
  };

  if (!transaction) {
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
          <Text style={styles.emptyTitle}>No transaction selected</Text>
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
            {transaction.amount}
          </Text>
        </View>

        <View style={styles.centeredStatus}>
          <View style={[styles.statusPill, { backgroundColor: s.bg, borderColor: s.border }]}>
            <Text style={[styles.statusPillText, { color: s.text }]} numberOfLines={1}>
              {transaction.status}
            </Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Row label="Type" value={asText(transaction.type)} />
          <Row label="Date" value={asText(transaction.date)} />

          {cat === 'withdrawal' && isNGNZWithdrawal ? (
            <>
              <Row
                label="Reference"
                value={asText(merged.withdrawalReference)}
                copyableValue={merged.withdrawalReference as string}
                onCopy={(v) => handleCopy('Reference', v)}
              />
              <Row label="Bank Name" value={asText(merged.bankName)} />
              <Row label="Account Name" value={asText(merged.accountName)} />
              <Row
                label="Account Number"
                value={asText(merged.accountNumber)}
                copyableValue={merged.accountNumber as string}
                onCopy={(v) => handleCopy('Account Number', v)}
              />
              <Row 
                label="Sent to Bank" 
                value={formatAmtSym(merged.amountSentToBank, 'NGN')} 
              />
              <Row 
                label="Withdrawal Fee" 
                value={formatAmtSym(merged.withdrawalFee, 'NGN')} 
              />
              <Row label="Currency" value={asText(merged.currency)} />
            </>
          ) : cat === 'token' ? (
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
                  isHashLink={true}
                  onHashPress={() => handleOpenHash(rawNetwork, merged.hash as string)}
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