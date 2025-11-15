import { Text } from 'react-native';
import { ms } from 'react-native-size-matters';

/**
 * Typography configuration
 * All text sizes are responsive and scale based on screen size
 * Font scaling is disabled to prevent device accessibility settings from affecting layout
 */
export const Typography = {
  // Font families (update these names based on your font loading method)
  extraLight: 'BricolageGrotesque-ExtraLight',
  light: 'BricolageGrotesque-Light',
  regular: 'BricolageGrotesque-Regular',
  medium: 'BricolageGrotesque-Medium',
  semiBold: 'BricolageGrotesque-SemiBold',
  bold: 'BricolageGrotesque-Bold',
  extraBold: 'BricolageGrotesque-ExtraBold',

  // Font sizes (automatically scaled using react-native-size-matters)
  // ms() provides moderate scaling - perfect for fonts
  sizes: {
    xs: ms(12),
    sm: ms(14),
    md: ms(16),
    lg: ms(18),
    xl: ms(20),
    xxl: ms(24),
    xxxl: ms(32),
  },

  // Text styles (automatically scaled)
  styles: {
    h1: {
      fontFamily: 'BricolageGrotesque-Bold',
      fontSize: ms(32),
      lineHeight: ms(40),
    },
    h2: {
      fontFamily: 'BricolageGrotesque-SemiBold',
      fontSize: ms(24),
      lineHeight: ms(32),
    },
    h3: {
      fontFamily: 'BricolageGrotesque-Medium',
      fontSize: ms(20),
      lineHeight: ms(28),
    },
    body: {
      fontFamily: 'BricolageGrotesque-Regular',
      fontSize: ms(16),
      lineHeight: ms(24),
    },
    bodyMedium: {
      fontFamily: 'BricolageGrotesque-Medium',
      fontSize: ms(16),
      lineHeight: ms(24),
    },
    caption: {
      fontFamily: 'BricolageGrotesque-Light',
      fontSize: ms(12),
      lineHeight: ms(16),
    },
    display: {
      fontFamily: 'BricolageGrotesque-ExtraBold',
      fontSize: ms(40),
      lineHeight: ms(48),
    },
  },
};

/**
 * Helper function to create text styles with allowFontScaling disabled
 * Use this when creating custom text styles to ensure consistency
 */
export const createTextStyle = (style: any) => {
  return {
    ...style,
    // Note: allowFontScaling is set at component level, not in style
  };
};

/**
 * Global configuration to disable font scaling
 * This can be set once in your app entry point
 */
export const disableFontScaling = () => {
  // Use type assertion to access defaultProps (deprecated but still works in RN)
  const TextComponent = Text as any;
  if (TextComponent.defaultProps == null) {
    TextComponent.defaultProps = {};
  }
  TextComponent.defaultProps.allowFontScaling = false;
};
