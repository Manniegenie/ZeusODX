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

const MODAL_HEIGHT = 320;

const PinEntryModal = ({
  visible,
  onClose,
  onSubmit,
  loading = false,
  title = 'Enter Password PIN',
  subtitle = 'Please enter your 6-digit password PIN to continue'
}) => {
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const pinInputRef = useRef(null);

  // Slide animation
  useEffect(() => {
    if (visible) {
      setPin('');
      setError('');
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start(() => {
        // Focus input after animation
        setTimeout(() => pinInputRef.current?.focus(), 100);
      });
    } else {
      Animated.timing(slideAnim, {
        toValue: MODAL_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handlePinChange = (value) => {
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

  const handleBackdropPress = () => {
    if (!loading) {
      onClose();
    }
  };

  const isValid = pin.length === 6;

  // Create dots for PIN display
  const renderPinDots = () => {
    const dots = [];
    for (let i = 0; i < 6; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.pinDot,
            i < pin.length && styles.pinDotFilled
          ]}
        />
      );
    }
    return dots;
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
                  
                  {/* PIN Dots Display */}
                  <View style={styles.pinContainer}>
                    {renderPinDots()}
                  </View>

                  {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                  ) : null}
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
                      {loading ? 'Verifying...' : 'Continue'}
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
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  pinDotFilled: {
    backgroundColor: '#35297F',
    borderColor: '#35297F',
  },
  errorText: {
    color: '#EF4444',
    fontFamily: Typography.regular || 'System',
    fontSize: 12,
    textAlign: 'center',
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

export default PinEntryModal;