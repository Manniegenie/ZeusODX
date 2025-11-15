# Rebuild Command for 16 KB Page Size Support

## Rebuild Command with npx

```bash
cd /Users/mac/Projects/ZeusODX
npx eas-cli build --platform android --profile production --clear-cache
```

## Alternative: Using npx eas (shorter)

```bash
cd /Users/mac/Projects/ZeusODX
npx eas build --platform android --profile production --clear-cache
```

## What This Does

1. **Clears build cache** - Ensures fresh build with new NDK r28 configuration
2. **Uses NDK r28** - Compiles all native libraries with 16 KB alignment
3. **Target SDK 35** - Android 15 requirement
4. **Uncompressed libraries** - Required for 16 KB support

## After Build Completes

1. **Download AAB** from EAS dashboard
2. **Upload to Play Console** → Release → Production
3. **Wait 5-10 minutes** for Play Console analysis
4. **Verify status** - Should show ✅ "Supports 16 KB page sizes"

## Full Command (Copy-Paste Ready)

```bash
cd /Users/mac/Projects/ZeusODX && npx eas build --platform android --profile production --clear-cache
```

---

**Status**: Configuration correct, ready for rebuild
**Action**: Run the command above



