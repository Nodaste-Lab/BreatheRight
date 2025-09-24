import { Stack } from 'expo-router';
import { useAppFonts } from '../lib/fonts';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { colors } from '../lib/colors/theme';
import { GradientBackground } from '../components/ui/GradientBackground';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase/client';
import '../global.css';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const fontsLoaded = useAppFonts();

  useEffect(() => {
    if (fontsLoaded) {
      // Hide the splash screen once fonts are loaded
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Handle deep links for magic link authentication
    const handleDeepLink = async (url: string) => {
      if (url && url.includes('auth-callback')) {
        // Extract the URL parameters
        const urlParts = url.split('#');
        if (urlParts.length > 1) {
          // Parse the fragment (everything after #)
          const params = new URLSearchParams(urlParts[1]);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            // Set the session with the tokens
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Error setting session:', error);
            }
          }
        }
      }
    };

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Listen for new deep links while app is open
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: 'transparent' }
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
    </Stack>
  );
}