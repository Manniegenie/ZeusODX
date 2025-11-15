# Google Play Privacy & Data Safety Compliance

## Summary of Changes

This document outlines the privacy and security improvements made to ensure Google Play Store compliance.

## Android Manifest Changes

### Removed Permissions
The following permissions were removed from `AndroidManifest.xml` as they were not used and could trigger policy violations:

- `READ_EXTERNAL_STORAGE` - Not needed (using expo-document-picker)
- `WRITE_EXTERNAL_STORAGE` - Not needed (using expo-sharing)
- `RECORD_AUDIO` - Not used in the app
- `SYSTEM_ALERT_WINDOW` - Not required for core functionality

### Security Improvements
- Set `android:allowBackup="false"` to prevent unauthorized data backup
- Maintained only essential permissions:
  - `INTERNET` - Required for API calls
  - `CAMERA` - Required for KYC identity verification
  - `ACCESS_NETWORK_STATE` - Required for network status checks
  - `USE_BIOMETRIC` / `USE_FINGERPRINT` - Required for biometric authentication
  - `VIBRATE` / `WAKE_LOCK` - Required for notifications
  - `RECEIVE_BOOT_COMPLETED` - Required for scheduled notifications
  - `com.google.android.c2dm.permission.RECEIVE` - Required for Firebase Cloud Messaging

## Google Play Console Updates Required

### 1. Data Safety Section
Update the following in Google Play Console → App Content → Data Safety:

**Data Collection:**
- ✅ **Personal Identifiers**: Email, Phone Number, Username
  - Purpose: Account creation and authentication
  - Required: Yes
  - Shared: No
  
- ✅ **Financial Information**: Bank account details, transaction history
  - Purpose: Payment processing and transaction management
  - Required: Yes
  - Shared: No (only with payment processors)

- ✅ **Biometric Data**: Face photos for KYC verification
  - Purpose: Identity verification (KYC compliance)
  - Required: Yes (for KYC levels 2+)
  - Shared: No (only with verification service providers)

- ✅ **Device Information**: Device ID, app version
  - Purpose: App functionality and analytics
  - Required: Yes
  - Shared: No

**Data Security:**
- ✅ Data is encrypted in transit (HTTPS/TLS)
- ✅ Data is encrypted at rest
- ✅ Users can request data deletion

### 2. Privacy Policy URL
Ensure your privacy policy URL is:
- ✅ Accessible and up-to-date
- ✅ Covers all data collection practices
- ✅ Includes information about:
  - Data collection and usage
  - Third-party services (Firebase, payment processors)
  - User rights (access, deletion, export)
  - Cookie/tracking policies (if applicable)

### 3. Permissions Declaration
In the Play Console, declare:
- ✅ **Camera**: Used for identity verification (KYC) and QR code scanning
- ✅ **Biometric**: Used for secure authentication
- ✅ **Internet**: Required for app functionality
- ✅ **Notifications**: Used for transaction alerts and updates

### 4. Target API Level
- ✅ **Current**: API 35 (Android 15)
- ✅ **Minimum**: API 24 (Android 7.0)
- ✅ Compliant with Google Play requirements

## Code Quality Improvements

### Fixed Issues
1. ✅ Removed unused permissions from manifest
2. ✅ Fixed duplicate style keys causing crashes
3. ✅ Escaped special characters in JSX text
4. ✅ Fixed import path case sensitivity issues
5. ✅ Updated Clipboard API usage (deprecated → modern)
6. ✅ Configured module aliases for better build stability
7. ✅ Fixed hook dependency warnings in critical flows

### Remaining Warnings (Non-Blocking)
- Hook dependency warnings in deposit screens (cosmetic, doesn't affect functionality)
- Unused variable warnings (code cleanup, doesn't affect runtime)

## Testing Checklist

Before resubmitting to Google Play:

- [ ] Test biometric authentication flow
- [ ] Test KYC verification with camera
- [ ] Test notification delivery and tap handling
- [ ] Test gift card trading flow
- [ ] Test all deposit/withdrawal flows
- [ ] Verify no crashes on Android 7.0+ devices
- [ ] Test on multiple screen sizes
- [ ] Verify permissions are requested only when needed

## Version Information

- **Current Version**: 1.0.0
- **Version Code**: 30
- **Next Version Code**: 31 (increment before resubmission)

## Build Instructions

1. Update `app.json` versionCode to 31
2. Run `npm run lint` to verify no blocking errors
3. Build release APK/AAB: `eas build --platform android --profile production`
4. Test on physical devices
5. Submit to Google Play Console
6. Complete Data Safety form with updated information
7. Monitor pre-launch report for any issues

## Support

If you encounter any issues during submission:
1. Check Google Play Console → Policy → Policy status
2. Review pre-launch report for crashes
3. Verify all permissions are properly declared
4. Ensure privacy policy URL is accessible



