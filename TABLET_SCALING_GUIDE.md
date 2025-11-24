# Tablet & Large Screen Scaling Guide

## Overview

The app now uses `react-native-size-matters` - the **industry standard** for responsive scaling in React Native apps. This provides better tablet support, especially for iPads.

## How It Works

### Scaling Functions

- **`Layout.scale(size)`** - Horizontal scaling (use for widths, border radius)
- **`Layout.scaleVertical(size)`** - Vertical scaling (use for heights)
- **`Layout.scaleModerate(size)`** - **RECOMMENDED** - Moderate scaling (use for spacing, padding, fonts)
- **`Layout.scaleModerateVertical(size)`** - Moderate vertical scaling

### Why `scaleModerate` is Better for Tablets

`scaleModerate` uses a 30% scaling factor, which means:
- **Phones**: Elements scale slightly larger (better readability)
- **Tablets**: Elements scale appropriately larger (prevents tiny text/elements)
- **No extreme scaling**: Prevents elements from becoming too large

## Usage in Components

### ✅ Use Pre-Scaled Constants (Recommended)

```typescript
import { Layout } from '../constants/Layout';
import { Typography } from '../constants/Typography';

const styles = StyleSheet.create({
  container: {
    padding: Layout.spacing.md,      // Already scaled! Works on tablets
    borderRadius: Layout.borderRadius.lg,  // Already scaled!
  },
  text: {
    fontSize: Typography.sizes.md,   // Already scaled! Works on tablets
  },
  icon: {
    width: Layout.icon.md,           // Already scaled!
    height: Layout.icon.md,
  },
});
```

### ✅ For Custom Dimensions

Replace fixed pixel values with scaling functions:

**Before (Doesn't scale well on tablets):**
```typescript
const styles = StyleSheet.create({
  button: {
    width: 140,        // ❌ Fixed size - too small on iPad
    height: 80,        // ❌ Fixed size - too small on iPad
    padding: 16,       // ❌ Fixed size
    borderRadius: 8,   // ❌ Fixed size
  },
  text: {
    fontSize: 16,      // ❌ Fixed size - too small on iPad
  },
});
```

**After (Scales properly on tablets):**
```typescript
import { Layout } from '../constants/Layout';
import { Typography } from '../constants/Typography';

const styles = StyleSheet.create({
  button: {
    width: Layout.scale(140),              // ✅ Scales on tablets
    height: Layout.scaleVertical(80),      // ✅ Scales on tablets
    padding: Layout.scaleModerate(16),     // ✅ Moderate scaling (recommended)
    borderRadius: Layout.scale(8),         // ✅ Scales on tablets
  },
  text: {
    fontSize: Typography.sizes.md,         // ✅ Already scaled (recommended)
    // OR
    fontSize: Layout.scaleModerate(16),    // ✅ Manual scaling
  },
});
```

### ✅ For Grid Layouts (Tablet-Friendly)

For grid items that should be larger on tablets:

```typescript
import { Layout } from '../constants/Layout';

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.md,  // Responsive gap
  },
  gridItem: {
    // On tablets, items can be larger
    width: Layout.isTablet 
      ? Layout.scale(200)      // Larger on tablets
      : Layout.scale(150),     // Normal on phones
    height: Layout.scaleVertical(120),
    marginBottom: Layout.spacing.md,
  },
});
```

### ✅ Using Percentage Widths (Better for Tablets)

For flexible layouts that work on tablets:

```typescript
const styles = StyleSheet.create({
  // For 2 columns on phone, 3-4 on tablet
  item: {
    width: Layout.isTablet ? '24%' : '47%',  // Responsive width
    aspectRatio: 1,                           // Maintain square
  },
  
  // For containers that don't stretch too wide on tablets
  container: {
    width: Layout.isTablet ? Layout.containerWidth : '100%',
    maxWidth: Layout.isTablet ? 800 : undefined,
    alignSelf: Layout.isTablet ? 'center' : 'stretch',
  },
});
```

## Device Detection

```typescript
import { Layout } from '../constants/Layout';

// Check device type
if (Layout.isTablet) {
  // Tablet-specific logic
}

if (Layout.isSmallDevice) {
  // Small phone logic
}

if (Layout.isLargeDevice) {
  // Large device logic
}
```

## Common Patterns

### Pattern 1: Replace Fixed Values in Existing Components

Find and replace fixed pixel values:

```typescript
// Find these patterns:
width: 40,          → width: Layout.scale(40),
height: 40,         → height: Layout.scaleVertical(40),
padding: 16,        → padding: Layout.scaleModerate(16),
fontSize: 18,       → fontSize: Typography.sizes.lg,
marginBottom: 12,   → marginBottom: Layout.scaleModerate(12),
borderRadius: 8,    → borderRadius: Layout.scale(8),
```

### Pattern 2: Icon Sizes

```typescript
// Before
icon: {
  width: 24,
  height: 24,
}

// After
icon: {
  width: Layout.icon.md,  // Already scaled!
  height: Layout.icon.md,
}
```

### Pattern 3: Spacing

```typescript
// Before
padding: 16,
marginTop: 24,
gap: 8,

// After
padding: Layout.spacing.md,      // Already scaled!
marginTop: Layout.spacing.lg,    // Already scaled!
gap: Layout.spacing.sm,          // Already scaled!
```

## Testing

1. Test on iPhone SE (small screen)
2. Test on iPhone 15 Pro Max (large phone)
3. Test on iPad (tablet)
4. Test on iPad Pro 12.9" (large tablet)

All elements should scale proportionally and look good on all devices.

## Migration Checklist

For each component:
- [ ] Replace fixed `width`, `height` with `Layout.scale()`, `Layout.scaleVertical()`
- [ ] Replace fixed `padding`, `margin` with `Layout.spacing.*` or `Layout.scaleModerate()`
- [ ] Replace fixed `fontSize` with `Typography.sizes.*` or `Layout.scaleModerate()`
- [ ] Replace fixed `borderRadius` with `Layout.borderRadius.*` or `Layout.scale()`
- [ ] Test on iPad simulator to verify scaling

