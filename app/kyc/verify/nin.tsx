// app/kyc/nin-verify.tsx
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import Svg, { Defs, Rect, Mask, Circle } from 'react-native-svg';
import backIcon from '../../../components/icons/backy.png';
import ErrorDisplay from '../../../components/ErrorDisplay';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { useBiometricVerification } from '../../../hooks/useKYC';

const { width: screenWidth } = Dimensions.get('window');

const PREVIEW_SIZE = 280;
const PREVIEW_RECT = {
  minX: (screenWidth - PREVIEW_SIZE) / 2,
  minY: 120,
  width: PREVIEW_SIZE,
  height: PREVIEW_SIZE
};

type Step = 'input' | 'camera' | 'preview' | 'processing' | 'success';
type ErrorType = 'network' | 'server' | 'notFound' | 'general';

const CameraOverlay = () => (
  <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
    <Defs>
      <Mask id="mask" x="0" y="0" height="100%" width="100%">
        <Rect height="100%" width="100%" fill="#fff" />
        <Circle
          r={PREVIEW_SIZE / 2}
          cx={screenWidth / 2}
          cy={PREVIEW_RECT.minY + PREVIEW_SIZE / 2}
          fill="black"
        />
      </Mask>
    </Defs>
    <Rect
      height="100%"
      width="100%"
      fill="rgba(0, 0, 0, 0.7)"
      mask="url(#mask)"
    />
  </Svg>
);

