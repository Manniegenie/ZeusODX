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
  Dimensions,
} from 'react-native';
import { Typography } from '../constants/Typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_WIDTH = SCREEN_WIDTH * 0.9; // 90% of screen width
const MAX_MODAL_WIDTH = 400; // Maximum width for larger screens

const TwoFactorAuthModal = ({
  visible,
  onClose,
  onSubmit,
  loading = false,
  title = 'Two-Factor Authentication',
  subtitle = 'Please enter the 6-digit code from your authenticator app'
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const codeInputRef = useRef(null);

  // Scale and fade animation
  useEffect(() => {
    if (visible) {
      setCode('');
      setError('');
      
      // Animate in
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
        })
      ]).start(() => {
        // Focus input after animation
        setTimeout(() => codeInputRef.current?.focus(), 100);
      });
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

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

  const modalWidth = Math.min(MODAL_WIDTH, MAX_MODAL_WIDTH);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  width: modalWidth,
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
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
    marginBottom: 32,
    paddingTop: 8,
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
    paddingHorizontal: 8,
  },
  inputSection: {
    alignItems: 'center',
    marginBottom: 32,
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
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  codeBox: {
    width: 40,
    height: 48,
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
    fontSize: 18,
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
    paddingHorizontal: 16,
    lineHeight: 16,
  },
  buttonSection: {
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#35297F',
    borderRadius: 12,
    paddingVertical: 16,
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
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TwoFactorAuthModal;