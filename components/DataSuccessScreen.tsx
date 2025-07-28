import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, SafeAreaView } from 'react-native';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

interface DataPurchaseSuccessScreenProps {
  amount: string;
  currency: string;
  dataBundle: string;
  phoneNumber: string;
  networkProvider: string;
  status: string;
  date: string;
  transactionId: string;
  onShareAsImage: () => void;
  onDownload: () => void;
  onCopyTransactionId: () => void;
  visible?: boolean;
}

export default function DataPurchaseSuccessScreen({ 
  amount,
  currency,
  dataBundle,
  phoneNumber,
  networkProvider,
  status,
  date,
  transactionId,
  onShareAsImage,
  onDownload,
  onCopyTransactionId,
  visible = true
}: DataPurchaseSuccessScreenProps) {
  
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent={true}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Data</Text>
          </View>

          {/* Main content */}
          <View style={styles.mainContent}>
            {/* Amount Display */}
            <View style={styles.amountContainer}>
              <Text style={styles.amountText}>{amount} {currency}</Text>
              <View style={styles.successIndicator}>
                <View style={styles.successDot} />
                <Text style={styles.successText}>Successful</Text>
              </View>
            </View>

            {/* Transaction Details Card */}
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Transaction</Text>
                <Text style={styles.detailValue}>Data</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Data Bundle</Text>
                <Text style={styles.detailValue}>{dataBundle}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone number</Text>
                <Text style={styles.detailValue}>{phoneNumber}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Network Provider</Text>
                <Text style={styles.detailValue}>{networkProvider}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailValue}>{status}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={styles.detailValue}>{amount} {currency}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{date}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Transaction ID</Text>
                <View style={styles.transactionIdContainer}>
                  <Text style={styles.transactionIdText}>{transactionId}</Text>
                  <TouchableOpacity onPress={onCopyTransactionId} style={styles.copyButton}>
                    <Image 
                      source={require('../components/icons/copy-icon.png')}
                      style={styles.copyIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.shareButton} onPress={onShareAsImage}>
              <Text style={styles.shareButtonText}>Share as image</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.downloadButton} onPress={onDownload}>
              <Text style={styles.downloadButtonText}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: Layout.spacing.xl,
    paddingBottom: Layout.spacing.lg,
  },
  headerTitle: {
    fontFamily: Typography.medium,
    fontSize: 18,
    color: Colors.primaryText,
  },
  mainContent: {
    flex: 1,
    paddingTop: Layout.spacing.md,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xxl,
  },
  amountText: {
    fontFamily: Typography.bold,
    fontSize: 32,
    lineHeight: 38,
    color: Colors.primaryText,
    marginBottom: Layout.spacing.sm,
  },
  successIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981', // Green color
    marginRight: Layout.spacing.xs,
  },
  successText: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: '#10B981', // Green color
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.xxl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: Colors.text.secondary,
    flex: 1,
  },
  detailValue: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: Colors.primaryText,
    textAlign: 'right',
    flex: 1,
  },
  transactionIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  transactionIdText: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: Colors.primaryText,
    marginRight: Layout.spacing.xs,
  },
  copyButton: {
    padding: Layout.spacing.xs,
  },
  copyIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.text.secondary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    paddingBottom: Layout.spacing.xl,
  },
  shareButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
  },
  shareButtonText: {
    fontFamily: Typography.medium,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  downloadButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
  },
  downloadButtonText: {
    fontFamily: Typography.medium,
    fontSize: 16,
    color: Colors.surface,
    fontWeight: '600',
  },
});