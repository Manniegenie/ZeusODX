# Fix Play Console Errors - Complete Solution

## Current Errors

1. **Error 1**: APK shadowed by higher version codes - Need to remove old APKs
2. **Error 2**: App doesn't support 16 KB page sizes (old build)
3. **Error 3**: Version code 70 doesn't support 16 KB page sizes

## Root Cause

The build with version code 70 was created, but it **didn't use the NDK r28 configuration** properly. This means:
1. The build cache might not have been cleared
2. Expo SDK 53 might not be using AGP 8.5.1+ correctly
3. The NDK version might not have been applied during the build

## Solution: Complete Fix

### Step 1: Remove Old APKs from Play Console

1. **Go to Play Console** → Release → Production
2. **Click on the release** that has errors
3. **Remove all APKs/AABs** with version codes lower than 70
4. **Keep only version code 70** (or remove it too if it doesn't support 16 KB)
5. **Save changes**

### Step 2: Verify Current Configuration

Your `app.json` has:
- ✅ `versionCode: 31` (but EAS autoIncrement made it 70)
- ✅ `ndkVersion: "28.0.12433564"`
- ✅ `targetSdkVersion: 35`
- ✅ `compileSdkVersion: 35`

**Problem**: Even though config is correct, the build might not have used it.

### Step 3: Check EAS Build Logs

**CRITICAL**: Check the EAS build logs for version code 70:

1. **Go to EAS Dashboard** → Builds
2. **Find the build with version code 70**
3. **Check the build logs** for:
   - NDK version: Should show `28.0.12433564`
   - Target SDK: Should show `35`
   - AGP version: Should show `8.5.1+`

**If the logs show**:
- ❌ NDK version is NOT `28.0.12433564` → Build didn't use the config
- ❌ Target SDK is NOT `35` → Build didn't use the config
- ❌ AGP version is NOT `8.5.1+` → Expo SDK 53 might not support it

### Step 4: Update Version Code and Rebuild

Since version code 70 doesn't support 16 KB, we need to rebuild:

1. **Update version code** in `app.json` to `71` (higher than 70)
2. **Rebuild with cache clear**:
   ```bash
   cd /Users/mac/Projects/ZeusODX
   npx eas build --platform android --profile production --clear-cache
   ```

### Step 5: Verify Build Logs After Rebuild

After the new build completes:

1. **Check EAS build logs** for:
   - ✅ NDK version: `28.0.12433564`
   - ✅ Target SDK: `35`
   - ✅ AGP version: `8.5.1+` (if shown)

2. **If NDK version is correct**:
   - ✅ Build should support 16 KB
   - ✅ Upload new AAB to Play Console

3. **If NDK version is NOT correct**:
   - ❌ Build configuration isn't being applied
   - ❌ Need to investigate why

## Alternative: Disable Auto Increment

If EAS autoIncrement is causing issues, we can disable it:

### Option 1: Disable Auto Increment in eas.json

```json
{
  "build": {
    "production": {
      "extends": "base",
      "autoIncrement": false,  // Change from true to false
      "env": {
        "NODE_ENV": "production"
      },
      "channel": "production",
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Option 2: Manually Set Version Code

Update `app.json` to set a specific version code:

```json
{
  "expo": {
    "android": {
      "versionCode": 71  // Set higher than 70
    }
  }
}
```

## Complete Fix Steps

### Step 1: Update Version Code

Update `app.json`:

```json
{
  "expo": {
    "android": {
      "versionCode": 71
    }
  }
}
```

### Step 2: Remove Old APKs from Play Console

1. Go to Play Console → Release → Production
2. Remove all APKs/AABs with version codes < 71
3. Save changes

### Step 3: Rebuild with Cache Clear

```bash
cd /Users/mac/Projects/ZeusODX
npx eas build --platform android --profile production --clear-cache
```

### Step 4: Verify Build Logs

After build completes, check EAS build logs:
- NDK version: Should be `28.0.12433564`
- Target SDK: Should be `35`
- Version code: Should be `71`

### Step 5: Upload New AAB

1. Download new AAB from EAS
2. Upload to Play Console
3. Wait for analysis (5-10 minutes)
4. Verify 16 KB support status

## If Build Still Doesn't Support 16 KB

If the new build still doesn't support 16 KB, check:

### 1. Verify NDK Version in Build Logs

Check EAS build logs for:
```
NDK version: 28.0.12433564
```

If it's NOT `28.0.12433564`, the configuration isn't being applied.

### 2. Verify Target SDK in Build Logs

Check EAS build logs for:
```
targetSdkVersion: 35
```

If it's NOT `35`, the configuration isn't being applied.

### 3. Check Expo SDK 53 AGP Version

Expo SDK 53 should include AGP 8.5.1+, but we need to verify:
- Check EAS build logs for AGP version
- If AGP < 8.5.1, Expo SDK 53 might not support 16 KB yet
- Contact Expo Support if needed

### 4. Check Native Dependencies

Some native dependencies might not be 16 KB compatible:
- Update all React Native dependencies to latest versions
- Check library documentation for 16 KB support
- Verify Hermes, Reanimated, and other native libraries

## Quick Fix Summary

1. **Update version code** to `71` in `app.json`
2. **Remove old APKs** from Play Console
3. **Rebuild with `--clear-cache`**:
   ```bash
   npx eas build --platform android --profile production --clear-cache
   ```
4. **Verify build logs** show NDK r28 and target SDK 35
5. **Upload new AAB** to Play Console
6. **Wait for analysis** and verify 16 KB support

---

**Status**: Need to verify build logs and rebuild
**Action Required**: Update version code, remove old APKs, rebuild



