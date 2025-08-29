/**
 * AQI Color System
 * Maps AQI values and levels to consistent colors throughout the app
 */

export type AQILevel = 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';

// AQI Color Definitions
export const AQI_COLORS = {
  good: '#CEF4FF',           // 0-50 AQI
  moderate: '#F8FFCE',       // 51-100 AQI 
  poor: '#FFE4CE',           // 101-150 AQI
  unhealthy: '#FFCECE',      // 151-200 AQI
  veryUnhealthy: '#C5B4DF',  // 201-300 AQI
  hazardous: '#B195E8',      // 300+ AQI
} as const;

// Text colors for better contrast
export const AQI_TEXT_COLORS = {
  good: '#0B7A8F',
  moderate: '#7A8F0B',
  poor: '#8F5A0B',
  unhealthy: '#8F0B0B',
  veryUnhealthy: '#6B4C8F',
  hazardous: '#5A3D8F',
} as const;

/**
 * Get AQI color based on numeric AQI value
 */
export function getAQIColorByValue(aqi: number): string {
  if (aqi <= 50) return AQI_COLORS.good;
  if (aqi <= 100) return AQI_COLORS.moderate;
  if (aqi <= 150) return AQI_COLORS.poor;
  if (aqi <= 200) return AQI_COLORS.unhealthy;
  if (aqi <= 300) return AQI_COLORS.veryUnhealthy;
  return AQI_COLORS.hazardous;
}

/**
 * Get AQI text color based on numeric AQI value
 */
export function getAQITextColorByValue(aqi: number): string {
  if (aqi <= 50) return AQI_TEXT_COLORS.good;
  if (aqi <= 100) return AQI_TEXT_COLORS.moderate;
  if (aqi <= 150) return AQI_TEXT_COLORS.poor;
  if (aqi <= 200) return AQI_TEXT_COLORS.unhealthy;
  if (aqi <= 300) return AQI_TEXT_COLORS.veryUnhealthy;
  return AQI_TEXT_COLORS.hazardous;
}

/**
 * Get AQI color based on level string
 */
export function getAQIColorByLevel(level: string): string {
  const normalizedLevel = level.toLowerCase();
  
  if (normalizedLevel.includes('good')) return AQI_COLORS.good;
  if (normalizedLevel.includes('moderate')) return AQI_COLORS.moderate;
  if (normalizedLevel.includes('unhealthy for sensitive')) return AQI_COLORS.poor;
  if (normalizedLevel.includes('unhealthy') && normalizedLevel.includes('very')) return AQI_COLORS.veryUnhealthy;
  if (normalizedLevel.includes('unhealthy')) return AQI_COLORS.unhealthy;
  if (normalizedLevel.includes('hazardous')) return AQI_COLORS.hazardous;
  
  return AQI_COLORS.good; // default fallback
}

/**
 * Get AQI text color based on level string
 */
export function getAQITextColorByLevel(level: string): string {
  const normalizedLevel = level.toLowerCase();
  
  if (normalizedLevel.includes('good')) return AQI_TEXT_COLORS.good;
  if (normalizedLevel.includes('moderate')) return AQI_TEXT_COLORS.moderate;
  if (normalizedLevel.includes('unhealthy for sensitive')) return AQI_TEXT_COLORS.poor;
  if (normalizedLevel.includes('unhealthy') && normalizedLevel.includes('very')) return AQI_TEXT_COLORS.veryUnhealthy;
  if (normalizedLevel.includes('unhealthy')) return AQI_TEXT_COLORS.unhealthy;
  if (normalizedLevel.includes('hazardous')) return AQI_TEXT_COLORS.hazardous;
  
  return AQI_TEXT_COLORS.good; // default fallback
}

/**
 * Get AQI category info with colors
 */
export function getAQICategory(aqi: number) {
  if (aqi <= 50) {
    return {
      level: 'Good',
      description: 'Air quality is satisfactory',
      color: AQI_COLORS.good,
      textColor: AQI_TEXT_COLORS.good,
      range: '0-50'
    };
  }
  if (aqi <= 100) {
    return {
      level: 'Moderate',
      description: 'Air quality is acceptable for most people',
      color: AQI_COLORS.moderate,
      textColor: AQI_TEXT_COLORS.moderate,
      range: '51-100'
    };
  }
  if (aqi <= 150) {
    return {
      level: 'Unhealthy for Sensitive Groups',
      description: 'Sensitive individuals may experience health effects',
      color: AQI_COLORS.poor,
      textColor: AQI_TEXT_COLORS.poor,
      range: '101-150'
    };
  }
  if (aqi <= 200) {
    return {
      level: 'Unhealthy',
      description: 'Everyone may experience health effects',
      color: AQI_COLORS.unhealthy,
      textColor: AQI_TEXT_COLORS.unhealthy,
      range: '151-200'
    };
  }
  if (aqi <= 300) {
    return {
      level: 'Very Unhealthy',
      description: 'Health alert: everyone may experience serious health effects',
      color: AQI_COLORS.veryUnhealthy,
      textColor: AQI_TEXT_COLORS.veryUnhealthy,
      range: '201-300'
    };
  }
  return {
    level: 'Hazardous',
    description: 'Health warnings of emergency conditions',
    color: AQI_COLORS.hazardous,
    textColor: AQI_TEXT_COLORS.hazardous,
    range: '300+'
  };
}