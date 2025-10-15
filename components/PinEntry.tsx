import React, { useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Typography } from '../constants/Typography';
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
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const pinInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setPin('');
      setError('');
      // Focus input after modal animation
      setTimeout(() => pinInputRef.current?.focus(), 300);
    }
  }, [visible]);

  const handlePinChange = (value: string) => {
    // Only allow numbers and max 6 digits
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

  // Create individual input boxes for PIN (masked display)
  const renderPinBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      boxes.push(
        <View
          key={i}
          style={[
            styles.pinBox,
            i < pin.length && styles.pinBoxFilled
          ]}
        >
          <Text style={[
            styles.pinText,
            i < pin.length && styles.pinTextFilled
          ]}>
            {i < pin.length ? '●' : ''}
          </Text>
        </View>
      );
    }
    return boxes;
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      type="center"
      disableBackdropPress={loading}
    >
      <View style={styles.content}>
        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          disabled={loading}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {/* PIN Input Section */}
        <View style={styles.inputSection}>
          {/* Hidden TextInput for keyboard input */}
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
          
          {/* PIN Boxes Display */}
          <View style={styles.pinContainer}>
            {renderPinBoxes()}
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
          
          {/* Helper text */}
          <Text style={styles.helperText}>
            Enter your secure 6-digit PIN
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isValid || loading) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!isValid || loading}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Verifying...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
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
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    color: '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6B7280',
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
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinBoxFilled: {
    borderColor: '#35297F',
    backgroundColor: '#F8F7FF',
  },
  pinText: {
    fontSize: 16,
    fontFamily: Typography.medium || 'System',
    fontWeight: '600',
    color: '#9CA3AF',
  },
  pinTextFilled: {
    color: '#35297F',
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
    color: '#9CA3AF',
    fontFamily: Typography.regular || 'System',
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 16,
    lineHeight: 14,
  },
  submitButton: {
    backgroundColor: '#35297F',
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default PinEntryModal;