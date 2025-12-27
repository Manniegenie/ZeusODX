// app/kyc/verify/drivers-license-verify.tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';
import ErrorDisplay from '../../../components/ErrorDisplay';
import backIcon from '../../../components/icons/backy.png';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { useBiometricVerification } from '../../../hooks/useKYC';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * UI CONSTANTS
 * Positioning the circle at 25% height to ensure the phone 
 * is held vertically, preventing chest/lower body capture.
 */
const PREVIEW_SIZE = 280;
const PREVIEW_RECT = {
  minX: (screenWidth - PREVIEW_SIZE) / 2,
  minY: screenHeight * 0.25, 
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

/* ---------------- Success Modal ---------------- */
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
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={successModalStyles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View style={[successModalStyles.modalContainer, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
              <TouchableOpacity style={successModalStyles.closeButton} onPress={onClose}>
                <Text style={successModalStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <View style={successModalStyles.titleSection}>
                <Text style={successModalStyles.title}>{title}</Text>
                <Text style={successModalStyles.message}>{message}</Text>
              </View>
              <TouchableOpacity style={successModalStyles.submitButton} onPress={onClose} activeOpacity={0.8}>
                <Text style={successModalStyles.submitButtonText}>{buttonText}</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default function DriversLicenseVerify() {
  const router = useRouter();
  const [licenseNumber, setLicenseNumber] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const {
    isVerifying,
    isValidating,
    submitBiometricVerification,
    validateBiometricData
  } = useBiometricVerification();

  const [showError, setShowError] = useState(false);
  const [errorType, setErrorType] = useState<ErrorType>('general');
  const [errorMessage, setErrorMessage] = useState('');

  const openError = useCallback((msg: string) => {
    setErrorMessage(msg);
    setShowError(true);
  }, []);

  const closeError = useCallback(() => setShowError(false), []);
  const handleLicenseChange = (value: string) => {
    const formatted = value.toUpperCase().replace(/\s/g, '');
    setLicenseNumber(formatted);
  };

  const validation = useMemo(() => {
    if (licenseNumber.length === 0) return { valid: false, message: '' };
    if (licenseNumber.length < 8) return { valid: false, message: 'License number must be at least 8 characters' };
    if (licenseNumber.length > 20) return { valid: false, message: 'License number cannot exceed 20 characters' };
    const alphanumericRegex = /^[A-Z0-9]+$/;
    if (!alphanumericRegex.test(licenseNumber)) return { valid: false, message: 'License number can only contain letters and numbers' };
    return { valid: true, message: 'Valid license format' };
  }, [licenseNumber]);

  const isValidFormat = validation?.valid === true;

  useEffect(() => {
    if (isCountingDown && countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isCountingDown && countdown === 0) {
      capturePhoto();
      setIsCountingDown(false);
    }
  }, [isCountingDown, countdown]);

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo: any = await (cameraRef.current as any).takePictureAsync({ quality: 0.85, base64: true, skipProcessing: true });
      setCapturedImage(`data:image/jpeg;base64,${photo.base64}`);
      setStep('preview');
    } catch (e) { openError('Failed to capture photo'); }
  };

  const handleBiometricSubmit = async () => {
    setStep('processing');
    try {
      const res = await submitBiometricVerification({ idType: 'drivers_license', idNumber: licenseNumber, selfieImage: capturedImage! });
      if (res?.success) setShowSuccess(true);
      else { openError(res?.message || 'Verification failed'); setStep('preview'); }
    } catch (e) { setStep('input'); openError('Verification failed'); }
  };

  const renderInputStep = () => (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.headerSection}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Image source={backIcon} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{`Driver's License Verification`}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sub}>Enter your Nigerian drivers license number for identity verification.</Text>
        
        <View style={styles.noticeContainer}>
          <Text style={styles.noticeText}>
            {`💡 Note: Driver's license verification may use additional identity checks for enhanced security.`}
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            value={licenseNumber}
            onChangeText={handleLicenseChange}
            maxLength={20}
            placeholder="ABC123DEF456"
            style={[styles.input, !isValidFormat && licenseNumber.length > 0 && styles.inputError]}
          />
          {!isValidFormat && licenseNumber.length > 0 && <Text style={styles.errorText}>{validation?.message}</Text>}
          {licenseNumber.length > 0 && isValidFormat && <Text style={styles.successHint}>✓ Valid license format</Text>}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 Tips for better verification:</Text>
          <Text style={styles.infoText}>• Ensure your license number is correct and active</Text>
          <Text style={styles.infoText}>• Use good lighting for your selfie</Text>
          <Text style={styles.infoText}>• Remove glasses if possible</Text>
        </View>

        <TouchableOpacity 
          style={[styles.cta, { opacity: isValidFormat && !isValidating ? 1 : 0.5 }]} 
          disabled={!isValidFormat || isValidating} 
          onPress={() => setStep('camera')}
        >
          {isValidating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.ctaText}>Continue to Face Verification</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderCameraStep = () => (
    <View style={styles.cameraContainer}>
        <View style={[styles.headerSection, { position: 'absolute', top: 0, zIndex: 10, width: '100%' }]}>
            <View style={styles.headerContainer}>
                <TouchableOpacity style={styles.backButton} onPress={() => setStep('input')}>
                    <Image source={backIcon} style={[styles.backIcon, { tintColor: '#fff' }]} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: '#fff' }]}>Take Selfie</Text>
                <View style={styles.headerSpacer} />
            </View>
        </View>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="front">
        <CameraOverlay />
        <View style={[styles.instructionsContainer, { top: PREVIEW_RECT.minY + PREVIEW_SIZE + 40 }]}>
          {isCountingDown ? <Text style={styles.countdownText}>{countdown}</Text> : (
            <>
              <Text style={styles.instructionsText}>Position your face in the circle</Text>
              <Text style={styles.subInstructionsText}>Hold phone straight at eye level</Text>
              <Text style={styles.subInstructionsText}>Avoid tilting the phone</Text>
            </>
          )}
        </View>
        <View style={styles.cameraControls}>
          {!isCountingDown ? (
            <TouchableOpacity style={styles.captureButton} onPress={() => { setCountdown(3); setIsCountingDown(true); }}>
              <Text style={styles.captureButtonText}>Take Selfie</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.capturingContainer}><Text style={styles.capturingText}>Taking photo in {countdown}...</Text></View>
          )}
        </View>
      </CameraView>
    </View>
  );

  const renderPreviewStep = () => (
    <View style={styles.previewContainer}>
      <View style={styles.previewContent}>
        {capturedImage && <Image source={{ uri: capturedImage }} style={styles.previewImage} />}
        <Text style={styles.previewText}>Is this photo clear?</Text>
        <View style={styles.previewActions}>
          <TouchableOpacity style={[styles.cta, { backgroundColor: '#6B7280', flex: 1, marginRight: 8 }]} onPress={() => setStep('camera')}><Text style={styles.ctaText}>Retake</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.cta, { flex: 1, marginLeft: 8 }]} onPress={handleBiometricSubmit}><Text style={styles.ctaText}>Submit</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={step === 'camera' ? '#000' : Colors.background} barStyle={step === 'camera' ? 'light-content' : 'dark-content'} />
      {showError && <ErrorDisplay type={errorType} message={errorMessage} onDismiss={closeError} />}
      {step === 'input' && renderInputStep()}
      {step === 'camera' && renderCameraStep()}
      {step === 'preview' && renderPreviewStep()}
      {step === 'processing' && (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#35297F" />
            <Text style={styles.processingText}>Verifying your drivers license...</Text>
        </View>
      )}
      <SuccessModal visible={showSuccess} onClose={() => router.replace('/kyc/kyc-upgrade')} title="KYC in Progress" message="You will get an email with the confirmation status soon." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background || '#F8F9FA' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  headerSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  backIcon: { width: 24, height: 24, resizeMode: 'contain' },
  headerTitle: { color: '#35297F', fontFamily: Typography.medium || 'System', fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 16 },
  headerSpacer: { width: 40 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sub: { color: '#6B7280', fontSize: 14, marginBottom: 16, lineHeight: 20 },
  noticeContainer: { backgroundColor: '#F3F4F6', borderLeftWidth: 4, borderLeftColor: '#35297F', padding: 12, marginBottom: 16, borderRadius: 8 },
  noticeText: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
  inputContainer: { marginBottom: 16 },
  input: { backgroundColor: '#fff', borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#111827' },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 },
  successHint: { color: '#10B981', fontSize: 12, marginTop: 4, marginLeft: 4 },
  infoBox: { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#0369A1', marginBottom: 8 },
  infoText: { fontSize: 12, color: '#0369A1', marginBottom: 2 },
  cta: { backgroundColor: '#35297F', borderRadius: 10, padding: 14, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  ctaText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  instructionsContainer: { position: 'absolute', left: 0, right: 0, paddingHorizontal: 20, alignItems: 'center' },
  instructionsText: { color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  subInstructionsText: { color: '#D1D5DB', fontSize: 14, textAlign: 'center', marginBottom: 4 },
  countdownText: { color: '#fff', fontSize: 72, fontWeight: 'bold' },
  cameraControls: { position: 'absolute', bottom: 60, left: 0, right: 0, paddingHorizontal: 20 },
  captureButton: { backgroundColor: '#35297F', borderRadius: 50, paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center', alignSelf: 'center' },
  captureButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  capturingContainer: { alignItems: 'center' },
  capturingText: { color: '#fff', fontSize: 16 },
  previewContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  previewContent: { flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: 280, height: 280, borderRadius: 140, marginBottom: 24 },
  previewText: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 24 },
  previewActions: { flexDirection: 'row', width: '100%' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  processingText: { fontSize: 18, fontWeight: '600', color: '#111827', marginTop: 16 },
});

const successModalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modalContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, width: 320, alignSelf: 'center' },
  closeButton: { position: 'absolute', top: 16, right: 16, width: 30, height: 30, justifyContent: 'center', alignItems: 'center', borderRadius: 15, backgroundColor: '#F3F4F6' },
  closeButtonText: { color: '#6B7280', fontSize: 16 },
  titleSection: { alignItems: 'center', marginBottom: 24 },
  title: { color: '#111827', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  message: { color: '#6B7280', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  submitButton: { backgroundColor: '#35297F', borderRadius: 12, paddingVertical: 14, width: '100%', alignItems: 'center' },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});