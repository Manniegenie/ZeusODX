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
  Clipboard,
  Alert,
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
    codeBoxSize: isSmallScreen ? 36 : 40,
    codeBoxGap: isSmallScreen ? 6 : 8,
  };
};

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
  const [dimensions, setDimensions] = useState(getResponsiveDimensions());
  const [clipboardContent, setClipboardContent] = useState('');
  const [showPasteButton, setShowPasteButton] = useState(false);
  const codeInputRef = useRef(null);

  // Update dimensions on screen size change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setDimensions(getResponsiveDimensions());
    });
    return () => subscription?.remove();
  }, []);

  // Check clipboard content when modal is visible
  useEffect(() => {
    if (visible) {
      checkClipboard();
    }
  }, [visible]);

  const checkClipboard = async () => {
    try {
      const content = await Clipboard.getString();
      // Check if clipboard contains a 6-digit number
      const is6DigitCode = /^\d{6}$/.test(content.trim());
      
      if (is6DigitCode) {
        setClipboardContent(content.trim());
        setShowPasteButton(true);
      } else {
        setShowPasteButton(false);
      }
    } catch (error) {
      console.log('Clipboard access failed:', error);
      setShowPasteButton(false);
    }
  };

  const handlePasteCode = () => {
    if (clipboardContent && /^\d{6}$/.test(clipboardContent)) {
      setCode(clipboardContent);
      setError('');
      setShowPasteButton(false);
      
      // Auto-submit after a short delay to show the code was pasted
      setTimeout(() => {
        if (!loading) {
          onSubmit(clipboardContent);
        }
      }, 500);
    } else {
      Alert.alert('Invalid Code', 'Clipboard does not contain a valid 6-digit code.');
    }
  };

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
    
    // Hide paste button once user starts typing
    if (numericValue.length > 0) {
      setShowPasteButton(false);
    }
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

  // Create individual input boxes for 2FA code (responsive sizing)
  const renderCodeBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      boxes.push(
        <View
          key={i}
          style={[
            styles.codeBox,
            {
              width: dimensions.codeBoxSize,
              height: dimensions.codeBoxSize + 8, // Slightly taller than wide
            },
            i < code.length && styles.codeBoxFilled
          ]}
        >
          <Text style={[
            styles.codeText,
            { fontSize: dimensions.codeBoxSize * 0.45 }, // Responsive font size
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

                  {/* 2FA Code Input Section */}
                  <View style={[
                    styles.inputSection,
                    { marginBottom: dimensions.sectionMargin }
                  ]}>
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
                    <View style={[
                      styles.codeContainer,
                      { gap: dimensions.codeBoxGap }
                    ]}>
                      {renderCodeBoxes()}
                    </View>

                    {/* Paste Button */}
                    {showPasteButton && (
                      <TouchableOpacity
                        style={styles.pasteButton}
                        onPress={handlePasteCode}
                        disabled={loading}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.pasteButtonText}>
                          📋 Paste Code ({clipboardContent})
                        </Text>
                      </TouchableOpacity>
                    )}

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
                      <Text style={[
                        styles.submitButtonText,
                        { fontSize: SCREEN_WIDTH < 350 ? 15 : 16 }
                      ]}>
                        {loading ? 'Verifying...' : 'Verify'}
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
    minHeight: 220, // Minimum height to prevent cramping
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
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap', // Allow wrapping on very small screens
  },
  codeBox: {
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
    fontFamily: Typography.medium || 'System',
    fontWeight: '600',
    color: '#9CA3AF',
  },
  codeTextFilled: {
    color: '#35297F',
  },
  pasteButton: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#35297F',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
    alignSelf: 'center',
  },
  pasteButtonText: {
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
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

export default TwoFactorAuthModal;