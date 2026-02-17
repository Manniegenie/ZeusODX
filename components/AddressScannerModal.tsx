import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

/**
 * Extracts wallet address from QR/barcode data.
 * Handles formats: "ethereum:0x...", "bitcoin:bc1...", "bitcoin:1...", "solana:...", plain "0x...", "bc1...", etc.
 */
export function parseAddressFromScanData(data: string): string {
  const trimmed = (data || '').trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('ethereum:') || lower.startsWith('eth:')) {
    return trimmed.split(':')[1]?.trim() || trimmed;
  }
  if (lower.startsWith('bitcoin:') || lower.startsWith('btc:')) {
    const after = trimmed.split(':')[1]?.trim();
    return after || trimmed;
  }
  if (lower.startsWith('solana:') || lower.startsWith('sol:')) {
    return trimmed.split(':')[1]?.trim() || trimmed;
  }
  if (lower.startsWith('tron:') || lower.startsWith('trx:')) {
    return trimmed.split(':')[1]?.trim() || trimmed;
  }
  if (lower.startsWith('bnb:') || lower.startsWith('bsc:')) {
    return trimmed.split(':')[1]?.trim() || trimmed;
  }
  return trimmed;
}

interface AddressScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (address: string) => void;
}

export default function AddressScannerModal({
  visible,
  onClose,
  onScan,
}: AddressScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const scannedRef = useRef(false);

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scannedRef.current || !data?.trim()) return;
      scannedRef.current = true;
      setScanning(false);
      const address = parseAddressFromScanData(data);
      if (address) {
        onScan(address);
        onClose();
      }
      setTimeout(() => { scannedRef.current = false; }, 1500);
    },
    [onScan, onClose]
  );

  const handleOpenScanner = useCallback(async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result?.granted) {
        Alert.alert(
          'Camera access',
          'Camera permission is needed to scan wallet address QR codes.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setScanning(true);
    scannedRef.current = false;
  }, [permission, requestPermission]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={handleOpenScanner}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Scan wallet address</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={12}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.cameraWrap}>
            {!permission?.granted ? (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Camera permission required</Text>
                <TouchableOpacity style={styles.allowButton} onPress={requestPermission}>
                  <Text style={styles.allowButtonText}>Allow camera</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['qr', 'aztec', 'ean13', 'ean8', 'pdf417'],
                }}
                onBarcodeScanned={scanning ? handleBarcodeScanned : undefined}
              />
            )}
          </View>
          <Text style={styles.hint}>Point your camera at a wallet address QR code</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: Colors.surface || '#fff',
    borderRadius: 16,
    overflow: 'hidden',
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
  title: {
    fontFamily: Typography.medium,
    fontSize: 18,
    color: Colors.text?.primary || '#111827',
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 20,
    color: Colors.text?.secondary || '#6B7280',
  },
  cameraWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholderText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
  },
  allowButton: {
    backgroundColor: Colors.primary || '#35297F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  allowButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: Colors.text?.secondary || '#6B7280',
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
