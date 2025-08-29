import {
  useFonts,
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  NunitoSans_300Light,
} from '@expo-google-fonts/nunito-sans';

import {
  Baloo2_400Regular,
  Baloo2_500Medium,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
} from '@expo-google-fonts/baloo-2';

export const useAppFonts = () => {
  const [fontsLoaded] = useFonts({
    // Nunito Sans for body text
    'NunitoSans-Light': NunitoSans_300Light,
    'NunitoSans-Regular': NunitoSans_400Regular,
    'NunitoSans-SemiBold': NunitoSans_600SemiBold,
    'NunitoSans-Bold': NunitoSans_700Bold,
    // Baloo 2 for headlines
    'Baloo2-Regular': Baloo2_400Regular,
    'Baloo2-Medium': Baloo2_500Medium,
    'Baloo2-SemiBold': Baloo2_600SemiBold,
    'Baloo2-Bold': Baloo2_700Bold,
    'Baloo2-ExtraBold': Baloo2_800ExtraBold,
  });

  return fontsLoaded;
};

// Font style constants for consistent usage
export const fonts = {
  // Headlines (Baloo 2)
  headline: {
    h1: {
      fontFamily: 'Baloo2-ExtraBold',
      fontSize: 32,
      lineHeight: 40,
    },
    h2: {
      fontFamily: 'Baloo2-Bold',
      fontSize: 28,
      lineHeight: 36,
    },
    h3: {
      fontFamily: 'Baloo2-Bold',
      fontSize: 24,
      lineHeight: 32,
    },
    h4: {
      fontFamily: 'Baloo2-SemiBold',
      fontSize: 20,
      lineHeight: 28,
    },
    h5: {
      fontFamily: 'Baloo2-SemiBold',
      fontSize: 18,
      lineHeight: 24,
    },
  },
  // Body text (Nunito Sans)
  body: {
    large: {
      fontFamily: 'NunitoSans-Regular',
      fontSize: 18,
      lineHeight: 26,
    },
    regular: {
      fontFamily: 'NunitoSans-Regular',
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 18,
    },
    small: {
      fontFamily: 'NunitoSans-Regular',
      fontSize: 14,
      lineHeight: 20,
    },
    tiny: {
      fontFamily: 'NunitoSans-Regular',
      fontSize: 12,
      lineHeight: 16,
    },
  },
  // Font weights for body text
  weight: {
    light: 'NunitoSans-Light',
    regular: 'NunitoSans-Regular',
    semibold: 'NunitoSans-SemiBold',
    bold: 'NunitoSans-Bold',
  },
};