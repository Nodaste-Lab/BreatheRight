export const colors = {
  // Main app background color - change this to update the background globally
  background: '#CEEFFF', // Fallback solid color
  
  // Gradient colors for the background
  gradient: {
    colors: ['#CEEFFF', '#FFF3F2'],
    start: { x: 0.5, y: 0.3 },
    end: { x: 0.5, y: 1 }
  },
  
  // Tab bar colors
  burgundy: '#491124',
  activeTab: '#DCF7FF',
  
  // Text colors
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    white: '#FFFFFF',
  },
  
  // UI colors
  primary: '#3b82f6',
  border: '#f3f4f6',
  error: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  
  // AQI Level Colors
  aqi: {
    good: '#CEF4FF',
    moderate: '#F8FFCE',
    poor: '#FFE4CE',
    unhealthy: '#FFCECE',
    veryUnhealthy: '#C5B4DF',
    hazardous: '#B195E8',
  },
  
  // AQI Text Colors
  aqiText: {
    good: '#0B7A8F',
    moderate: '#7A8F0B',
    poor: '#8F5A0B',
    unhealthy: '#8F0B0B',
    veryUnhealthy: '#6B4C8F',
    hazardous: '#5A3D8F',
  },
} as const;

export type Theme = typeof colors;