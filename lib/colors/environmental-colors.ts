/**
 * Environmental Color System
 * Extends AQI colors to include pollen, lightning, and wildfire indicators
 */

import { AQI_COLORS, AQI_TEXT_COLORS } from './aqi-colors';

// Pollen level colors (using similar scale to AQI)
export const POLLEN_COLORS = {
  low: AQI_COLORS.good,        // 0-3 pollen index
  moderate: AQI_COLORS.moderate, // 4-6 pollen index  
  high: AQI_COLORS.poor,       // 7+ pollen index
  unavailable: '#9ca3af',       // gray for N/A
} as const;

export const POLLEN_TEXT_COLORS = {
  low: AQI_TEXT_COLORS.good,
  moderate: AQI_TEXT_COLORS.moderate,
  high: AQI_TEXT_COLORS.poor,
  unavailable: '#6b7280',
} as const;

// Lightning/Storm probability colors
export const LIGHTNING_COLORS = {
  low: AQI_COLORS.good,        // 0-30% probability
  moderate: AQI_COLORS.moderate, // 31-60% probability
  high: AQI_COLORS.unhealthy,  // 61%+ probability
  unavailable: '#9ca3af',       // gray for N/A
} as const;

export const LIGHTNING_TEXT_COLORS = {
  low: AQI_TEXT_COLORS.good,
  moderate: AQI_TEXT_COLORS.moderate,
  high: AQI_TEXT_COLORS.unhealthy,
  unavailable: '#6b7280',
} as const;

// Wildfire smoke level colors
export const WILDFIRE_COLORS = {
  low: AQI_COLORS.good,
  moderate: AQI_COLORS.moderate,
  high: AQI_COLORS.poor,
  unhealthy: AQI_COLORS.unhealthy,
  veryUnhealthy: AQI_COLORS.veryUnhealthy,
  hazardous: AQI_COLORS.hazardous,
  unavailable: '#9ca3af',
} as const;

export const WILDFIRE_TEXT_COLORS = {
  low: AQI_TEXT_COLORS.good,
  moderate: AQI_TEXT_COLORS.moderate,
  high: AQI_TEXT_COLORS.poor,
  unhealthy: AQI_TEXT_COLORS.unhealthy,
  veryUnhealthy: AQI_TEXT_COLORS.veryUnhealthy,
  hazardous: AQI_TEXT_COLORS.hazardous,
  unavailable: '#6b7280',
} as const;

// Generic unavailable color
export const UNAVAILABLE_COLOR = '#9ca3af';
export const UNAVAILABLE_TEXT_COLOR = '#6b7280';

/**
 * Get pollen color based on pollen index value
 */
export function getPollenColor(value: number | null | undefined): string {
  if (!value || value < 0) return POLLEN_COLORS.unavailable;
  if (value <= 3) return POLLEN_COLORS.low;
  if (value <= 6) return POLLEN_COLORS.moderate;
  return POLLEN_COLORS.high;
}

/**
 * Get pollen text color based on pollen index value
 */
export function getPollenTextColor(value: number | null | undefined): string {
  if (!value || value < 0) return POLLEN_TEXT_COLORS.unavailable;
  if (value <= 3) return POLLEN_TEXT_COLORS.low;
  if (value <= 6) return POLLEN_TEXT_COLORS.moderate;
  return POLLEN_TEXT_COLORS.high;
}

/**
 * Get lightning color based on probability percentage
 */
export function getLightningColor(probability: number | null | undefined): string {
  if (probability === null || probability === undefined || probability < 0) {
    return LIGHTNING_COLORS.unavailable;
  }
  if (probability <= 30) return LIGHTNING_COLORS.low;
  if (probability <= 60) return LIGHTNING_COLORS.moderate;
  return LIGHTNING_COLORS.high;
}

/**
 * Get lightning text color based on probability percentage
 */
export function getLightningTextColor(probability: number | null | undefined): string {
  if (probability === null || probability === undefined || probability < 0) {
    return LIGHTNING_TEXT_COLORS.unavailable;
  }
  if (probability <= 30) return LIGHTNING_TEXT_COLORS.low;
  if (probability <= 60) return LIGHTNING_TEXT_COLORS.moderate;
  return LIGHTNING_TEXT_COLORS.high;
}

/**
 * Get wildfire smoke color based on smoke level
 */
export function getWildfireColor(smokeLevel: string | null | undefined): string {
  if (!smokeLevel || smokeLevel === 'Unknown') return WILDFIRE_COLORS.unavailable;
  
  const level = smokeLevel.toLowerCase();
  if (level === 'low') return WILDFIRE_COLORS.low;
  if (level === 'moderate') return WILDFIRE_COLORS.moderate;
  if (level === 'high') return WILDFIRE_COLORS.high;
  if (level === 'unhealthy') return WILDFIRE_COLORS.unhealthy;
  if (level === 'very unhealthy') return WILDFIRE_COLORS.veryUnhealthy;
  if (level === 'hazardous') return WILDFIRE_COLORS.hazardous;
  
  return WILDFIRE_COLORS.unavailable;
}

/**
 * Get wildfire smoke text color based on smoke level
 */
export function getWildfireTextColor(smokeLevel: string | null | undefined): string {
  if (!smokeLevel || smokeLevel === 'Unknown') return WILDFIRE_TEXT_COLORS.unavailable;
  
  const level = smokeLevel.toLowerCase();
  if (level === 'low') return WILDFIRE_TEXT_COLORS.low;
  if (level === 'moderate') return WILDFIRE_TEXT_COLORS.moderate;
  if (level === 'high') return WILDFIRE_TEXT_COLORS.high;
  if (level === 'unhealthy') return WILDFIRE_TEXT_COLORS.unhealthy;
  if (level === 'very unhealthy') return WILDFIRE_TEXT_COLORS.veryUnhealthy;
  if (level === 'hazardous') return WILDFIRE_TEXT_COLORS.hazardous;
  
  return WILDFIRE_TEXT_COLORS.unavailable;
}