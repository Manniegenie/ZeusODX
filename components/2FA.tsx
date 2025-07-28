import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '../constants/Typography';

const MODAL_HEIGHT = 340;

const TwoFactorAuthModal = ({
  visible,
  onClose,
  onSubmit,
  loading = false,
  title = 'Two-Factor Authentication',
  subtitle = 'Please enter the 6-digit code from your authenticator app'
}) => {
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const codeInputRef = useRef(null);

  // Slide animation
  useEffect(() => {
    if (visible) {
      setCode('');
      setError('');
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start(() => {
        // Focus input after animation
        setTimeout(() => codeInputRef.current?.focus(), 100);
      });
    } else {
      Animated.timing(slideAnim, {
        toValue: MODAL_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleCodeChange = (value) => {
    // Only allow numbers and max 6 digits
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(numericValue);
    setError('');
  };

  const handleSubmit = () => {
    if (code.length !== 6) {
      setError('Authentication code must be exactly 6 digits');
      return;
    }
    onSubmit(code);
  };

  const handleBackdropPress = () => {
    if (!loading) {
      onClose();
    }
  };

  const isValid = code.length === 6;

  // Create individual input boxes for 2FA code
  const renderCodeBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      boxes.push(
        <View
          key={i}
          style={[
            styles.codeBox,
            i < code.length && styles.codeBoxFilled
          ]}
        >
          <Text style={[
            styles.codeText,
            i < code.length && styles.codeTextFilled
          ]}>
            {code[i] || ''}
          </Text>
        </View>
      );
    }
    return boxes;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalWrapper}>
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                {/* Handle Bar */}
                <View style={styles.handleBar} />

                {/* Title Section */}
                <View style={styles.titleSection}>
                  <Text style={styles.title}>{title}</Text>
                  <Text style={styles.subtitle}>{subtitle}</Text>
                </View>

                {/* 2FA Code Input Section */}
                <View style={styles.inputSection}>
                  {/* Hidden TextInput for keyboard input */}
                  <TextInput
                    ref={codeInputRef}
                    style={styles.hiddenInput}
                    value={code}
                    onChangeText={handleCodeChange}
                    keyboardType="numeric"
                    maxLength={6}
                    autoFocus={false}
                    caretHidden
                  />
                  
                  {/* Code Boxes Display */}
                  <View style={styles.codeContainer}>
                    {renderCodeBoxes()}
                  </View>

                  {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                  ) : null}
                  
                  {/* Helper text */}
                  <Text style={styles.helperText}>
                    Open your authenticator app to get the code
                  </Text>
                </View>

                {/* Submit Button */}
                <View style={styles.buttonSection}>
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
                      {loading ? 'Verifying...' : 'Verify'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
              
              {/* Safe Area Extension - White background that extends into bottom safe area */}
              <View style={[styles.safeAreaExtension, { height: insets.bottom }]} />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalWrapper: {
    alignSelf: 'center',
  },
  modalContainer: {
    width: 393,
    height: MODAL_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  safeAreaExtension: {
    width: 393,
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputSection: {
    alignItems: 'center',
    marginBottom: 40,
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
    gap: 12,
    marginBottom: 16,
  },
  codeBox: {
    width: 44,
    height: 52,
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
    fontSize: 20,
    fontFamily: Typography.medium || 'System',
    fontWeight: '600',
    color: '#9CA3AF',
  },
  codeTextFilled: {
    color: '#35297F',
  },
  errorText: {
    color: '#EF4444',
    fontFamily: Typography.regular || 'System',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  helperText: {
    color: '#9CA3AF',
    fontFamily: Typography.regular || 'System',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonSection: {
    marginTop: 'auto',
    paddingBottom: 24,
  },
  submitButton: {
    backgroundColor: '#35297F',
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TwoFactorAuthModal;