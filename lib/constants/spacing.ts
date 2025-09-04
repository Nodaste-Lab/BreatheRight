/**
 * Spacing constants aligned with Figma design system
 * All spacing values from the Figma components
 */

export const spacing = {
  // Base spacing scale from Figma (in pixels)
  xxs: 2,   // 0.5 in Tailwind
  xs: 4,    // 1 in Tailwind
  sm: 8,    // 2 in Tailwind
  md: 12,   // 3 in Tailwind
  base: 16, // 4 in Tailwind - Default padding
  lg: 20,   // 5 in Tailwind
  xl: 24,   // 6 in Tailwind
  xxl: 32,  // 8 in Tailwind
  xxxl: 40, // 10 in Tailwind
  
  // Component-specific spacing from Figma
  card: {
    padding: 16,
    gap: 16,
    borderRadius: 16,
  },
  
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  
  accordion: {
    paddingHorizontal: 8,
    paddingVertical: 16,
    gap: 12,
    borderRadius: 8,
  },
  
  dropdown: {
    padding: 16,
    itemPadding: 16,
    borderRadius: 16,
    gap: 4,
  },
  
  chart: {
    barWidth: 11,
    barGap: 2,
    padding: 20,
    labelMargin: 10,
  },
  
  bottomNav: {
    height: 80,
    iconSize: 24,
    padding: 16,
  },
  
  header: {
    height: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  modal: {
    padding: 20,
    borderRadius: 20,
    gap: 16,
  },
  
  list: {
    itemGap: 8,
    sectionGap: 24,
    padding: 16,
  },
  
  // Screen padding from Figma
  screen: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80, // Account for bottom navigation
  },
};

// Border widths from Figma
export const borders = {
  thin: 1,
  medium: 2,
  thick: 3,
  
  // Component-specific borders
  card: 1,
  badge: 2,
  chartBar: 1.5,
  chartBarActive: 2,
  accordion: 1,
  dropdown: 1,
};

// Border radius values from Figma
export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
  
  // Component-specific radius
  card: 16,
  badge: 12,
  button: 8,
  accordion: 8,
  dropdown: 16,
  modal: 20,
  chartBar: 4,
};

// Shadow definitions from Figma
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Component shadows
  card: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dropdown: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
};