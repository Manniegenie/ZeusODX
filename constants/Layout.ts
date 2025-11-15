import { Dimensions } from 'react-native';
import { s, ms, vs, mvs } from 'react-native-size-matters';

const { width, height } = Dimensions.get('window');

/**
 * Layout constants with automatic responsive scaling
 * Uses react-native-size-matters for production-grade scaling
 * 
 * - s() = horizontal scaling (for widths, border radius)
 * - vs() = vertical scaling (for heights)
 * - ms() = moderate scaling (for spacing, fonts - recommended)
 * - mvs() = moderate vertical scaling
 */
export const Layout = {
  window: {
    width,
    height,
  },
  // Spacing values (automatically scaled)
  spacing: {
    xs: ms(4),
    sm: ms(8),
    md: ms(16),
    lg: ms(24),
    xl: ms(32),
    xxl: ms(48),
  },
  // Border radius values (automatically scaled)
  borderRadius: {
    sm: s(4),
    md: s(8),
    lg: s(12),
    xl: s(16),
    full: s(999),
  },
  isSmallDevice: width < 375,
  // Export scaling functions for direct use
  scale: s,        // Horizontal scaling (widths, border radius)
  scaleVertical: vs, // Vertical scaling (heights)
  scaleModerate: ms, // Moderate scaling (spacing, fonts - recommended)
  scaleModerateVertical: mvs, // Moderate vertical scaling
};
