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
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Typography } from '../constants/Typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive calculations
const getResponsiveDimensions = () => {
  const isSmallScreen = SCREEN_WIDTH < 350;
  const isMediumScreen = SCREEN_WIDTH < 400;
  
  return {
    modalWidth: Math.min(SCREEN_WIDTH * (isSmallScreen ? 0.95 : 0.9), 400),
    maxModalHeight: SCREEN_HEIGHT * 0.8, // Limit to 80% of screen height
    horizontalPadding: isSmallScreen ? 16 : isMediumScreen ? 20 : 24,
    verticalPadding: isSmallScreen ? 16 : 20,
    sectionMargin: isSmallScreen ? 20 : 24,
    pinBoxSize: isSmallScreen ? 36 : 40,
    pinBoxGap: isSmallScreen ? 6 : 8,
  };
};

const PinEntryModal = ({
  visible,
  onClose,
  onSubmit,
  loading = false,
  title = 'Enter Password PIN',
  subtitle = 'Please enter your 6-digit password PIN to continue'
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [dimensions, setDimensions] = useState(getResponsiveDimensions());
  const pinInputRef = useRef(null);

  // Update dimensions on screen size change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setDimensions(getResponsiveDimensions());
    });
    return () => subscription?.remove();
  }, []);

  // Scale and fade animation
  useEffect(() => {
    if (visible) {
      setPin('');
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
        setTimeout(() => pinInputRef.current?.focus(), 100);
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

  // Create individual input boxes for PIN (responsive sizing)
  const renderPinBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      boxes.push(
        <View
          key={i}
          style={[
            styles.pinBox,
            {
              width: dimensions.pinBoxSize,
              height: dimensions.pinBoxSize + 8, // Slightly taller than wide
            },
            i < pin.length && styles.pinBoxFilled
          ]}
        >
          <Text style={[
            styles.pinText,
            { fontSize: dimensions.pinBoxSize * 0.45 }, // Responsive font size
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
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.safeArea}>
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    width: dimensions.modalWidth,
                    maxHeight: dimensions.maxModalHeight,
                    paddingHorizontal: dimensions.horizontalPadding,
                    paddingVertical: dimensions.verticalPadding,
                    opacity: opacityAnim,
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                {/* Close Button */}
                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    { 
                      top: dimensions.verticalPadding / 2, 
                      right: dimensions.horizontalPadding / 2 
                    }
                  ]}
                  onPress={onClose}
                  disabled={loading}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>

                {/* Scrollable Content */}
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: dimensions.sectionMargin / 2 }
                  ]}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {/* Title Section */}
                  <View style={[
                    styles.titleSection,
                    { marginBottom: dimensions.sectionMargin }
                  ]}>
                    <Text style={[
                      styles.title,
                      { fontSize: SCREEN_WIDTH < 350 ? 18 : 20 }
                    ]}>
                      {title}
                    </Text>
                    <Text style={[
                      styles.subtitle,
                      { fontSize: SCREEN_WIDTH < 350 ? 13 : 14 }
                    ]}>
                      {subtitle}
                    </Text>
                  </View>

                  {/* PIN Input Section */}
                  <View style={[
                    styles.inputSection,
                    { marginBottom: dimensions.sectionMargin }
                  ]}>
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
                    <View style={[
                      styles.pinContainer,
                      { gap: dimensions.pinBoxGap }
                    ]}>
                      {renderPinBoxes()}
                    </View>

                    {error ? (
                      <Text style={[
                        styles.errorText,
                        { fontSize: SCREEN_WIDTH < 350 ? 11 : 12 }
                      ]}>
                        {error}
                      </Text>
                    ) : null}
                    
                    {/* Helper text */}
                    <Text style={[
                      styles.helperText,
                      { fontSize: SCREEN_WIDTH < 350 ? 11 : 12 }
                    ]}>
                      Enter your secure 6-digit PIN
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
                      <Text style={[
                        styles.submitButtonText,
                        { fontSize: SCREEN_WIDTH < 350 ? 15 : 16 }
                      ]}>
                        {loading ? 'Verifying...' : 'Continue'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    minHeight: 200, // Minimum height to prevent cramping
  },
  closeButton: {
    position: 'absolute',
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
  },
  title: {
    color: '#111827',
    fontFamily: Typography.medium || 'System',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  inputSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
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
    marginBottom: 16,
    flexWrap: 'wrap', // Allow wrapping on very small screens
  },
  pinBox: {
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
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  helperText: {
    color: '#9CA3AF',
    fontFamily: Typography.regular || 'System',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 16,
    lineHeight: 16,
  },
  buttonSection: {
    width: '100%',
    paddingTop: 8,
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
    fontWeight: '600',
  },
});

export default PinEntryModal;