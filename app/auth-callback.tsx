import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase/client';
import { useAuthStore } from '../store/auth';

export default function AuthCallbackScreen() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Handle the authentication when returning from magic link
    const handleAuth = async () => {
      try {
        // Check for an existing session (magic link should have set it)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          router.replace('/(auth)/sign-in');
          return;
        }

        if (session) {
          // Session exists, user is authenticated
          await initialize();
          router.replace('/(tabs)');
        } else {
          // No session found
          console.log('No session found after magic link');
          router.replace('/(auth)/sign-in');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        router.replace('/(auth)/sign-in');
      }
    };

    handleAuth();
  }, [initialize]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#491124" />
      <Text style={styles.text}>Signing you in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});