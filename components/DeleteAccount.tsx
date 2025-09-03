// components/DeleteAccountModal.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Typography } from '../constants/Typography';
import { useRouter } from 'expo-router';
import { useAccountDeletion } from '../hooks/usedeleteAccount';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const DeleteAccountModal: React.FC<Props> = ({ visible, onClose }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const {
    initiate,
    loading,
    scheduledDeletionDate,
    hasFunds,
    fundDetails,
    userMessage,
    reset,
  } = useAccountDeletion({
    auto: false,
  });

  useEffect(() => {
    if (visible) {
      reset();
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleBackdropPress = () => {
    if (!loading) onClose();
  };

  const handleDelete = async () => {
    await initiate();
  };

  const handleWallet = () => {
    onClose?.();
    router.push('/user/wallet');
  };

  // Short, user-friendly copy (as requested)
  const subtitle =
    'You can’t delete if you have a balance. Move funds out first. Deletion happens after 30 days. You can login before 30 days to reverse this process';

  const scheduledISO = scheduledDeletionDate
    ? new Date(scheduledDeletionDate).toLocaleString()
    : null;

  const renderFunds = () => {
    if (!hasFunds) return null;
    const entries = Object.entries(fundDetails || {});
    if (!entries.length) return null;

    return (
      <View style={styles.fundsCard}>
        <Text style={styles.fundsTitle}>Funds present</Text>
        <ScrollView style={{ maxHeight: 120 }}>
          {entries.map(([k, v]) => (
            <View key={k} style={styles.fundRow}>
              <Text style={styles.fundKey}>{k}</Text>
              <Text style={styles.fundVal}>{String(v)}</Text>
            </View>
          ))}
        </ScrollView>
        <Text style={styles.fundsHint}>Withdraw all balances before deleting.</Text>
      </View>
    );
  };

  const renderBody = () => {
    // Success state
    if (scheduledISO) {
      return (
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.successTitle}>Deletion Scheduled</Text>
          <Text style={styles.successText}>
            Your account is scheduled for deletion.
          </Text>
          <Text style={styles.successWhen}>When: {scheduledISO}</Text>

          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Delete Account</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {userMessage ? <Text style={styles.errorText}>{userMessage}</Text> : null}
        {renderFunds()}

        <View style={styles.rowButtons}>
          <TouchableOpacity
            style={[styles.secondaryBtn, styles.btnHalf]}
            onPress={handleWallet}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dangerBtn, styles.btnHalf, loading && styles.btnDisabled]}
            onPress={handleDelete}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.dangerBtnText}>Delete Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
              ]}
            >
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                disabled={loading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              {renderBody()}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const PRIMARY = '#35297F';
const TEXT_DARK = '#111827';
const TEXT_MUTED = '#6B7280';
const SURFACE = '#FFFFFF';
const BORDER = '#E5E7EB';
const OVERLAY = 'rgba(0,0,0,0.5)';
const DANGER = '#EF4444';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    width: 320,
    alignSelf: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    zIndex: 1,
  },
  closeButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  title: {
    color: TEXT_DARK,
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: TEXT_MUTED,
    fontFamily: Typography.regular || 'System',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btnHalf: {
    flex: 1,
  },
  secondaryBtn: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: PRIMARY,
    fontFamily: Typography.medium || 'System',
    fontSize: 15,
    fontWeight: '600',
  },
  dangerBtn: {
    backgroundColor: DANGER,
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerBtnText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 15,
    fontWeight: '600',
  },
  btnDisabled: { opacity: 0.7 },
  errorText: {
    color: DANGER,
    fontFamily: Typography.regular || 'System',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  fundsCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  fundsTitle: {
    fontFamily: Typography.medium || 'System',
    fontSize: 13,
    color: TEXT_DARK,
    marginBottom: 8,
    fontWeight: '600',
  },
  fundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  fundKey: {
    fontFamily: Typography.regular || 'System',
    fontSize: 12,
    color: TEXT_MUTED,
  },
  fundVal: {
    fontFamily: Typography.medium || 'System',
    fontSize: 12,
    color: TEXT_DARK,
  },
  fundsHint: {
    marginTop: 8,
    fontFamily: Typography.regular || 'System',
    fontSize: 11,
    color: TEXT_MUTED,
    fontStyle: 'italic',
  },
  successTitle: {
    color: TEXT_DARK,
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  successText: {
    color: TEXT_MUTED,
    fontFamily: Typography.regular || 'System',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 6,
  },
  successWhen: {
    color: PRIMARY,
    fontFamily: Typography.medium || 'System',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default DeleteAccountModal;
