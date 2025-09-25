import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Image
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { Typography } from '../constants/Typography';
import { useTokens } from '../hooks/useTokens';

interface SwapPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fromAmount: string;
  fromToken: string;
  toAmount: string;
  toToken: string;
  rate: string;
}

export default function SwapPreviewModal({
  visible,
  onClose,
  onConfirm,
  fromAmount,
  fromToken,
  toAmount,
  toToken,
  rate,
}: SwapPreviewModalProps) {
  const [countdown, setCountdown] = useState(10);
  const { tokens } = useTokens();

  // Get icon dynamically
  const getIcon = (symbol: string) => {
    const token = tokens.find(t => t.symbol === symbol);
    return token?.icon;
  };

  // Countdown
  useEffect(() => {
    if (!visible) return;
    setCountdown(10);
    const timer = setInterval(() => setCountdown(prev => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>You're swapping</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* FROM BOX */}
          <View style={styles.assetBox}>
            <Text style={styles.assetAmount}>{fromAmount} {fromToken}</Text>
            <Image source={getIcon(fromToken)} style={styles.assetIcon} />
          </View>

          <Text style={styles.arrow}>↓</Text>

          {/* TO BOX */}
          <View style={styles.assetBox}>
            <Text style={styles.assetAmount}>{toAmount} {toToken}</Text>
            <Image source={getIcon(toToken)} style={styles.assetIcon} />
          </View>

          {/* Rate */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rate</Text>
            <Text style={styles.detailValue}>{rate}</Text>
          </View>

          {/* Countdown */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quote expires in</Text>
            <Text style={[styles.detailValue, countdown <= 5 && { color: '#FF3B30' }]}>
              {countdown}s
            </Text>
          </View>

          {/* Swap Button */}
          <TouchableOpacity 
            style={[styles.confirmButton, countdown === 0 && styles.disabledButton]} 
            onPress={onConfirm}
            disabled={countdown === 0}
          >
            <Text style={styles.confirmButtonText}>
              {countdown > 0 ? 'Swap' : 'Expired'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: Colors.surface, borderRadius: Layout.borderRadius.lg, padding: Layout.spacing.lg, width: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Layout.spacing.lg },
  title: { fontFamily: Typography.medium, fontSize: 18, color: Colors.text.primary },
  closeText: { fontSize: 20, color: Colors.text.secondary },
  assetBox: { backgroundColor: '#F5F5F5', borderRadius: Layout.borderRadius.md, padding: Layout.spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: Layout.spacing.sm },
  assetAmount: { fontFamily: Typography.medium, fontSize: 18, color: Colors.text.primary },
  assetIcon: { width: 28, height: 28, resizeMode: 'contain' },
  arrow: { textAlign: 'center', fontSize: 22, color: Colors.text.secondary, marginVertical: Layout.spacing.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: Layout.spacing.xs },
  detailLabel: { fontFamily: Typography.regular, fontSize: 14, color: Colors.text.secondary },
  detailValue: { fontFamily: Typography.medium, fontSize: 14, color: Colors.text.primary },
  confirmButton: { backgroundColor: Colors.primary, borderRadius: Layout.borderRadius.lg, paddingVertical: Layout.spacing.md, marginTop: Layout.spacing.lg, alignItems: 'center' },
  disabledButton: { backgroundColor: '#ccc' },
  confirmButtonText: { color: Colors.surface, fontFamily: Typography.medium, fontSize: 16 },
});