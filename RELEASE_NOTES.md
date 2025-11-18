# Release Notes - Version 1.0.1 (Build 31)

## Google Play Compliance Update

This release addresses Google Play Store policy compliance issues and improves app stability.

## 🔒 Privacy & Security Improvements

- **Removed unused permissions**: Eliminated unnecessary permissions (audio, storage, overlay) that could trigger policy violations
- **Enhanced data security**: Disabled app backup to prevent unauthorized data access
- **Permission optimization**: Only essential permissions are now requested, improving user trust

## 🐛 Bug Fixes

- Fixed duplicate style keys that could cause crashes in KYC verification screens
- Fixed import path case sensitivity issues that could break builds on Linux systems
- Updated deprecated Clipboard API to modern implementation
- Fixed unescaped characters in JSX that could cause rendering issues
- Improved hook dependency management to prevent stale data bugs

## 🔧 Technical Improvements

- Configured module aliases for better build stability
- Fixed critical hook dependencies in notification and app initialization flows
- Improved code quality with better import organization
- Enhanced error handling in critical user flows

## 📱 What's Changed

### Permissions
- ✅ Camera: Still required for KYC identity verification
- ✅ Biometric: Still required for secure authentication
- ✅ Internet: Required for app functionality
- ✅ Notifications: Required for transaction alerts

### Removed
- ❌ Audio recording (not used)
- ❌ External storage access (using secure alternatives)
- ❌ System overlay (not needed)

## 🧪 Testing Recommendations

Before deploying, please test:
1. ✅ Biometric authentication flow
2. ✅ KYC verification with camera
3. ✅ Notification delivery and handling
4. ✅ Gift card trading
5. ✅ All deposit/withdrawal flows
6. ✅ App startup and navigation

## 📋 Google Play Console Checklist

Before resubmitting:
- [ ] Update Data Safety form with new permission set
- [ ] Verify privacy policy URL is accessible
- [ ] Update permission declarations
- [ ] Review pre-launch report
- [ ] Test on multiple Android versions (7.0+)

## 🚀 Next Steps

1. Build release: `eas build --platform android --profile production`
2. Test on physical devices
3. Submit to Google Play Console
4. Complete Data Safety form updates
5. Monitor for any policy issues

---

**Version**: 1.0.1  
**Version Code**: 31  
**Target SDK**: 35 (Android 15)  
**Min SDK**: 24 (Android 7.0)




