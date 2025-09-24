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
      console.log('Deep link received:', url);

      if (url && url.includes('auth-callback')) {
        try {
          // Try to parse the URL for tokens
          // Supabase may send tokens in fragment (#) or query (?)
          let params: URLSearchParams | null = null;

          // Check for fragment parameters (after #)
          if (url.includes('#')) {
            const fragment = url.split('#')[1];
            params = new URLSearchParams(fragment);
          }
          // Check for query parameters (after ?)
          else if (url.includes('?')) {
            const query = url.split('?')[1];
            params = new URLSearchParams(query);
          }

          if (params) {
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            console.log('Tokens found:', {
              hasAccess: !!accessToken,
              hasRefresh: !!refreshToken
            });

            if (accessToken && refreshToken) {
              // Set the session with the tokens
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (error) {
                console.error('Error setting session:', error);
              } else {
                console.log('Session set successfully');
                // Force a re-check of auth state
                const { data: { session } } = await supabase.auth.getSession();
                console.log('Session after setting:', !!session);
              }
            } else {
              // If no tokens in URL, check if session exists from the verification
              console.log('No tokens in URL, checking for existing session');
              const { data: { session } } = await supabase.auth.getSession();
              console.log('Existing session found:', !!session);
            }
          }
        } catch (error) {
          console.error('Error handling deep link:', error);
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