import { Platform, Text } from 'react-native';
import { Layout } from './Layout';

const capFontSize = (value: number) => {
  const limit = Platform.OS === 'ios' ? 30 : 28;
  return Math.min(value, limit);
};

const scaleFont = (px: number) => {
  const scaled = Layout.scale(px);
  if (px === 0) {
    return 0;
  }
  const multiplier = scaled / px;
  const clampedMultiplier = Math.max(0.95, Math.min(1.08, multiplier));
  const adjusted = px * clampedMultiplier;
  return capFontSize(adjusted);
};

export const Typography = {
  extraLight: 'BricolageGrotesque-ExtraLight',
  light: 'BricolageGrotesque-Light',
  regular: 'BricolageGrotesque-Regular',
  medium: 'BricolageGrotesque-Medium',
  semiBold: 'BricolageGrotesque-SemiBold',
  bold: 'BricolageGrotesque-Bold',
  extraBold: 'BricolageGrotesque-ExtraBold',
  sizes: {
    xs: scaleFont(14),
    sm: scaleFont(16),
    md: scaleFont(16),
    lg: scaleFont(18),
    xl: scaleFont(20),
    xxl: scaleFont(24),
    xxxl: scaleFont(32),
  },
  styles: {
    h1: {
      fontFamily: 'BricolageGrotesque-Bold',
      fontSize: scaleFont(32),
      lineHeight: scaleFont(40),
    },
    h2: {
      fontFamily: 'BricolageGrotesque-SemiBold',
      fontSize: scaleFont(24),
      lineHeight: scaleFont(32),
    },
    h3: {
      fontFamily: 'BricolageGrotesque-Medium',
      fontSize: scaleFont(20),
      lineHeight: scaleFont(28),
    },
    body: {
      fontFamily: 'BricolageGrotesque-Regular',
      fontSize: scaleFont(16),
      lineHeight: scaleFont(24),
    },
    bodyMedium: {
      fontFamily: 'BricolageGrotesque-Medium',
      fontSize: scaleFont(16),
      lineHeight: scaleFont(24),
    },
    caption: {
      fontFamily: 'BricolageGrotesque-Light',
      fontSize: scaleFont(14),
      lineHeight: scaleFont(18),
    },
    display: {
      fontFamily: 'BricolageGrotesque-ExtraBold',
      fontSize: scaleFont(40),
      lineHeight: scaleFont(48),
    },
  },
};

export const disableFontScaling = () => {
  const TextComponent = Text as any;
  if (!TextComponent.defaultProps) {
    TextComponent.defaultProps = {};
  }
  TextComponent.defaultProps.allowFontScaling = false;
};
