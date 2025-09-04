# BreathRight Design System Style Guide

This style guide documents the design system aligned with the Figma designs located in `/docs/Designs`.

## Color System

### Primary Colors
- **Primary**: `#491124` - Main brand color (dark maroon)
- **Secondary**: `#4E5050` - Secondary text and UI elements (gray)

### AQI Colors
Consistent color scale for Air Quality Index levels:
- **Good (0-50)**: `#CEF4FF` - Light blue
- **Moderate (51-100)**: `#F8FFCE` - Light yellow
- **Poor/Unhealthy for Sensitive (101-150)**: `#FFE4CE` - Light orange
- **Unhealthy (151-200)**: `#FFCECE` - Light red
- **Very Unhealthy (201-300)**: `#C5B4DF` - Light purple
- **Hazardous (300+)**: `#B195E8` - Darker purple

### Pollen Level Colors
- **Low**: `#CEF4FF` - Light blue
- **Medium**: `#F8FFCE` - Light yellow
- **High**: `#FFCECE` - Light red
- **Very High**: `#B195E8` - Purple

### Lightning/Weather Colors
- **None**: `#CEF4FF` - Light blue
- **Low**: `#F8FFCE` - Light yellow
- **Medium**: `#FFE4CE` - Light orange
- **High**: `#FFCECE` - Light red

### Text Colors
All badge text uses the primary color `#491124` for consistency and readability on light backgrounds.

## Typography

### Font Families
1. **Baloo 2** (Bold) - Used for headings and numeric values
2. **Nunito Sans** (Light, Regular, Medium, SemiBold, Bold) - Body text and labels
3. **Inter** (Regular, SemiBold) - Alternative font if needed

### Text Sizes
- **Headings (H1)**: 24px / line-height: 28px - Baloo 2 Bold
- **Headings (H2)**: 20px / line-height: 24px - Baloo 2 Bold
- **Body**: 14px / line-height: 20px - Nunito Sans Regular
- **Badge Values**: 24px / line-height: 20px - Baloo 2 Bold
- **Badge Labels**: 15px / line-height: 20px - Nunito Sans Medium
- **Small Labels**: 11px / line-height: 14px - Nunito Sans Regular
- **Buttons**: 16px / line-height: 20px - Nunito Sans Regular

## Spacing

### Base Scale
- xxs: 2px
- xs: 4px
- sm: 8px
- md: 12px
- base: 16px (default padding)
- lg: 20px
- xl: 24px
- xxl: 32px

### Component Spacing
- **Cards**: 16px padding, 16px gap between elements
- **Badges**: 12px horizontal padding, 8px vertical padding
- **Buttons**: 16px horizontal padding, 8px vertical padding
- **Screen**: 16px horizontal padding, 80px bottom padding (for nav)

## Border Radius
- **Cards**: 16px
- **Badges**: 12px
- **Buttons**: 8px
- **Accordions**: 8px
- **Dropdowns**: 16px
- **Modals**: 20px

## Component Styles

### Cards
- Background: `rgba(255, 255, 255, 0.65)` - Semi-transparent white
- Border: 1px white
- Border Radius: 16px
- Padding: 16px
- Shadow: Subtle (0, 1, 2, 0.05)

### Badges (AQI, Pollen, etc.)
- Background: Color based on level
- Border: 2px matching background color
- Border Radius: 12px
- Padding: 12px horizontal, 8px vertical
- Text: Always `#491124` for consistency

### Location Dropdown
- Selected Item Background: `rgba(1, 104, 125, 0.1)`
- Border Bottom: 1px `rgba(0, 0, 0, 0.2)`
- Item Padding: 16px

### Charts
- Bar Width: 11px
- Bar Border: 1.5px (2px for current/active bar)
- Bar Colors: Match AQI color scale
- Active Bar Border: `#491124`

## Background Gradients
Main screen background uses a radial gradient:
- From: `#FFF3F2` (light pink)
- To: `#CEF4FF` (light blue)

## Usage Examples

```typescript
import { colors, typography, spacing, getAQIColor } from '@/lib/constants';

// Get color for AQI value
const backgroundColor = getAQIColor(45); // Returns #CEF4FF (good)

// Apply typography
const headingStyle = {
  ...typography.h2,
  color: colors.text.primary,
};

// Use spacing
const cardStyle = {
  padding: spacing.card.padding,
  borderRadius: spacing.card.borderRadius,
};
```

## Implementation Notes

1. **Consistency**: Always use the design tokens rather than hardcoding values
2. **Text Contrast**: Primary text color `#491124` is optimized for all light backgrounds
3. **Responsive**: Spacing and typography scale appropriately across device sizes
4. **Accessibility**: Color combinations meet WCAG contrast requirements
5. **Platform**: Fonts need to be properly loaded for both iOS and Android

## Files Structure
- `/lib/constants/colors.ts` - Color definitions
- `/lib/constants/typography.ts` - Font families and text styles
- `/lib/constants/spacing.ts` - Spacing, borders, and radius values
- `/lib/constants/index.ts` - Central exports and helper functions
- `/global.css` - CSS variables and Tailwind utilities
- `/tailwind.config.js` - Tailwind configuration with design tokens