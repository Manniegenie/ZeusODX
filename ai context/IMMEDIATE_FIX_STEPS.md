# Immediate Fix Steps for Play Console Errors

## Current Issues

1. ❌ **Error 1**: APK shadowed by higher version codes - Need to remove old APKs
2. ❌ **Error 2**: App doesn't support 16 KB page sizes (old build)
3. ❌ **Error 3**: Version code 70 doesn't support 16 KB page sizes

## Root Cause

The build with version code 70 was created, but it **didn't use the NDK r28 configuration** properly. This means the build needs to be redone with the correct configuration.

## Immediate Fix Steps

### Step 1: Update Version Code ✅

I've updated your `app.json` to set version code to `71` (higher than 70).

### Step 2: Remove Old APKs from Play Console

1. **Go to Google Play Console** → Release → Production
2. **Click on the release** that has errors
3. **Remove all APKs/AABs** with version codes lower than 71
   - This includes version code 70 and any older versions
4. **Save changes**

**Important**: Keep the release empty for now. We'll upload the new build after rebuilding.

### Step 3: Rebuild with Cache Clear

**CRITICAL**: Rebuild with cache cleared to ensure the NDK r28 configuration is used:

```bash
cd /Users/mac/Projects/ZeusODX
npx eas build --platform android --profile production --clear-cache
```

### Step 4: Verify Build Logs

After the build completes, **check EAS build logs** for:

1. **NDK Version**: Should show `28.0.12433564`
   ```
   NDK version: 28.0.12433564
   ```

2. **Target SDK**: Should show `35`
   ```
   targetSdkVersion: 35
   ```

3. **Version Code**: Should show `71`
   ```
   versionCode: 71
   ```

4. **AGP Version**: Should show `8.5.1+` (if Expo SDK 53 supports it)
   ```
   Android Gradle Plugin version: 8.5.1
   ```

### Step 5: Upload New AAB

1. **Download new AAB** from EAS dashboard
2. **Upload to Google Play Console** → Release → Production
3. **Wait 5-10 minutes** for Play Console analysis
4. **Verify 16 KB support status**

## If Build Still Doesn't Support 16 KB

If the new build (version code 71) still doesn't support 16 KB, check:

### 1. Verify NDK Version in Build Logs

**Check EAS build logs** for:
- NDK version: Should be `28.0.12433564`
- If it's NOT `28.0.12433564`, the configuration isn't being applied

### 2. Verify Target SDK in Build Logs

**Check EAS build logs** for:
- Target SDK: Should be `35`
- If it's NOT `35`, the configuration isn't being applied

### 3. Check Expo SDK 53 AGP Version

**Expo SDK 53 should include AGP 8.5.1+**, but we need to verify:
- Check EAS build logs for AGP version
- If AGP < 8.5.1, Expo SDK 53 might not support 16 KB yet
- Contact Expo Support if needed

### 4. Possible Issue: Expo SDK 53 Doesn't Support 16 KB Yet

If Expo SDK 53 doesn't include AGP 8.5.1+, you might need to:
- Wait for Expo SDK update
- Check Expo release notes for 16 KB support
- Contact Expo Support for guidance

## Quick Action Checklist

- [x] ✅ Update version code to 71 (done)
- [ ] ⏳ Remove old APKs from Play Console
- [ ] ⏳ Rebuild with `--clear-cache`:
  ```bash
  npx eas build --platform android --profile production --clear-cache
  ```
- [ ] ⏳ Verify build logs show NDK r28 and target SDK 35
- [ ] ⏳ Upload new AAB to Play Console
- [ ] ⏳ Wait for analysis (5-10 minutes)
- [ ] ⏳ Verify 16 KB support status

## Expected Result

After following these steps:

1. **Old APKs removed** from Play Console
2. **New build created** with version code 71
3. **Build logs show** NDK r28 and target SDK 35
4. **New AAB uploaded** to Play Console
5. **16 KB support verified** in Play Console

---

**Status**: Version code updated to 71, ready for rebuild
**Action Required**: Remove old APKs, rebuild, upload new AAB