/* ---------------- Success Modal (giftcard style) ---------------- */
interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  onClose,
  title,
  message,
  buttonText = 'Continue'
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleBackdropPress = () => {
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={successModalStyles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                successModalStyles.modalContainer,
                { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
              ]}
            >
              <TouchableOpacity
                style={successModalStyles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={successModalStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              <View style={successModalStyles.titleSection}>
                <Text style={successModalStyles.title}>{title}</Text>
                <Text style={successModalStyles.message}>{message}</Text>
              </View>

              <TouchableOpacity
                style={successModalStyles.submitButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={successModalStyles.submitButtonText}>{buttonText}</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default function NINVerify() {
  const router = useRouter();
  const [nin, setNin] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [countdown, setCountdown] = useState(3);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const {
    isVerifying,
    isValidating,
    submitBiometricVerification,
    validateBiometricData,
    validateNIN,
    formatIdNumber
  } = useBiometricVerification();

  const [showError, setShowError] = useState(false);
  const [errorType, setErrorType] = useState<ErrorType>('general');
  const [errorMessage, setErrorMessage] = useState('');

  const classifyError = (msg?: string): ErrorType => {
    const m = (msg || '').toLowerCase();
    if (m.includes('network') || m.includes('connection')) return 'network';
    if (m.includes('server') || m.includes('500')) return 'server';
    if (m.includes('not found')) return 'notFound';
    return 'general';
  };

  const openError = useCallback((msg: string) => {
    setErrorType(classifyError(msg));
    setErrorMessage(msg);
    setShowError(true);
  }, []);

  const closeError = useCallback(() => {
    setShowError(false);
    setErrorMessage('');
  }, []);

  const handleNinChange = (value: string) => {
    const formatted = formatIdNumber('national_id', value);
    setNin(formatted);
  };

  const validation = useMemo(() => {
    if (!nin || nin.length === 0) {
      return { valid: false, message: '' };
    }
    return validateNIN ? validateNIN(nin) : { valid: false, message: '' };
  }, [nin, validateNIN]);

  const isValidFormat = validation?.valid === true;

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isCountingDown && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (isCountingDown && countdown === 0) {
      capturePhoto();
      setIsCountingDown(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isCountingDown, countdown]);

  const capturePhoto = async () => {
    if (!cameraRef.current) {
      openError('Camera not ready');
      return;
    }

    try {
      const photo: any = await (cameraRef.current as any).takePictureAsync({
        quality: 0.85,
        base64: true,
        skipProcessing: true,
      });

      if (!photo || !photo.base64) {
        openError('Failed to capture photo: no image data');
        return;
      }

      const base64 = `data:image/jpeg;base64,${photo.base64}`;
      setCapturedImage(base64);
      setStep('preview');
    } catch (error: any) {
      openError('Failed to capture photo: ' + (error?.message ?? String(error)));
    }
  };

  const startSelfieCapture = () => {
    setCountdown(3);
    setIsCountingDown(true);
  };

  const validateBeforeSubmit = async () => {
    if (!capturedImage) {
      openError('No selfie captured');
      return false;
    }

    const verificationData = {
      idType: 'national_id',
      idNumber: nin,
      selfieImage: capturedImage
    };

    try {
      console.log('🔍 Validating biometric data before submission...');
      const validationResult = await validateBiometricData(verificationData);

      if (!validationResult || !validationResult.success) {
        openError(validationResult?.message || 'Validation failed');
        return false;
      }

      return true;
    } catch (error: any) {
      openError(error?.message || 'Validation failed');
      return false;
    }
  };

  const handleBiometricSubmit = async () => {
    const isValid = await validateBeforeSubmit();
    if (!isValid) return;

    // Show local processing UI then return to input screen immediately after submission
    setStep('processing');

    try {
      console.log('🔐 Submitting NIN verification...');
      const result = await submitBiometricVerification({
        idType: 'national_id',
        idNumber: nin,
        selfieImage: capturedImage
      });

      console.log('📨 Verification result:', result);

      // Always return to the input (load up) screen
      setStep('input');

      if (result && result.success) {
        // Store the verification result for potential display (optional)
        setVerificationResult({
          ...result.data,
          submissionTime: new Date().toLocaleString('en-NG', {
            dateStyle: 'medium',
            timeStyle: 'short'
          })
        });

        // Show KYC in progress modal (giftcard style)
        setShowSuccess(true);
      } else {
        // Surface backend error on the input screen using ErrorDisplay
        const errMsg = (result && (result.message || result.error)) || 'Verification submission failed. Please try again.';
        openError(errMsg);
      }
    } catch (error: any) {
      console.error('❌ Verification error:', error);
      // Return to input screen and show error
      setStep('input');
      openError(error?.message || 'Verification failed. Please try again.');
    } finally {
      // keep user on input screen - do not navigate to any error screen
      setCapturedImage(null);
      setIsCountingDown(false);
      setCountdown(3);
    }
  };

  const handleNINSubmit = async () => {
    if (!isValidFormat) {
      openError(validation?.message || 'NIN must be 11 digits.');
      return;
    }

    if (!permission?.granted) {
      Alert.alert(
        'Camera Permission Required',
        'Camera access is needed for identity verification. Please enable camera permission in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: requestPermission }
        ]
      );
      return;
    }

    setStep('camera');
  };

  const resetVerification = () => {
    setStep('input');
    setCapturedImage(null);
    setVerificationResult(null);
    setCountdown(3);
    setIsCountingDown(false);
    closeError();
    setShowSuccess(false);
  };

  const renderInputStep = () => (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerSection}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Image source={backIcon} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NIN Verification</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sub}>
          Enter your 11-digit National Identification Number (NIN) for identity verification.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            value={nin}
            onChangeText={handleNinChange}
            inputMode="numeric"
            keyboardType="number-pad"
            maxLength={11}
            placeholder="12345678901"
            style={[
              styles.input,
              !isValidFormat && nin.length > 0 && styles.inputError,
            ]}
            editable={!isVerifying && !isValidating}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            testID="ninInput"
            onSubmitEditing={handleNINSubmit}
          />
          {!isValidFormat && nin.length > 0 && (
            <Text style={styles.errorText}>
              {validation?.message || 'NIN must be exactly 11 digits.'}
            </Text>
          )}
          {nin.length > 0 && isValidFormat && (
            <Text style={styles.successText}>
              ✓ Valid NIN format
            </Text>
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 Tips for better verification:</Text>
          <Text style={styles.infoText}>• Ensure your NIN is correct and active</Text>
          <Text style={styles.infoText}>• Use good lighting for your selfie</Text>
          <Text style={styles.infoText}>• Remove glasses if possible</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.cta,
            { opacity: isValidFormat && !isVerifying && !isValidating ? 1 : 0.5 },
          ]}
          disabled={!isValidFormat || isVerifying || isValidating}
          onPress={handleNINSubmit}
          activeOpacity={0.7}
          testID="submitNinButton"
        >
          {isValidating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.ctaText}>Continue to Face Verification</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderCameraStep = () => (
    <View style={styles.cameraContainer}>
      <View style={styles.headerSection}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('input')}
            activeOpacity={0.7}
          >
            <Image source={backIcon} style={[styles.backIcon, { tintColor: '#fff' }]} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#fff' }]}>Take Selfie</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {permission?.granted && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing="front"
        >
          <CameraOverlay />

          <View style={styles.instructionsContainer}>
            {isCountingDown ? (
              <Text style={styles.countdownText}>{countdown}</Text>
            ) : (
              <>
                <Text style={styles.instructionsText}>
                  Position your face in the circle
                </Text>
                <Text style={styles.subInstructionsText}>
                  Make sure your face is well lit and clearly visible
                </Text>
                <Text style={styles.subInstructionsText}>
                  Look directly at the camera
                </Text>
              </>
            )}
          </View>

          <View style={styles.cameraControls}>
            {!isCountingDown ? (
              <TouchableOpacity
                style={styles.captureButton}
                onPress={startSelfieCapture}
                activeOpacity={0.7}
              >
                <Text style={styles.captureButtonText}>Take Selfie</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.capturingContainer}>
                <Text style={styles.capturingText}>Taking photo in {countdown}...</Text>
              </View>
            )}
          </View>
        </CameraView>
      )}

      {!permission?.granted && (
        <View style={styles.centerContainer}>
          <Text style={styles.permissionText}>Camera permission is required</Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={requestPermission}
            activeOpacity={0.7}
          >
            <Text style={styles.ctaText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderPreviewStep = () => (
    <View style={styles.previewContainer}>
      <View style={styles.headerSection}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('camera')}
            activeOpacity={0.7}
          >
            <Image source={backIcon} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Photo</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <View style={styles.previewContent}>
        {capturedImage && (
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
        )}

        <Text style={styles.previewText}>
          Is this photo clear and well-lit?
        </Text>

        <Text style={styles.previewSubtext}>
          Make sure your face is clearly visible and the image is not blurry
        </Text>

        <View style={styles.previewActions}>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: '#6B7280', flex: 1, marginRight: 8 }]}
            onPress={() => setStep('camera')}
            activeOpacity={0.7}
          >
            <Text style={styles.ctaText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cta, { flex: 1, marginLeft: 8 }]}
            onPress={handleBiometricSubmit}
            activeOpacity={0.7}
            disabled={isVerifying || isValidating}
          >
            {isVerifying || isValidating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.ctaText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderProcessingStep = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#35297F" />
      <Text style={styles.processingText}>Verifying your identity...</Text>
      <Text style={styles.processingSubtext}>
        We're comparing your selfie with your NIN records
      </Text>
      <Text style={styles.processingSubtext}>
        This may take a few moments
      </Text>
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.successIcon}>✅</Text>
      <Text style={styles.successTitle}>Verification Submitted</Text>
      <Text style={styles.successText}>
        Your KYC verification is in progress.
      </Text>
      <TouchableOpacity
        style={styles.cta}
        onPress={() => router.replace('../kyc/kyc-upgrade')}
        activeOpacity={0.7}
      >
        <Text style={styles.ctaText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        backgroundColor={step === 'camera' ? '#000' : Colors.background}
        barStyle={step === 'camera' ? 'light-content' : 'dark-content'}
      />

      {showError && (
        <ErrorDisplay
          type={errorType}
          message={errorMessage}
          autoHide={false}
          dismissible
          onDismiss={closeError}
        />
      )}

      {step === 'input' && renderInputStep()}
      {step === 'camera' && renderCameraStep()}
      {step === 'preview' && renderPreviewStep()}
      {step === 'processing' && renderProcessingStep()}
      {step === 'success' && renderSuccessStep()}

      <SuccessModal
        visible={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          router.replace('../kyc/kyc-upgrade');
        }}
        title="KYC in Progress"
        message="You will get an email with the confirmation status soon."
        buttonText="Continue"
      />
    </SafeAreaView>
  );
}

