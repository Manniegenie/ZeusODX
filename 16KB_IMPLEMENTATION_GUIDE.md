# 16 KB Page Size Support - Clean Implementation Guide

## Overview

Based on Google's official documentation and best practices, this guide provides the cleanest implementation for 16 KB page size support in Expo/React Native apps.

## Requirements (Google's Official Documentation)

According to Google:
- **AGP 8.5.1+** is required for 16 KB support with uncompressed libraries
- **NDK r28+** compiles 16 KB-aligned by default
- **Target SDK 35** (Android 15) is required
- **Uncompressed libraries** are required (useLegacyPackaging=false)

> **Key Quote from Google**: "If you update your tools to the latest versions (AGP version 8.5.1 or higher and NDK version r28 or higher) and use 16 KB-compatible prebuilt dependencies, then your app is 16 KB compatible by default."

## Current Configuration ✅

Your configuration is **correct**:

### app.json
```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 35,
            "targetSdkVersion": 35,
            "minSdkVersion": 24,
            "ndkVersion": "28.0.12433564"
          }
        }
      ]
    ]
  }
}
```

### android/gradle.properties
```
expo.useLegacyPackaging=false
android.compileSdkVersion=35
android.targetSdkVersion=35
android.ndkVersion=28.0.12433564
```

## How It Works

### NDK r28+ (Automatic)
- **NDK r28 and higher compile 16 KB-aligned by default**
- No additional configuration needed
- All native libraries are automatically aligned to 16 KB

### Expo SDK 53
- Should include **AGP 8.5.1+** (need to verify)
- Automatically handles zipalign for uncompressed libraries
- Uses NDK r28+ when configured

### Configuration Flow
1. **expo-build-properties** plugin sets NDK version
2. **gradle.properties** sets `useLegacyPackaging=false`
3. **NDK r28+** compiles all native libraries with 16 KB alignment
4. **AGP 8.5.1+** (if included in Expo SDK 53) handles zip alignment

## Clean Implementation Steps

### Step 1: Verify Configuration

Your configuration is already correct:

- ✅ **NDK Version**: `28.0.12433564` (r28+)
- ✅ **Target SDK**: `35` (Android 15)
- ✅ **Compile SDK**: `35` (Android 15)
- ✅ **Uncompressed Libraries**: `expo.useLegacyPackaging=false`

### Step 2: Rebuild with Cache Clear

**CRITICAL**: Rebuild with cache cleared to ensure fresh build:

```bash
eas build --platform android --profile production --clear-cache
```

### Step 3: Verify Build Logs

After build completes, check EAS build logs for:

1. **NDK Version**: Should show `28.0.12433564`
2. **Target SDK**: Should show `35`
3. **AGP Version**: Should show `8.5.1+` (if Expo SDK 53 supports it)

### Step 4: Upload and Verify

1. Upload new AAB to Play Console
2. Wait for analysis (5-10 minutes)
3. Verify 16 KB support status

## Verification (Optional)

If you have Android SDK tools, you can verify alignment:

```bash
# Download AAB from EAS
# Extract and verify
bundletool build-apks --bundle=app-release.aab --output=app.apks
unzip app.apks -d extracted

# Check alignment
zipalign -c -P 16 -v 4 extracted/splits/base-master.apk
```

Expected: All files should show "OK" status.

## If Expo SDK 53 Doesn't Include AGP 8.5.1+

If Expo SDK 53 doesn't include AGP 8.5.1+, you have two options:

### Option 1: Wait for Expo SDK Update (Recommended)

- Check Expo release notes for AGP 8.5.1+ support
- Update Expo SDK when available
- This is the cleanest solution

### Option 2: Use Compressed Libraries (Not Recommended)

⚠️ **Warning**: This increases app size and may cause installation issues.

If absolutely necessary, you can use compressed libraries:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "packagingOptions": {
              "jniLibs": {
                "useLegacyPackaging": true
              }
            }
          }
        }
      ]
    ]
  }
}
```

**Note**: This is NOT recommended. It's better to wait for Expo SDK update or verify that Expo SDK 53 includes AGP 8.5.1+.

## Expected Behavior

After rebuilding with correct configuration:

1. **EAS Build Logs** should show:
   - NDK: `28.0.12433564`
   - Target SDK: `35`
   - AGP: `8.5.1+` (if Expo SDK 53 supports it)

2. **AAB Verification** should show:
   - All native libraries aligned to 16 KB
   - zipalign verification successful

3. **Play Console** should show:
   - ✅ "Supports 16 KB page sizes"

## Troubleshooting

### Issue: Play Console Still Shows Error

**Possible Causes**:
1. Old build uploaded (rebuild required)
2. Expo SDK 53 doesn't include AGP 8.5.1+
3. Native dependency not 16 KB compatible

**Solutions**:
1. Rebuild with `--clear-cache` flag
2. Check EAS build logs for NDK version
3. Verify AGP version (if shown in logs)
4. Update native dependencies to latest versions
5. Contact Expo Support if needed

### Issue: Build Fails

**Possible Causes**:
1. NDK version mismatch
2. Configuration error

**Solutions**:
1. Verify NDK version in app.json
2. Check expo-build-properties version
3. Clear cache and rebuild

## Best Practices

1. **Always use `--clear-cache`** for first build after configuration changes
2. **Verify build logs** after building
3. **Wait for Play Console analysis** (5-10 minutes)
4. **Test on 16 KB device** if possible
5. **Update native dependencies** to latest versions

## Configuration Summary

| Setting | Value | Status |
|---------|-------|--------|
| NDK Version | 28.0.12433564 (r28+) | ✅ Correct |
| Target SDK | 35 (Android 15) | ✅ Correct |
| Compile SDK | 35 (Android 15) | ✅ Correct |
| Uncompressed Libraries | useLegacyPackaging=false | ✅ Correct |
| Expo SDK | 53.0.23 | ✅ Latest |
| AGP Version | 8.5.1+ (if Expo SDK 53 supports) | ❓ Need to verify |

## Next Steps

1. ✅ Configuration is correct (already done)
2. ⏳ **Rebuild with `--clear-cache`**:
   ```bash
   eas build --platform android --profile production --clear-cache
   ```
3. ⏳ Check EAS build logs for NDK/AGP versions
4. ⏳ Upload new AAB to Play Console
5. ⏳ Wait for analysis (5-10 minutes)
6. ⏳ Verify 16 KB support status

---

**Status**: Configuration correct, ready for rebuild
**Action Required**: Rebuild with `--clear-cache` flag




