/**
 * Central export for all design system constants
 * Aligned with Figma design specifications
 */

export { colors } from './colors';
export { typography, fontFamilies, textStyles } from './typography';
export { spacing, borders, radius, shadows } from './spacing';

// Helper functions for consistent styling
export const getAQIColor = (aqi: number) => {
  if (aqi <= 50) return colors.aqi.good;
  if (aqi <= 100) return colors.aqi.moderate;
  if (aqi <= 150) return colors.aqi.poor;
  if (aqi <= 200) return colors.aqi.unhealthy;
  if (aqi <= 300) return colors.aqi.veryUnhealthy;
  return colors.aqi.hazardous;
};

export const getPollenColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'low':
      return colors.pollen.low;
    case 'medium':
      return colors.pollen.medium;
    case 'high':
      return colors.pollen.high;
    case 'very high':
      return colors.pollen.veryHigh;
    default:
      return colors.neutral.gray100;
  }
};

export const getLightningColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'none':
      return colors.lightning.none;
    case 'low':
      return colors.lightning.low;
    case 'medium':
      return colors.lightning.medium;
    case 'high':
      return colors.lightning.high;
    default:
      return colors.neutral.gray100;
  }
};

// AQI Level helper
export const getAQILevel = (aqi: number): string => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

// Import statement for components
import { colors } from './colors';