# Verify 16 KB Build Configuration

## Critical Steps to Fix 16 KB Support

Based on Google's official documentation, here's what you need to verify:

### 1. Verify Expo SDK 53 Uses AGP 8.5.1+

According to Google: **"If you update your tools to the latest versions (AGP version 8.5.1 or higher and NDK version r28 or higher) and use 16 KB-compatible prebuilt dependencies, then your app is 16 KB compatible by default."**

**Action Required**: Verify that Expo SDK 53.0.23 is using AGP 8.5.1+

### 2. Current Configuration ✅

Your configuration is correct:
- ✅ NDK Version: `28.0.12433564` (r28+ - 16 KB aligned by default)
- ✅ Target SDK: `35` (Android 15)
- ✅ Compile SDK: `35` (Android 15)
- ✅ Uncompressed Libraries: `expo.useLegacyPackaging=false`
- ✅ Expo SDK: `53.0.23`

### 3. Rebuild with Cache Clear

**CRITICAL**: You MUST rebuild with cache cleared:

```bash
eas build --platform android --profile production --clear-cache
```

### 4. Verify Build Logs

After building, check the EAS build logs for:

1. **NDK Version**: Should show `28.0.12433564`
   ```
   NDK version: 28.0.12433564
   ```

2. **AGP Version**: Should show `8.5.1` or higher
   ```
   Android Gradle Plugin version: 8.5.1
   ```

3. **Target SDK**: Should show `35`
   ```
   targetSdkVersion: 35
   ```

### 5. Verify AAB After Build

After downloading the AAB from EAS:

```bash
# Install Android SDK Build Tools 35.0.0+ and NDK r28+
# Then verify alignment:

# Extract AAB
bundletool build-apks --bundle=app-release.aab --output=app.apks
unzip app.apks -d extracted

# Check alignment
zipalign -c -P 16 -v 4 extracted/splits/base-master.apk
```

Expected output: All files should show "OK" status.

### 6. Check for Non-Compliant Dependencies

Some third-party libraries might not be 16 KB compatible:

1. **Check native libraries in APK**:
   ```bash
   unzip app-release.apk -d extracted
   find extracted/lib -name "*.so" -type f
   ```

2. **Verify each library alignment**:
   ```bash
   # For each .so file, check alignment
   llvm-objdump -p lib/arm64-v8a/libhermes.so | grep LOAD
   # Should show: align 2**14 (16 KB = 16384)
   ```

3. **Update problematic libraries**:
   - Update all React Native dependencies to latest versions
   - Check library documentation for 16 KB support
   - Contact library maintainers if needed

### 7. Potential Issues

#### Issue 1: Expo SDK 53 Might Not Use AGP 8.5.1+

**Solution**: Check if Expo SDK 53.0.23 includes AGP 8.5.1+:
- Check Expo release notes
- Verify in EAS build logs
- If not, you may need to wait for Expo SDK update or use a workaround

#### Issue 2: Prebuilt Native Libraries

**Solution**: Check if any prebuilt libraries are not 16 KB aligned:
- React Native libraries (Hermes, Reanimated, etc.)
- Third-party SDKs
- Update to latest versions

#### Issue 3: Build Cache

**Solution**: Always use `--clear-cache` flag:
```bash
eas build --platform android --profile production --clear-cache
```

### 8. Alternative: Check Expo SDK Version

If Expo SDK 53 doesn't include AGP 8.5.1+, you may need to:

1. **Update to latest Expo SDK** (if available):
   ```bash
   npm install expo@latest
   ```

2. **Check Expo release notes** for AGP version support

3. **Contact Expo Support** if AGP 8.5.1+ is not included

### 9. Manual Verification

After building, verify the configuration:

1. **Download AAB from EAS**
2. **Extract and check**:
   ```bash
   # Extract AAB
   bundletool build-apks --bundle=app-release.aab --output=app.apks
   unzip app.apks -d extracted
   
   # Check native libraries
   find extracted -name "*.so" -type f
   
   # Verify alignment (requires NDK r28+)
   llvm-objdump -p extracted/splits/base-master.apk/lib/arm64-v8a/libhermes.so | grep LOAD
   # Should show: align 2**14 (16384 = 16 KB)
   ```

3. **Check zipalign**:
   ```bash
   zipalign -c -P 16 -v 4 extracted/splits/base-master.apk
   # Should show: "Verification successful"
   ```

### 10. Next Steps

1. ✅ **Verify configuration** (already done)
2. ⏳ **Rebuild with `--clear-cache`**
3. ⏳ **Check EAS build logs** for NDK/AGP versions
4. ⏳ **Verify AAB alignment** using zipalign
5. ⏳ **Upload new AAB** to Play Console
6. ⏳ **Wait for Play Console analysis**
7. ⏳ **Verify 16 KB support status**

### 11. If Still Not Working

If Play Console still shows the error after rebuilding:

1. **Check EAS build logs**:
   - Verify NDK version: `28.0.12433564`
   - Verify AGP version: `8.5.1+`
   - Verify targetSdkVersion: `35`

2. **Verify AAB manually**:
   - Download AAB from EAS
   - Check alignment using zipalign
   - Verify native libraries are 16 KB aligned

3. **Check for native dependencies**:
   - List all .so files in AAB
   - Verify each library is 16 KB aligned
   - Update problematic libraries

4. **Contact Expo Support**:
   - If Expo SDK 53 doesn't include AGP 8.5.1+
   - Provide build logs and configuration
   - Request guidance on 16 KB support

### 12. Expected Behavior

After rebuilding with the correct configuration:

1. **EAS Build Logs** should show:
   - NDK version: `28.0.12433564`
   - AGP version: `8.5.1+` (if supported by Expo SDK 53)
   - Target SDK: `35`

2. **AAB Verification** should show:
   - All native libraries aligned to 16 KB
   - zipalign verification successful

3. **Play Console** should show:
   - ✅ "Supports 16 KB page sizes"

---

**Status**: Configuration correct, waiting for fresh build
**Action Required**: Rebuild with `--clear-cache` and verify build logs



