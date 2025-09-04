/**
 * Typography constants aligned with Figma design system
 * Font families, sizes, weights, and line heights from Figma
 */

import { Platform } from 'react-native';

// Font family mappings for React Native
export const fontFamilies = {
  // Primary heading font from Figma
  baloo: Platform.select({
    ios: 'Baloo2-Bold',
    android: 'Baloo2-Bold',
    default: 'Baloo2-Bold',
  }),
  
  // Primary body font from Figma
  nunito: {
    light: Platform.select({
      ios: 'NunitoSans-Light',
      android: 'NunitoSans-Light',
      default: 'NunitoSans-Light',
    }),
    regular: Platform.select({
      ios: 'NunitoSans-Regular',
      android: 'NunitoSans-Regular',
      default: 'NunitoSans-Regular',
    }),
    medium: Platform.select({
      ios: 'NunitoSans-Medium',
      android: 'NunitoSans-Medium',
      default: 'NunitoSans-Medium',
    }),
    semiBold: Platform.select({
      ios: 'NunitoSans-SemiBold',
      android: 'NunitoSans-SemiBold',
      default: 'NunitoSans-SemiBold',
    }),
    bold: Platform.select({
      ios: 'NunitoSans-Bold',
      android: 'NunitoSans-Bold',
      default: 'NunitoSans-Bold',
    }),
  },
  
  // Secondary font from Figma (if needed)
  inter: Platform.select({
    ios: 'Inter',
    android: 'Inter',
    default: 'Inter',
  }),
};

// Typography styles from Figma
export const typography = {
  // Headings - Baloo 2 Bold
  h1: {
    fontFamily: fontFamilies.baloo,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700' as const,
  },
  h2: {
    fontFamily: fontFamilies.baloo,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700' as const,
  },
  h3: {
    fontFamily: fontFamilies.baloo,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700' as const,
  },
  
  // Body text - Nunito Sans
  body: {
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontFamily: fontFamilies.nunito.medium,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  bodyBold: {
    fontFamily: fontFamilies.nunito.bold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700' as const,
  },
  
  // Small text
  caption: {
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  captionBold: {
    fontFamily: fontFamilies.nunito.bold,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700' as const,
  },
  
  // Extra small text
  label: {
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400' as const,
  },
  labelBold: {
    fontFamily: fontFamilies.nunito.bold,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700' as const,
  },
  
  // Badge text (AQI values, etc.)
  badge: {
    fontFamily: fontFamilies.baloo,
    fontSize: 24,
    lineHeight: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.23,
  },
  badgeLabel: {
    fontFamily: fontFamilies.nunito.medium,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: -0.23,
  },
  
  // Button text
  button: {
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  buttonBold: {
    fontFamily: fontFamilies.nunito.bold,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700' as const,
  },
  
  // Chart labels
  chartLabel: {
    fontFamily: fontFamilies.nunito.semiBold,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600' as const,
  },
  chartValue: {
    fontFamily: fontFamilies.baloo,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.23,
  },
};

// Text styles as style objects for direct use
export const textStyles = {
  h1: {
    fontFamily: fontFamilies.baloo,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700' as const,
    color: '#491124',
  },
  h2: {
    fontFamily: fontFamilies.baloo,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700' as const,
    color: '#491124',
  },
  h3: {
    fontFamily: fontFamilies.baloo,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700' as const,
    color: '#491124',
  },
  body: {
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    color: '#491124',
  },
  caption: {
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    color: '#4E5050',
  },
  label: {
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400' as const,
    color: '#491124',
  },
};