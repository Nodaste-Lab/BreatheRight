/**
 * Central export for all UI components
 * Components aligned with Figma design system
 */

// Basic UI Components
export { AppText } from './AppText';
export { Button } from './Button';
export { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
export { Input } from './Input';
export { GradientBackground } from './GradientBackground';

// New Figma-aligned components
export { Badge } from './Badge';
export { Accordion, AccordionItem } from './Accordion';
export { Dropdown } from './Dropdown';
export { Chart, HourlyChart } from './Chart';

// Icon components
export { IconSymbol } from './IconSymbol';
export { TabBarBackground } from './TabBarBackground';

// Component types are available but not exported to keep imports clean
// Import types directly from individual components if needed

// Re-export design constants for convenience
export { colors, typography, spacing, radius, shadows } from '../../lib/constants';