/* ---------------- Styles (unchanged) ---------------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background || '#F8F9FA' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  headerSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  headerTitle: {
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: { width: 40 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sub: {
    color: Colors.text?.secondary || '#6B7280',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20
  },
  inputContainer: { marginBottom: 16 },
  input: {
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 },
  successText: { color: '#10B981', fontSize: 12, marginTop: 4, marginLeft: 4 },
  infoBox: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#0369A1',
    marginBottom: 2,
  },
  cta: {
    backgroundColor: '#35297F',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  ctaText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  instructionsContainer: {
    position: 'absolute',
    top: PREVIEW_RECT.minY + PREVIEW_SIZE + 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  instructionsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subInstructionsText: {
    color: '#D1D5DB',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  countdownText: {
    color: '#fff',
    fontSize: 72,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  captureButton: {
    backgroundColor: '#35297F',
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    alignSelf: 'center',
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  capturingContainer: {
    alignItems: 'center',
  },
  capturingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  permissionText: {
    color: '#111827',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  previewContent: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: 280,
    height: 280,
    borderRadius: 140,
    marginBottom: 24,
  },
  previewText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  previewSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  previewActions: {
    flexDirection: 'row',
    width: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  resultContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    alignSelf: 'stretch',
  },
  resultText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
});

const successModalStyles = StyleSheet.create({
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
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    color: '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  submitButton: {
    backgroundColor: '#35297F',
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 15,
    fontWeight: '600',
  },
});
