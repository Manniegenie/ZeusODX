/**
 * useCameraPermission - Production-grade camera permission hook
 *
 * Handles camera permissions with proper UX flow:
 * 1. Pre-permission dialog explaining why camera is needed
 * 2. System permission request
 * 3. Handles "denied permanently" state (directs to settings)
 * 4. Platform-specific handling for Android/iOS
 */

import { useCameraPermissions, PermissionStatus } from 'expo-camera';
import * as Linking from 'expo-linking';
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';

export type CameraPermissionState =
  | 'undetermined'
  | 'granted'
  | 'denied'
  | 'denied_permanently'
  | 'requesting';

interface UseCameraPermissionResult {
  /** Current permission state */
  permissionState: CameraPermissionState;
  /** Whether camera is ready to use */
  isGranted: boolean;
  /** Whether permission request is in progress */
  isRequesting: boolean;
  /** Request camera permission with pre-permission dialog */
  requestCameraAccess: () => Promise<boolean>;
  /** Check current permission status without requesting */
  checkPermission: () => Promise<CameraPermissionState>;
}

const PERMISSION_MESSAGES = {
  prePermission: {
    title: 'Camera Access Required',
    message: 'ZeusODX needs camera access to verify your identity through facial recognition. This ensures secure and accurate verification of your account.',
    allowButton: 'Allow Camera',
    cancelButton: 'Not Now',
  },
  denied: {
    title: 'Camera Permission Denied',
    message: 'Camera access was denied. To continue with verification, please allow camera access.',
    retryButton: 'Try Again',
    cancelButton: 'Cancel',
  },
  deniedPermanently: {
    title: 'Camera Access Blocked',
    message: 'Camera access has been blocked. Please enable camera permission in your device settings to continue with identity verification.',
    settingsButton: 'Open Settings',
    cancelButton: 'Cancel',
  },
};

export function useCameraPermission(): UseCameraPermissionResult {
  const [permission, requestPermission] = useCameraPermissions();
  const [isRequesting, setIsRequesting] = useState(false);

  const getPermissionState = useCallback((): CameraPermissionState => {
    if (!permission) return 'undetermined';
    if (permission.granted) return 'granted';
    if (permission.canAskAgain === false) return 'denied_permanently';
    if (permission.status === PermissionStatus.DENIED) return 'denied';
    return 'undetermined';
  }, [permission]);

  const checkPermission = useCallback(async (): Promise<CameraPermissionState> => {
    return getPermissionState();
  }, [getPermissionState]);

  const openSettings = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Failed to open settings:', error);
      Alert.alert(
        'Unable to Open Settings',
        'Please manually open your device settings and enable camera permission for ZeusODX.'
      );
    }
  }, []);

  const showPrePermissionDialog = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        PERMISSION_MESSAGES.prePermission.title,
        PERMISSION_MESSAGES.prePermission.message,
        [
          {
            text: PERMISSION_MESSAGES.prePermission.cancelButton,
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: PERMISSION_MESSAGES.prePermission.allowButton,
            onPress: () => resolve(true),
          },
        ],
        { cancelable: false }
      );
    });
  }, []);

  const showDeniedPermanentlyDialog = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        PERMISSION_MESSAGES.deniedPermanently.title,
        PERMISSION_MESSAGES.deniedPermanently.message,
        [
          {
            text: PERMISSION_MESSAGES.deniedPermanently.cancelButton,
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: PERMISSION_MESSAGES.deniedPermanently.settingsButton,
            onPress: async () => {
              await openSettings();
              resolve(false);
            },
          },
        ],
        { cancelable: false }
      );
    });
  }, [openSettings]);

  const requestCameraAccess = useCallback(async (): Promise<boolean> => {
    if (isRequesting) return false;

    setIsRequesting(true);

    try {
      // Check if already granted
      if (permission?.granted) {
        return true;
      }

      // Check if permanently denied
      if (permission?.canAskAgain === false) {
        await showDeniedPermanentlyDialog();
        return false;
      }

      // Show pre-permission dialog for better UX
      const userAgreed = await showPrePermissionDialog();
      if (!userAgreed) {
        return false;
      }

      // Request actual permission
      const result = await requestPermission();

      if (result?.granted) {
        return true;
      }

      // Handle denial
      if (result?.canAskAgain === false) {
        // Permanently denied - direct to settings
        await showDeniedPermanentlyDialog();
        return false;
      }

      // Temporarily denied - user can try again
      Alert.alert(
        PERMISSION_MESSAGES.denied.title,
        PERMISSION_MESSAGES.denied.message
      );
      return false;

    } catch (error) {
      console.error('Camera permission request failed:', error);
      Alert.alert(
        'Permission Error',
        'Failed to request camera permission. Please try again.'
      );
      return false;
    } finally {
      setIsRequesting(false);
    }
  }, [permission, isRequesting, requestPermission, showPrePermissionDialog, showDeniedPermanentlyDialog]);

  return {
    permissionState: isRequesting ? 'requesting' : getPermissionState(),
    isGranted: permission?.granted ?? false,
    isRequesting,
    requestCameraAccess,
    checkPermission,
  };
}

export default useCameraPermission;
