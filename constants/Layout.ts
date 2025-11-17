import { Dimensions } from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const { width, height } = Dimensions.get('window');

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const widthPercentFromPx = (px: number) => `${(px / BASE_WIDTH) * 100}%`;
const heightPercentFromPx = (px: number) => `${(px / BASE_HEIGHT) * 100}%`;

const scaleWidth = (px: number) => wp(widthPercentFromPx(px));
const scaleHeight = (px: number) => hp(heightPercentFromPx(px));

export const Layout = {
  window: {
    width,
    height,
  },
  wp,
  hp,
  scale: scaleWidth,
  scaleVertical: scaleHeight,
  spacing: {
    xs: scaleWidth(4),
    sm: scaleWidth(8),
    md: scaleWidth(16),
    lg: scaleWidth(24),
    xl: scaleWidth(32),
    xxl: scaleWidth(48),
  },
  verticalSpacing: {
    xs: scaleHeight(4),
    sm: scaleHeight(8),
    md: scaleHeight(16),
    lg: scaleHeight(24),
    xl: scaleHeight(32),
    xxl: scaleHeight(48),
  },
  borderRadius: {
    sm: scaleWidth(4),
    md: scaleWidth(8),
    lg: scaleWidth(12),
    xl: scaleWidth(16),
    full: scaleWidth(999),
  },
  icon: {
    sm: scaleWidth(16),
    md: scaleWidth(24),
    lg: scaleWidth(32),
    xl: scaleWidth(40),
  },
  isSmallDevice: width < 360,
};
