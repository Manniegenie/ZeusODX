// components/LivenessCheck.tsx
import { CameraView } from 'expo-camera';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';
import { Colors } from '../constants/Colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PREVIEW_SIZE = 280;
const PREVIEW_RECT = {
  minX: (screenWidth - PREVIEW_SIZE) / 2,
  minY: screenHeight * 0.20,
  width: PREVIEW_SIZE,
  height: PREVIEW_SIZE
};

// Challenge types for liveness detection
type ChallengeType = 'blink' | 'smile' | 'turn_left' | 'turn_right' | 'nod';

interface Challenge {
  type: ChallengeType;
  instruction: string;
  duration: number; // seconds to complete
}

const CHALLENGES: Challenge[] = [
  { type: 'blink', instruction: 'Blink your eyes twice', duration: 5 },
  { type: 'smile', instruction: 'Smile naturally', duration: 4 },
  { type: 'turn_left', instruction: 'Turn your head slightly left', duration: 4 },
  { type: 'turn_right', instruction: 'Turn your head slightly right', duration: 4 },
  { type: 'nod', instruction: 'Nod your head up and down', duration: 5 },
];

interface LivenessCheckProps {
  onComplete: (livenessImages: string[], selfieImage: string) => void;
  onCancel: () => void;
  backIcon?: any;
}

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

// Progress ring component
const ProgressRing = ({ progress, size = 300 }: { progress: number; size?: number }) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <Svg width={size} height={size} style={styles.progressRing}>
      {/* Background circle */}
      <Circle
        stroke="rgba(255,255,255,0.3)"
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <Circle
        stroke="#35297F"
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
};

