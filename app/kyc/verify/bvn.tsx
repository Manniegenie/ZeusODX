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
} from 'react-native';
import { Camera, useCameraDevices, useCameraPermission } from 'react-native-vision-camera';
import { useRouter } from 'expo-router';
import Svg, { Defs, Rect, Mask, Circle } from 'react-native-svg';

import ErrorDisplay from '../../../components/ErrorDisplay';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { useBiometricVerification } from '../../../hooks/useKYC';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PREVIEW_SIZE = 280;
const PREVIEW_RECT = {
  minX: (screenWidth - PREVIEW_SIZE) / 2,
  minY: 120,
  width: PREVIEW_SIZE,
  height: PREVIEW_SIZE
};

type Step = 'input' | 'camera' | 'preview' | 'processing' | 'success' | 'error';
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

export default function BVNVerify() {
  const router = useRouter();
  const [bvn, setBvn] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [countdown, setCountdown] = useState(3);
  const [isCountingDown, setIsCountingDown] = useState(false);
  
  const cameraRef = useRef<Camera>(null);
  
  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const frontCamera = devices.front;

  const { 
    isVerifying, 
    submitBiometricVerification, 
    validateBVN 
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
  }, []);

  const validation = useMemo(() => validateBVN(bvn), [bvn, validateBVN]);
  const isValidFormat = validation?.valid === true;

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCountingDown && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (isCountingDown && countdown === 0) {
      capturePhoto();
      setIsCountingDown(false);
    }
    return () => clearTimeout(timer);
  }, [isCountingDown, countdown]);

  const capturePhoto = async () => {
    if (!cameraRef.current) {
      openError('Camera not ready');
      return;
    }

    try {
      const photo = await cameraRef.current.takePhoto({
        quality: 85,
        skipMetadata: true,
      });
      
      const base64 = `data:image/jpeg;base64,${photo.base64 || ''}`;
      setCapturedImage(base64);
      setStep('preview');
    } catch (error: any) {
      openError('Failed to capture photo: ' + error.message);
    }
  };

  const startSelfieCapture = () => {
    setCountdown(3);
    setIsCountingDown(true);
  };

  const handleBiometricSubmit = async () => {
    if (!capturedImage) {
      openError('No selfie captured');
      return;
    }

    setStep('processing');

    try {
      const result = await submitBiometricVerification({
        idType: 'bvn',
        idNumber: bvn,
        selfieImage: capturedImage
      });

      if (result.success && result.data) {
        setVerificationResult(result.data);
        setStep(result.data.isApproved ? 'success' : 'error');
      } else {
        throw new Error(result.error || 'Verification failed');
      }
    } catch (error: any) {
      openError(error.message || 'Verification failed');
      setStep('error');
    }
  };

  const handleBVNSubmit = async () => {
    if (!isValidFormat) {
      openError(validation?.message || 'BVN must be 11 digits.');
      return;
    }

    if (!hasPermission) {
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

    if (!frontCamera) {
      openError('Front camera not available');
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
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>BVN Verification</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sub}>Enter your 11-digit Bank Verification Number (BVN) for identity verification.</Text>
        <Text style={styles.formatHint}>Your BVN links all your bank accounts in Nigeria</Text>
        
        <View style={styles.noticeContainer}>
          <Text style={styles.noticeText}>
            🏦 Your BVN is used to verify your identity across Nigerian banks. This verification is secure and your banking information remains private.
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            value={bvn}
            onChangeText={(text) => setBvn(text.replace(/\D/g, ''))}
            inputMode="numeric"
            keyboardType="number-pad"
            maxLength={11}
            placeholder="12345678901"
            style={[
              styles.input,
              !isValidFormat && bvn.length > 0 && styles.inputError,
            ]}
            editable={!isVerifying}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            testID="bvnInput"
          />
          {!isValidFormat && bvn.length > 0 && (
            <Text style={styles.errorText}>
              {validation?.message || 'BVN must be exactly 11 digits.'}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.cta,
            { opacity: isValidFormat && !isVerifying ? 1 : 0.5 },
          ]}
          disabled={!isValidFormat || isVerifying}
          onPress={handleBVNSubmit}
          activeOpacity={0.7}
          testID="submitBvnButton"
        >
          <Text style={styles.ctaText}>Continue to Face Verification</Text>
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
            <Text style={[styles.backButtonText, { color: '#fff' }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#fff' }]}>Take Selfie</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {frontCamera && (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          device={frontCamera}
          isActive={step === 'camera'}
          photo={true}
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
        </Camera>
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
            <Text style={styles.backButtonText}>←</Text>
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
            disabled={isVerifying}
          >
            <Text style={styles.ctaText}>
              {isVerifying ? 'Processing...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderProcessingStep = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#35297F" />
      <Text style={styles.processingText}>Verifying your BVN...</Text>
      <Text style={styles.processingSubtext}>This may take a few moments</Text>
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.successIcon}>✅</Text>
      <Text style={styles.successTitle}>Verification Successful!</Text>
      <Text style={styles.successText}>
        Your BVN has been successfully verified.
      </Text>
      {verificationResult && (
        <Text style={styles.resultText}>
          Confidence: {verificationResult.confidenceValue}%
        </Text>
      )}
      <TouchableOpacity
        style={styles.cta}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Text style={styles.ctaText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorStep = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.errorIcon}>❌</Text>
      <Text style={styles.errorTitle}>Verification Failed</Text>
      <Text style={styles.errorText}>
        {verificationResult?.resultText || 'Unable to verify your BVN. Please ensure your BVN is correct and try again.'}
      </Text>
      <TouchableOpacity
        style={[styles.cta, { backgroundColor: '#EF4444' }]}
        onPress={resetVerification}
        activeOpacity={0.7}
      >
        <Text style={styles.ctaText}>Try Again</Text>
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
      {step === 'error' && renderErrorStep()}
    </SafeAreaView>
  );
}

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
  backButtonText: {
    fontSize: 20,
    color: Colors.text?.primary || '#111827',
    fontWeight: '500',
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
  sub: { color: Colors.text?.secondary || '#6B7280', fontSize: 14, marginBottom: 8 },
  formatHint: { 
    color: '#9CA3AF', 
    fontSize: 12, 
    marginBottom: 12,
    fontStyle: 'italic' 
  },

  noticeContainer: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: 4,
    borderLeftColor: '#35297F',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  noticeText: {
    fontSize: 13,
    color: '#4338CA',
    lineHeight: 18,
  },

  inputContainer: { marginBottom: 12 },
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
  },
  resultText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 24,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 8,
    textAlign: 'center',
  },
});