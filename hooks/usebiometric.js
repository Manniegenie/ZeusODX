import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Linking from 'expo-linking';
import { Platform, Alert } from 'react-native';

export const useBiometricAuth = () => {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      // Check if device supports biometric authentication
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);

      if (compatible) {
        // Check if user has enrolled biometrics
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsEnrolled(enrolled);

        // Get supported authentication types
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        setBiometricType(types);

        // Log status for debugging
        console.log('Biometric Support Status:', {
          hasHardware: compatible,
          isEnrolled: enrolled,
          supportedTypes: types
        });
      }
    } catch (error) {
      console.error('Error checking biometric support:', error);
    }
  };

  const authenticateWithBiometrics = async (options = {}) => {
    try {
      if (!isBiometricSupported) {
        return {
          success: false,
          error: 'Biometric authentication is not supported on this device'
        };
      }

      if (!isEnrolled) {
        return {
          success: false,
          error: 'No biometric credentials are enrolled on this device'
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options.promptMessage || 'Authenticate with biometrics',
        subtitle: options.subtitle || 'Use your fingerprint or face to continue',
        fallbackLabel: options.fallbackLabel || 'Enter PIN',
        cancelLabel: options.cancelLabel || 'Cancel',
        disableDeviceFallback: options.disableDeviceFallback || false,
        requireConfirmation: options.requireConfirmation || true,
      });

      return {
        success: result.success,
        error: result.error || null,
        warning: result.warning || null
      };

    } catch (error) {
      return {
        success: false,
        error: error.message || 'Authentication failed'
      };
    }
  };

  const getBiometricTypeName = () => {
    if (!biometricType || biometricType.length === 0) return 'Biometric';
    
    const types = biometricType.map(type => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return 'Fingerprint';
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return 'Face ID';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'Iris';
        default:
          return 'Biometric';
      }
    });
    
    return types.join(' or ');
  };

  const openBiometricSettings = async () => {
    try {
      let settingsUrl;
      
      if (Platform.OS === 'ios') {
        // iOS - can only open main settings or Face ID/Touch ID settings
        const biometricName = getBiometricTypeName();
        if (biometricName.includes('Face')) {
          // Try to open Face ID settings (iOS 14+)
          settingsUrl = 'App-Prefs:FACEID_PASSCODE';
        } else {
          // Try to open Touch ID settings
          settingsUrl = 'App-Prefs:TOUCHID_PASSCODE';
        }
        
        // Fallback to main settings if specific settings don't work
        const canOpen = await Linking.canOpenURL(settingsUrl);
        if (!canOpen) {
          settingsUrl = 'App-Prefs:root';
        }
      } else {
        // Android - can open specific biometric settings
        settingsUrl = 'android.settings.FINGERPRINT_ENROLL';
        
        // Alternative Android URLs to try:
        const androidUrls = [
          'android.settings.FINGERPRINT_ENROLL',
          'android.settings.SECURITY_SETTINGS',
          'android.settings.BIOMETRIC_ENROLL',
          'android.settings.SETTINGS'
        ];
        
        // Try each URL until we find one that works
        for (const url of androidUrls) {
          const canOpen = await Linking.canOpenURL(url);
          if (canOpen) {
            settingsUrl = url;
            break;
          }
        }
      }
      
      const opened = await Linking.openURL(settingsUrl);
      return opened;
      
    } catch (error) {
      console.error('Error opening biometric settings:', error);
      
      // Fallback: show instructions instead
      const instructions = getDetailedSetupInstructions();
      Alert.alert(
        'Settings Instructions',
        instructions,
        [{ text: 'OK' }]
      );
      
      return false;
    }
  };

  const getDetailedSetupInstructions = () => {
    const biometricName = getBiometricTypeName();
    
    if (Platform.OS === 'ios') {
      if (biometricName.includes('Face')) {
        return `To set up Face ID:
        
1. Open Settings
2. Tap "Face ID & Passcode"
3. Enter your passcode
4. Tap "Set Up Face ID"
5. Follow the on-screen instructions`;
      } else {
        return `To set up Touch ID:
        
1. Open Settings
2. Tap "Touch ID & Passcode"
3. Enter your passcode
4. Tap "Add a Fingerprint"
5. Follow the on-screen instructions`;
      }
    } else {
      return `To set up biometric authentication:
      
1. Open Settings
2. Go to Security (or Security & Privacy)
3. Tap "Fingerprint" or "Biometrics"
4. Add your fingerprint or set up face unlock
5. Follow the on-screen instructions`;
    }
  };

  const getSetupInstructions = () => {
    if (!isBiometricSupported) {
      return 'This device does not support biometric authentication.';
    }
    
    if (!isEnrolled) {
      const biometricName = getBiometricTypeName();
      if (biometricName.includes('Face')) {
        return 'Please set up Face ID in Settings → Face ID & Passcode to use biometric authentication.';
      } else if (biometricName.includes('Fingerprint')) {
        return 'Please set up Fingerprint in Settings → Security → Fingerprint to use biometric authentication.';
      }
      return 'Please set up biometric authentication in your device settings.';
    }
    
    return null; // All good, no instructions needed
  };

  return {
    isBiometricSupported,
    isEnrolled,
    biometricType,
    authenticateWithBiometrics,
    getBiometricTypeName,
    checkBiometricSupport,
    getSetupInstructions,
    openBiometricSettings,
    getDetailedSetupInstructions
  };
};