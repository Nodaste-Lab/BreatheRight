import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' }
        }}
      >
        <Stack.Screen 
          name="sign-in" 
          options={{ title: 'Sign In' }} 
        />
        <Stack.Screen 
          name="sign-up" 
          options={{ title: 'Sign Up' }} 
        />
        <Stack.Screen 
          name="forgot-password" 
          options={{ title: 'Reset Password' }} 
        />
        <Stack.Screen 
          name="reset-password" 
          options={{ title: 'Set New Password' }} 
        />
      </Stack>
    </>
  );
}