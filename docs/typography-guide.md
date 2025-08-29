# Typography Guide - Ensuring Nunito Sans Usage

## Quick Start

To ensure all text in the app uses Nunito Sans font:

### 1. Use AppText Component (Recommended)
Instead of React Native's `Text` component, use our custom `AppText` component:

```tsx
// ❌ Don't use this
import { Text } from 'react-native';
<Text>Hello World</Text>

// ✅ Use this instead
import { AppText } from '@/components/ui/AppText';
<AppText>Hello World</AppText>
```

### 2. AppText Component Examples

```tsx
// Regular text (default)
<AppText>This is Nunito Sans Regular</AppText>

// Different sizes
<AppText variant="large">Large text (18px)</AppText>
<AppText variant="regular">Regular text (16px)</AppText>
<AppText variant="small">Small text (14px)</AppText>
<AppText variant="tiny">Tiny text (12px)</AppText>

// Different weights
<AppText weight="light">Light weight</AppText>
<AppText weight="regular">Regular weight</AppText>
<AppText weight="semibold">Semibold weight</AppText>
<AppText weight="bold">Bold weight</AppText>

// Combining variants and weights
<AppText variant="large" weight="bold">Large Bold Text</AppText>
```

### 3. For Custom Components

If you need to use React Native's Text directly, always include the fontFamily:

```tsx
import { fonts } from '@/lib/fonts';

const styles = StyleSheet.create({
  myText: {
    fontFamily: fonts.weight.regular, // Nunito Sans Regular
    fontSize: 16,
  },
});
```

### 4. Font Constants Available

```tsx
import { fonts } from '@/lib/fonts';

// Body text styles (all use Nunito Sans)
fonts.body.large    // 18px with Nunito Sans
fonts.body.regular  // 16px with Nunito Sans  
fonts.body.small    // 14px with Nunito Sans
fonts.body.tiny     // 12px with Nunito Sans

// Font weights (all Nunito Sans variants)
fonts.weight.light     // NunitoSans-Light
fonts.weight.regular   // NunitoSans-Regular
fonts.weight.semibold  // NunitoSans-SemiBold
fonts.weight.bold      // NunitoSans-Bold

// Headlines (use Baloo 2 font - different font for headers)
fonts.headline.h1   // 32px with Baloo2
fonts.headline.h2   // 28px with Baloo2
// etc...
```

### 5. Global Default

The app loads fonts in the root layout (`app/_layout.tsx`) using:
```tsx
const fontsLoaded = useAppFonts();
```

This ensures Nunito Sans fonts are available throughout the app.

## Best Practices

1. **Always use AppText** for body text to ensure consistency
2. **Use fonts.headline** for headers (they use Baloo 2 font)
3. **Use fonts.body** or fonts.weight constants when creating custom styles
4. **Never hardcode fontFamily strings** - always use the constants

## Components Already Using Nunito Sans

- Button component (`components/ui/Button.tsx`) - uses `fonts.weight.semibold`
- Input component (`components/ui/Input.tsx`) - uses `fonts.weight.regular`
- All components using `fonts.body.*` styles

## Migration Checklist

When updating existing components:
1. Replace `<Text>` with `<AppText>`
2. Remove hardcoded fontFamily/fontWeight styles
3. Use variant and weight props instead
4. Test that text renders correctly