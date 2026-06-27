import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Typography } from '../constants/Typography';
import { useTheme } from '../hooks/useTheme';
import type { AppColors } from '../hooks/useTheme';
import BaseModal from './ui/BaseModal';

interface PinEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
  loading?: boolean;
  title?: string;
  subtitle?: string;
}

const PinEntryModal: React.FC<PinEntryModalProps> = ({
  visible,
  onClose,
  onSubmit,
  loading = false,
  title = 'Enter Password PIN',
  subtitle = 'Please enter your 6-digit password PIN to continue'
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const pinInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setPin('');
      setError('');
      setTimeout(() => pinInputRef.current?.focus(), 300);
    }
  }, [visible]);

  const handlePinChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setPin(numericValue);
    setError('');
  };

  const handleSubmit = () => {
    if (pin.length !== 6) {
      setError('PIN must be exactly 6 digits');
      return;
    }
    onSubmit(pin);
  };

  const isValid = pin.length === 6;

  const renderPinBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      boxes.push(
        <View
          key={i}
          style={[styles.pinBox, i < pin.length && styles.pinBoxFilled]}
        >
          <Text style={[styles.pinText, i < pin.length && styles.pinTextFilled]}>
            {i < pin.length ? '●' : ''}
          </Text>
        </View>
      );
    }
    return boxes;
  };

  return (
    <BaseModal visible={visible} onClose={onClose} type="center" disableBackdropPress={loading}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          disabled={loading}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.inputSection}>
          <TextInput
            ref={pinInputRef}
            style={styles.hiddenInput}
            value={pin}
            onChangeText={handlePinChange}
            keyboardType="numeric"
            secureTextEntry={false}
            maxLength={6}
            autoFocus={false}
            caretHidden
          />

          <View style={styles.pinContainer}>{renderPinBoxes()}</View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Text style={styles.helperText}>Enter your secure 6-digit PIN</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (!isValid || loading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isValid || loading}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>{loading ? 'Verifying...' : 'Continue'}</Text>
        </TouchableOpacity>
      </View>
    </BaseModal>
  );
};

const makeStyles = (colors: AppColors) => StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: colors.card,
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
    backgroundColor: colors.border,
    zIndex: 1,
  },
  closeButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: Typography.regular || 'System',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  inputSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  pinBox: {
    width: 38,
    height: 45,
    borderRadius: 8,
    backgroundColor: colors.inputBg,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  pinText: {
    fontSize: 16,
    fontFamily: Typography.medium || 'System',
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pinTextFilled: {
    color: colors.primary,
  },
  errorText: {
    color: '#EF4444',
    fontFamily: Typography.regular || 'System',
    fontSize: 11,
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  helperText: {
    color: colors.textSecondary,
    fontFamily: Typography.regular || 'System',
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 16,
    lineHeight: 14,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  submitButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default PinEntryModal;