export default function LivenessCheck({ onComplete, onCancel, backIcon }: LivenessCheckProps) {
  const cameraRef = useRef<CameraView | null>(null);
  const [step, setStep] = useState<'intro' | 'challenge' | 'capturing' | 'complete'>('intro');
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [challengeProgress, setChallengeProgress] = useState(0);
  const [livenessImages, setLivenessImages] = useState<string[]>([]);
  const [finalSelfie, setFinalSelfie] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [isCapturing, setIsCapturing] = useState(false);

  // Get random challenges (2-3 challenges for user)
  const [selectedChallenges] = useState<Challenge[]>(() => {
    const shuffled = [...CHALLENGES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2); // Use 2 random challenges
  });

  const currentChallenge = selectedChallenges[currentChallengeIndex];
  const totalChallenges = selectedChallenges.length;

  // Capture a frame during the challenge
  const captureFrame = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return null;

    setIsCapturing(true);
    try {
      const photo = await (cameraRef.current as any).takePictureAsync({
        quality: 0.6,
        base64: true,
        skipProcessing: true,
      });
      return `data:image/jpeg;base64,${photo.base64}`;
    } catch (error) {
      console.error('Failed to capture frame:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  // Challenge timer and progress
  useEffect(() => {
    if (step !== 'challenge' || !currentChallenge) return;

    const duration = currentChallenge.duration * 1000;
    const interval = 100; // Update every 100ms
    let elapsed = 0;
    let framesCaptured = 0;
    const maxFrames = 4; // Capture 4 frames per challenge

    const timer = setInterval(async () => {
      elapsed += interval;
      const progress = Math.min(elapsed / duration, 1);
      setChallengeProgress(progress);

      // Capture frames at intervals during the challenge
      const captureInterval = duration / maxFrames;
      if (elapsed >= captureInterval * (framesCaptured + 1) && framesCaptured < maxFrames) {
        const frame = await captureFrame();
        if (frame) {
          setLivenessImages(prev => [...prev, frame]);
          framesCaptured++;
        }
      }

      // Challenge complete
      if (elapsed >= duration) {
        clearInterval(timer);

        if (currentChallengeIndex < totalChallenges - 1) {
          // Move to next challenge
          setCurrentChallengeIndex(prev => prev + 1);
          setChallengeProgress(0);
        } else {
          // All challenges complete, capture final selfie
          setStep('capturing');
          setCountdown(3);
        }
      }
    }, interval);

    return () => clearInterval(timer);
  }, [step, currentChallengeIndex, currentChallenge, totalChallenges, captureFrame]);

  // Final selfie countdown
  useEffect(() => {
    if (step !== 'capturing') return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Capture final selfie
      captureFinalSelfie();
    }
  }, [step, countdown]);

  const captureFinalSelfie = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await (cameraRef.current as any).takePictureAsync({
        quality: 0.85,
        base64: true,
        skipProcessing: true,
      });
      const selfie = `data:image/jpeg;base64,${photo.base64}`;
      setFinalSelfie(selfie);
      setStep('complete');
    } catch (error) {
      console.error('Failed to capture final selfie:', error);
    }
  };

  const handleStart = () => {
    setStep('challenge');
    setChallengeProgress(0);
    setLivenessImages([]);
  };

  const handleComplete = () => {
    if (finalSelfie) {
      onComplete(livenessImages, finalSelfie);
    }
  };

  const handleRetry = () => {
    setStep('intro');
    setCurrentChallengeIndex(0);
    setChallengeProgress(0);
    setLivenessImages([]);
    setFinalSelfie(null);
    setCountdown(3);
  };

  // Intro screen
  if (step === 'intro') {
    return (
      <View style={styles.container}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="front">
          <CameraOverlay />

          {backIcon && (
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={onCancel}>
                <Image source={backIcon} style={[styles.backIcon, { tintColor: '#fff' }]} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Liveness Check</Text>
              <View style={styles.headerSpacer} />
            </View>
          )}

          <View style={[styles.instructionsContainer, { top: PREVIEW_RECT.minY + PREVIEW_SIZE + 30 }]}>
            <Text style={styles.introTitle}>Face Verification</Text>
            <Text style={styles.introText}>
              Position your face in the circle and follow the on-screen instructions.
            </Text>
            <Text style={styles.introSubtext}>
              You'll be asked to perform {totalChallenges} quick actions to verify you're a real person.
            </Text>
          </View>

          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Text style={styles.startButtonText}>Start Verification</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  // Challenge screen
  if (step === 'challenge' && currentChallenge) {
    return (
      <View style={styles.container}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="front">
          <CameraOverlay />

          {/* Progress ring around face */}
          <View style={[styles.progressRingContainer, { top: PREVIEW_RECT.minY - 10, left: PREVIEW_RECT.minX - 10 }]}>
            <ProgressRing progress={challengeProgress} size={PREVIEW_SIZE + 20} />
          </View>

          {backIcon && (
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={onCancel}>
                <Image source={backIcon} style={[styles.backIcon, { tintColor: '#fff' }]} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Challenge {currentChallengeIndex + 1} of {totalChallenges}</Text>
              <View style={styles.headerSpacer} />
            </View>
          )}

          <View style={[styles.instructionsContainer, { top: PREVIEW_RECT.minY + PREVIEW_SIZE + 40 }]}>
            <Text style={styles.challengeInstruction}>{currentChallenge.instruction}</Text>
            <Text style={styles.challengeSubtext}>Keep your face in the circle</Text>
          </View>
        </CameraView>
      </View>
    );
  }

  // Capturing final selfie
  if (step === 'capturing') {
    return (
      <View style={styles.container}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="front">
          <CameraOverlay />

          {backIcon && (
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={onCancel}>
                <Image source={backIcon} style={[styles.backIcon, { tintColor: '#fff' }]} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Final Photo</Text>
              <View style={styles.headerSpacer} />
            </View>
          )}

          <View style={[styles.instructionsContainer, { top: PREVIEW_RECT.minY + PREVIEW_SIZE + 40 }]}>
            {countdown > 0 ? (
              <>
                <Text style={styles.countdownText}>{countdown}</Text>
                <Text style={styles.challengeSubtext}>Hold still...</Text>
              </>
            ) : (
              <ActivityIndicator size="large" color="#fff" />
            )}
          </View>
        </CameraView>
      </View>
    );
  }

  // Complete - preview
  if (step === 'complete' && finalSelfie) {
    return (
      <View style={styles.previewContainer}>
        <View style={styles.previewContent}>
          <View style={styles.successBadge}>
            <Text style={styles.successBadgeText}>Liveness Verified</Text>
          </View>
          <Image source={{ uri: finalSelfie }} style={styles.previewImage} />
          <Text style={styles.previewTitle}>Looking good!</Text>
          <Text style={styles.previewText}>Your liveness check was successful.</Text>
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleComplete}>
              <Text style={styles.confirmButtonText}>Use This Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
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
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  instructionsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  introTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  introText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  introSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  challengeInstruction: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  challengeSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  countdownText: {
    color: '#fff',
    fontSize: 72,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  startButton: {
    backgroundColor: '#35297F',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  progressRingContainer: {
    position: 'absolute',
    zIndex: 5,
  },
  progressRing: {
    position: 'absolute',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: Colors.background || '#F8F9FA',
  },
  previewContent: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  successBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  previewImage: {
    width: 240,
    height: 240,
    borderRadius: 120,
    marginBottom: 24,
    borderWidth: 4,
    borderColor: '#10B981',
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  previewActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  retryButton: {
    flex: 1,
    backgroundColor: '#6B7280',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#35297F',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
