/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary brand colors from Figma
        primary: '#491124',
        secondary: '#4E5050',
        
        // AQI color scale from Figma
        aqi: {
          good: '#CEF4FF',
          moderate: '#F8FFCE',
          poor: '#FFE4CE',
          unhealthy: '#FFCECE',
          'very-unhealthy': '#C5B4DF',
          hazardous: '#B195E8',
        },
        
        // Pollen levels from Figma
        pollen: {
          low: '#CEF4FF',
          medium: '#F8FFCE',
          high: '#FFCECE',
          'very-high': '#B195E8',
        },
        
        // Lightning/Weather from Figma
        lightning: {
          none: '#CEF4FF',
          low: '#F8FFCE',
          medium: '#FFE4CE',
          high: '#FFCECE',
        },
        
        // UI colors from Figma
        ui: {
          'active-border': '#01687D',
          'active-bg': 'rgba(1, 104, 125, 0.1)',
          'chart-active': '#491124',
        },
        
        // Background colors from Figma
        background: {
          DEFAULT: '#17202b',
          gradient: {
            from: '#FFF3F2',
            to: '#CEF4FF',
          },
          card: 'rgba(255, 255, 255, 0.65)',
          overlay: 'rgba(255, 255, 255, 0.2)',
        },
        
        // Neutral colors
        neutral: {
          white: '#FFFFFF',
          black: '#000000',
          'black-20': 'rgba(0, 0, 0, 0.2)',
          'black-40': 'rgba(0, 0, 0, 0.4)',
        },
        
        // Text colors from Figma
        text: {
          primary: '#491124',
          secondary: '#4E5050',
          muted: '#6B7280',
          light: '#9CA3AF',
        },
      },
      
      // Typography from Figma
      fontFamily: {
        'baloo': ['Baloo 2', 'sans-serif'],
        'nunito': ['Nunito Sans', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      
      // Font sizes from Figma
      fontSize: {
        // Text sizes from Figma components
        'xs': ['11px', { lineHeight: 'normal' }],      // Small labels
        'sm': ['12px', { lineHeight: 'normal' }],      // Secondary text
        'base': ['14px', { lineHeight: 'normal' }],    // Body text
        'md': ['15px', { lineHeight: '20px' }],        // Badge text
        'lg': ['16px', { lineHeight: 'normal' }],      // Button text
        'xl': ['20px', { lineHeight: '24px' }],        // Headings
        '2xl': ['24px', { lineHeight: '20px' }],       // AQI values
      },
      
      // Font weights from Figma
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      
      // Border radius from Figma
      borderRadius: {
        'none': '0',
        'sm': '4px',
        DEFAULT: '8px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        'full': '9999px',
      },
      
      // Spacing scale aligned with Figma
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
      },
    },
  },
  plugins: [],
}