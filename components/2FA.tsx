import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Image,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Typography } from '../constants/Typography';
import BaseModal from './ui/BaseModal';

// Import icons
// @ts-ignore
import copyIcon from './icons/copy-icon.png';

interface TwoFactorAuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
  loading?: boolean;
  title?: string;
  subtitle?: string;
}

const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({
  visible,
  onClose,
  onSubmit,
  loading = false,
  title = 'Two-Factor Authentication',
  subtitle = 'Please enter the 6-digit code from your authenticator app'
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const codeInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setCode('');
      setError('');
      // Focus input after modal animation
      setTimeout(() => codeInputRef.current?.focus(), 300);
    }
  }, [visible]);

  const handleCodeChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(numericValue);
    setError('');
    // Dismiss keyboard when 6 digits are entered
    if (numericValue.length === 6) {
      Keyboard.dismiss();
    }
  };

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (code.length === 6 && !loading) {
      handleSubmit();
    }
  }, [code]);

  const handlePasteFromClipboard = async () => {
    try {
      const content = await Clipboard.getStringAsync();
      const trimmed = content.trim();
      if (/^\d{6}$/.test(trimmed)) {
        setCode(trimmed);
        setError('');
      } else {
        Alert.alert('Invalid Code', 'Clipboard does not contain a valid 6-digit code.');
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to access clipboard.');
    }
  };

  const handleSubmit = () => {
    if (code.length !== 6) {
      setError('Authentication code must be exactly 6 digits');
      return;
    }
    onSubmit(code);
  };

  const isValid = code.length === 6;

  const renderCodeBoxes = () => {
    return Array.from({ length: 6 }).map((_, i) => (
      <View
        key={i}
        style={[styles.codeBox, i < code.length && styles.codeBoxFilled]}
      >
        <Text style={[styles.codeText, i < code.length && styles.codeTextFilled]}>
          {code[i] || ''}
        </Text>
      </View>
    ));
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

        {/* Input Section */}
        <View style={styles.inputSection}>
          <TextInput
            ref={codeInputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={handleCodeChange}
            keyboardType="numeric"
            maxLength={6}
            caretHidden
          />

          <View style={styles.codeContainer}>{renderCodeBoxes()}</View>

          {/* Paste Button */}
          <TouchableOpacity
            style={styles.pasteButton}
            onPress={handlePasteFromClipboard}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Image source={copyIcon} style={styles.copyIcon} resizeMode="contain" />
            <Text style={styles.pasteButtonText}>Paste</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.helperText}>
            Open your authenticator app to get the code
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, (!isValid || loading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isValid || loading}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Verifying...' : 'Verify'}
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
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  codeBox: {
    width: 38,
    height: 45,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeBoxFilled: {
    borderColor: '#35297F',
    backgroundColor: '#F8F7FF',
  },
  codeText: {
    fontSize: 16,
    fontFamily: Typography.medium || 'System',
    fontWeight: '600',
    color: '#9CA3AF',
  },
  codeTextFilled: {
    color: '#35297F',
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#35297F',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  copyIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  pasteButtonText: {
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 12,
    fontWeight: '500',
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

export default TwoFactorAuthModal;