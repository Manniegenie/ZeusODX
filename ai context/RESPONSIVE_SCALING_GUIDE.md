# Responsive Scaling Implementation Guide

## Overview
The app now uses a responsive scaling system that ensures all UI elements scale proportionally based on screen size. This prevents elements from looking too small on larger devices.

## How It Works

### Base Dimensions
- **Base Width**: 375px (iPhone 8/SE standard)
- **Base Height**: 667px
- **Scaling Range**: 0.8x to 1.3x (prevents extreme scaling)

### Scaling Functions

#### `scale(size: number)`
Scales dimensions based on screen width. Use for:
- Width/height of icons, buttons, images
- Border radius
- Fixed spacing values

```typescript
import { scale } from '../utils/scaling';

const iconSize = scale(24); // Scales from base 24px
```

#### `scaleFont(size: number)`
Scales font sizes with moderate scaling (30% factor). Use for:
- All font sizes
- Line heights

```typescript
import { scaleFont } from '../utils/scaling';

const fontSize = scaleFont(16); // Scales from base 16px
```

#### `scaleSpacing(size: number)`
Scales spacing values with moderate scaling (40% factor). Use for:
- Padding
- Margins
- Gaps

```typescript
import { scaleSpacing } from '../utils/scaling';

const padding = scaleSpacing(16); // Scales from base 16px
```

## Usage in Components

### Using Layout Constants (Recommended)
The `Layout` constant now includes scaled spacing:

```typescript
import { Layout } from '../constants/Layout';

// Spacing is already scaled
padding: Layout.spacing.md,  // Responsive
width: Layout.scale(40),      // Use scale() for fixed dimensions
```

### Using Typography Constants (Recommended)
The `Typography` constant now includes scaled font sizes:

```typescript
import { Typography } from '../constants/Typography';

// Font sizes are already scaled
fontSize: Typography.sizes.md,  // Responsive
```

### Direct Scaling
For custom dimensions not in constants:

```typescript
import { scale, scaleFont, scaleSpacing } from '../utils/scaling';

const styles = StyleSheet.create({
  customButton: {
    width: scale(100),
    height: scale(50),
    borderRadius: scale(8),
    padding: scaleSpacing(12),
  },
  customText: {
    fontSize: scaleFont(18),
  },
});
```

## Migration Checklist

When updating components:

1. ✅ Replace fixed `width`/`height` with `Layout.scale(value)`
2. ✅ Replace fixed `fontSize` with `Typography.sizes.*` or `scaleFont(value)`
3. ✅ Replace fixed `padding`/`margin` with `Layout.spacing.*` or `scaleSpacing(value)`
4. ✅ Replace fixed `borderRadius` with `Layout.borderRadius.*` or `scale(value)`
5. ✅ Import `Layout` and `Typography` if not already imported
6. ✅ Import `scale`, `scaleFont`, `scaleSpacing` if using direct scaling

## Examples

### Before (Fixed Dimensions)
```typescript
const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 16,
  },
  text: {
    fontSize: 16,
  },
});
```

### After (Responsive Scaling)
```typescript
import { Layout } from '../constants/Layout';
import { Typography } from '../constants/Typography';

const styles = StyleSheet.create({
  button: {
    width: Layout.scale(40),
    height: Layout.scale(40),
    borderRadius: Layout.scale(20),
    padding: Layout.spacing.md,
  },
  text: {
    fontSize: Typography.sizes.md,
  },
});
```

## Components Updated

- ✅ `DashboardHeader.tsx` - Icons, badges, spacing
- ✅ `utility.tsx` - Service cards, header elements
- ✅ `profile.tsx` - Avatar, buttons, modals, spacing
- ✅ `Layout.ts` - All spacing values
- ✅ `Typography.ts` - All font sizes

## Testing

Test on different screen sizes:
- iPhone SE (375px width) - Base size
- iPhone 14 Pro (393px width) - Slightly larger
- iPhone 14 Pro Max (430px width) - Larger
- iPad (768px+ width) - Much larger (capped at 1.3x)

All elements should scale proportionally and maintain proper proportions.

