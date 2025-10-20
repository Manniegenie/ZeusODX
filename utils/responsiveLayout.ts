import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Responsive layout utilities for large screen devices
 * Supports foldables, tablets, and other large screen devices
 */

// Screen size breakpoints
export const BREAKPOINTS = {
  small: 480,
  medium: 768,
  large: 1024,
  xlarge: 1440,
} as const;

// Device type detection
export const getDeviceType = () => {
  const minDimension = Math.min(screenWidth, screenHeight);
  const maxDimension = Math.max(screenWidth, screenHeight);
  
  if (maxDimension >= BREAKPOINTS.xlarge) {
    return 'xlarge';
  } else if (maxDimension >= BREAKPOINTS.large) {
    return 'large';
  } else if (maxDimension >= BREAKPOINTS.medium) {
    return 'medium';
  } else {
    return 'small';
  }
};

// Check if device is a large screen (tablet, foldable, etc.)
export const isLargeScreen = () => {
  const deviceType = getDeviceType();
  return deviceType === 'large' || deviceType === 'xlarge';
};

// Check if device is a tablet
export const isTablet = () => {
  const deviceType = getDeviceType();
  return deviceType === 'large' || deviceType === 'xlarge';
};

// Check if device is a foldable
export const isFoldable = () => {
  // Foldables typically have aspect ratios that are close to square
  const aspectRatio = screenWidth / screenHeight;
  return aspectRatio > 0.8 && aspectRatio < 1.2 && isLargeScreen();
};

// Get responsive dimensions
export const getResponsiveDimensions = () => {
  const deviceType = getDeviceType();
  const isLarge = isLargeScreen();
  
  return {
    screenWidth,
    screenHeight,
    deviceType,
    isLarge,
    isTablet: isTablet(),
    isFoldable: isFoldable(),
    // Responsive spacing
    spacing: {
      xs: isLarge ? 4 : 2,
      sm: isLarge ? 8 : 4,
      md: isLarge ? 16 : 8,
      lg: isLarge ? 24 : 16,
      xl: isLarge ? 32 : 24,
    },
    // Responsive font sizes
    fontSize: {
      xs: isLarge ? 12 : 10,
      sm: isLarge ? 14 : 12,
      md: isLarge ? 16 : 14,
      lg: isLarge ? 18 : 16,
      xl: isLarge ? 20 : 18,
      xxl: isLarge ? 24 : 20,
    },
    // Responsive container widths
    containerWidth: isLarge ? Math.min(screenWidth * 0.8, 1200) : screenWidth,
    // Responsive grid columns
    gridColumns: isLarge ? 3 : 1,
  };
};

// Get responsive styles for components
export const getResponsiveStyles = () => {
  const dimensions = getResponsiveDimensions();
  
  return {
    container: {
      maxWidth: dimensions.containerWidth,
      alignSelf: 'center' as const,
      width: '100%' as const,
    },
    grid: {
      flexDirection: dimensions.isLarge ? 'row' as const : 'column' as const,
      flexWrap: 'wrap' as const,
    },
    card: {
      margin: dimensions.spacing.md,
      padding: dimensions.spacing.lg,
      borderRadius: dimensions.isLarge ? 16 : 12,
    },
    text: {
      fontSize: dimensions.fontSize.md,
      lineHeight: dimensions.fontSize.md * 1.5,
    },
    button: {
      paddingHorizontal: dimensions.spacing.lg,
      paddingVertical: dimensions.spacing.md,
      borderRadius: dimensions.isLarge ? 12 : 8,
    },
  };
};

// Handle orientation changes
export const getOrientation = () => {
  return screenWidth > screenHeight ? 'landscape' : 'portrait';
};

// Check if app should use multi-pane layout
export const shouldUseMultiPane = () => {
  return isLargeScreen() && screenWidth >= BREAKPOINTS.large;
};

// Get layout configuration for current device
export const getLayoutConfig = () => {
  const dimensions = getResponsiveDimensions();
  const orientation = getOrientation();
  
  return {
    ...dimensions,
    orientation,
    useMultiPane: shouldUseMultiPane(),
    // Navigation configuration
    navigation: {
      type: dimensions.isLarge ? 'drawer' : 'tabs',
      showLabels: dimensions.isLarge,
    },
    // Content configuration
    content: {
      maxWidth: dimensions.containerWidth,
      padding: dimensions.spacing.lg,
    },
  };
};
