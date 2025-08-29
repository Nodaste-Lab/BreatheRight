/**
 * Centralized color constants for the application
 * These match the CSS custom properties defined in global.css
 */

export const colors = {
  // Brand colors
  primary: '#491124', // --neutral-90 in global.css
  secondary: '#4E5050',

  // AQI colors
  aqi: {
    good: '#CEF4FF',
    moderate: '#F8FFCE',
    poor: '#FFE4CE',
    unhealthy: '#FFCECE',
    veryUnhealthy: '#C5B4DF',
    hazardous: '#B195E8',
  },
  
  // AQI text colors
  aqiText: {
    good: '#0B7A8F',
    moderate: '#7A8F0B',
    poor: '#8F5A0B',
    unhealthy: '#8F0B0B',
    veryUnhealthy: '#6B4C8F',
    hazardous: '#5A3D8F',
  },
  
  // Neutral colors
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
  },
  
  // Semantic colors
  semantic: {
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6',
  },
  
  // Text colors
  text: {
    primary: '#491124',
    secondary: '#653C4A',
    muted: '#6B7280',
    light: '#9CA3AF',
  },
} as const;