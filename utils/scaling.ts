import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 8/SE - 375x667)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 667;

/**
 * Scale a value based on screen width
 * @param size - The size to scale
 * @returns Scaled size
 */
export const scale = (size: number): number => {
  const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
  // Limit scaling to reasonable bounds (0.8x to 1.3x)
  const clampedScale = Math.max(0.8, Math.min(1.3, scaleFactor));
  return Math.round(size * clampedScale);
};

/**
 * Scale a value based on screen height
 * @param size - The size to scale
 * @returns Scaled size
 */
export const verticalScale = (size: number): number => {
  const scaleFactor = SCREEN_HEIGHT / BASE_HEIGHT;
  // Limit scaling to reasonable bounds (0.8x to 1.3x)
  const clampedScale = Math.max(0.8, Math.min(1.3, scaleFactor));
  return Math.round(size * clampedScale);
};

/**
 * Scale a value based on screen width with moderate scaling
 * Good for font sizes and spacing
 * @param size - The size to scale
 * @returns Scaled size
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
  const clampedScale = Math.max(0.8, Math.min(1.3, scaleFactor));
  return Math.round(size + (clampedScale - 1) * size * factor);
};

/**
 * Get responsive font size
 * @param size - Base font size
 * @returns Scaled font size
 */
export const scaleFont = (size: number): number => {
  return moderateScale(size, 0.3); // Less aggressive scaling for fonts
};

/**
 * Get responsive spacing
 * @param size - Base spacing
 * @returns Scaled spacing
 */
export const scaleSpacing = (size: number): number => {
  return moderateScale(size, 0.4);
};

/**
 * Get screen dimensions
 */
export const getScreenDimensions = () => ({
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  scale: SCREEN_WIDTH / BASE_WIDTH,
});

