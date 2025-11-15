# Rebuild Instructions for 16 KB Page Size Support

## Issue
Google Play Console shows: "Your app does not support 16 KB memory page sizes"

## Root Cause
The previous build was created **before** the 16 KB configuration was added. You need to create a **fresh build** with the updated configuration.

## Current Configuration Status ✅

Your app is now properly configured for 16 KB support:

- ✅ **Expo SDK**: 53.0.0 (includes AGP 8.5.1+)
- ✅ **NDK Version**: 28.0.12433564 (r28+ - 16 KB aligned by default)
- ✅ **Target SDK**: 35 (Android 15)
- ✅ **Compile SDK**: 35 (Android 15)
- ✅ **Uncompressed Libraries**: `expo.useLegacyPackaging=false`
- ✅ **Version Code**: 31

## Solution: Rebuild with Updated Configuration

### Step 1: Verify Configuration

Check that your `app.json` has the correct settings:

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
            "ndkVersion": "28.0.12433564"
          }
        }
      ]
    ]
  }
}
```

### Step 2: Clear Build Cache and Rebuild

**Important**: You MUST clear the build cache to ensure a fresh build with the new configuration.

```bash
# 1. Clear EAS build cache
eas build --platform android --profile production --clear-cache

# OR if you want to be extra sure, rebuild from scratch:
eas build --platform android --profile production --clear-cache --no-wait
```

### Step 3: Verify the Build

After the build completes:

1. **Download the AAB** from EAS
2. **Check the build logs** to verify:
   - NDK version: `28.0.12433564`
   - Target SDK: `35`
   - AGP version: `8.5.1+` (should be in Expo SDK 53)

### Step 4: Upload to Play Console

1. Upload the new AAB to Google Play Console
2. **Wait for Play Console to analyze** the bundle (this may take a few minutes)
3. Check the **App Bundle Explorer** or **Release** page
4. Look for: ✅ **"Supports 16 KB page sizes"**

## Why This Happens

- **Previous builds** were created before NDK r28 was configured
- **Build cache** may have cached old native libraries
- **Expo SDK 53** automatically supports 16 KB, but only if:
  - NDK r28+ is used ✅
  - Target SDK 35 ✅
  - Uncompressed libraries ✅

## Verification Commands

After downloading the AAB, you can verify 16 KB alignment:

```bash
# Extract and check alignment (requires Android SDK tools)
bundletool build-apks --bundle=app-release.aab --output=app.apks
unzip app.apks -d extracted
zipalign -c -P 16 -v 4 extracted/splits/base-master.apk
```

Expected: All files should show "OK" status.

## If Still Not Working

If Play Console still shows the error after rebuilding:

1. **Verify the build actually used the new configuration**:
   - Check EAS build logs
   - Look for NDK version in logs
   - Verify targetSdkVersion is 35

2. **Check for native dependencies**:
   - Some third-party libraries might not be 16 KB compatible
   - Update all native dependencies to latest versions
   - Check library documentation for 16 KB support

3. **Contact Expo Support**:
   - If Expo SDK 53 isn't automatically enabling 16 KB support
   - Provide build logs and configuration

## Important Notes

- ⚠️ **Do not upload old builds** - Only upload builds created AFTER these configuration changes
- ⚠️ **Clear cache** - Always use `--clear-cache` flag for the first build after configuration changes
- ⚠️ **Wait for analysis** - Play Console may take a few minutes to analyze the bundle
- ✅ **Version Code** - Make sure version code is incremented (currently: 31)

## Configuration Files

### app.json
```json
{
  "expo": {
    "android": {
      "versionCode": 31
    },
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 35,
            "targetSdkVersion": 35,
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

## Next Steps

1. ✅ Configuration is correct
2. ⏳ **Rebuild with `--clear-cache` flag**
3. ⏳ Upload new AAB to Play Console
4. ⏳ Verify 16 KB support status
5. ⏳ Submit for review

---

**Status**: Configuration complete, waiting for fresh build
**Action Required**: Rebuild with `--clear-cache` flag



