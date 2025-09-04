/**
 * Centralized color constants for the application
 * Aligned with Figma design system
 * These match the CSS custom properties defined in global.css
 */

export const colors = {
  // Brand colors - Primary maroon from Figma
  primary: '#491124', // Main brand color
  secondary: '#4E5050', // Secondary text/UI elements

  // AQI colors - Exact from Figma design
  aqi: {
    good: '#CEF4FF',       // Light blue
    moderate: '#F8FFCE',   // Light yellow
    poor: '#FFE4CE',       // Light orange (Unhealthy for Sensitive)
    unhealthy: '#FFCECE',  // Light red
    veryUnhealthy: '#C5B4DF', // Light purple
    hazardous: '#B195E8',  // Darker purple
  },
  
  // Pollen level colors - From Figma allergen badges
  pollen: {
    low: '#CEF4FF',       // Same as AQI good
    medium: '#F8FFCE',    // Same as AQI moderate
    high: '#FFCECE',      // Same as AQI unhealthy
    veryHigh: '#B195E8',  // Purple for very high
  },

  // Lightning/Weather colors - From Figma weather effects
  lightning: {
    none: '#CEF4FF',      // Light blue
    low: '#F8FFCE',       // Light yellow
    medium: '#FFE4CE',    // Light orange
    high: '#FFCECE',      // Light red
  },
  
  // Text colors for contrast - Used in badges/cards
  contrastText: {
    primary: '#491124',   // Dark maroon for all light backgrounds
    secondary: '#4E5050', // Gray for secondary text
  },
  
  // Neutral colors - From Figma backgrounds
  neutral: {
    white: '#FFFFFF',
    whiteAlpha65: 'rgba(255, 255, 255, 0.65)', // Card backgrounds
    whiteAlpha20: 'rgba(255, 255, 255, 0.2)',  // Subtle overlays
    black: '#000000',
    blackAlpha20: 'rgba(0, 0, 0, 0.2)',        // Divider lines
    blackAlpha40: 'rgba(0, 0, 0, 0.4)',        // Chart borders
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray300: '#D1D5DB',
    gray500: '#6B7280',
    gray700: '#374151',
    gray900: '#111827',
  },

  // Background gradients - From Figma designs
  gradients: {
    mainBackground: {
      from: '#FFF3F2', // Light pink
      to: '#CEF4FF',   // Light blue
    },
    cardOverlay: 'rgba(255, 255, 255, 0.65)',
  },
  
  // Semantic colors
  semantic: {
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6',
  },
  
  // Text colors - From Figma typography
  text: {
    primary: '#491124',   // Main text color
    secondary: '#4E5050', // Secondary gray text
    muted: '#6B7280',     // Muted/disabled
    light: '#9CA3AF',     // Very light text
  },

  // Special UI colors from Figma
  ui: {
    activeBorder: '#01687D',     // Selected location highlight
    activeBackground: 'rgba(1, 104, 125, 0.1)', // Selected location bg
    chartBarActive: '#491124',   // Active/current chart bar border
  },
} as const;