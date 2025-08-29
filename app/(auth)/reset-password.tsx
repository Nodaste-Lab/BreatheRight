import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabase/client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const { updatePassword, loading } = useAuthStore();
  const [passwordUpdated, setPasswordUpdated] = React.useState(false);
  const [sessionRecovered, setSessionRecovered] = React.useState(false);
  const [sessionError, setSessionError] = React.useState<string | null>(null);
  const params = useLocalSearchParams();

  // Recover session from URL hash params
  React.useEffect(() => {
    const handleAuthSession = async () => {
      try {
        // Get the URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('URL hash params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });

        if (type === 'recovery' && accessToken && refreshToken) {
          console.log('Recovering session from URL params...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Session recovery error:', error);
            setSessionError(error.message);
          } else {
            console.log('Session recovered successfully:', !!data.session);
            setSessionRecovered(true);
          }
        } else if (type === 'recovery') {
          setSessionError('Invalid or missing authentication tokens in URL');
        } else {
          // Check if we already have a session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('Existing session found');
            setSessionRecovered(true);
          } else {
            setSessionError('No authentication session found. Please request a new password reset.');
          }
        }
      } catch (error) {
        console.error('Auth session handling error:', error);
        setSessionError('Failed to authenticate. Please request a new password reset.');
      }
    };

    handleAuthSession();
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      console.log('Updating password...');
      await updatePassword(data.password);
      console.log('Password updated successfully');
      
      setPasswordUpdated(true);
      
      Alert.alert(
        'Password Updated',
        'Your password has been successfully updated. You can now sign in with your new password.',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('Alert OK pressed, navigating to sign-in...');
              router.replace('/(auth)/sign-in');
            },
          },
        ]
      );
      
      // Fallback redirect after 3 seconds if alert doesn't work
      setTimeout(() => {
        console.log('Automatic redirect to sign-in...');
        router.replace('/(auth)/sign-in');
      }, 3000);
      
    } catch (error: any) {
      console.error('Password update error:', error);
      Alert.alert(
        'Update Failed',
        error.message || 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Show error state if session recovery failed
  if (sessionError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Authentication Error</Text>
            <Text style={styles.subtitle}>
              {sessionError}
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Request New Reset Link"
              onPress={() => router.push('/(auth)/forgot-password')}
              fullWidth
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading state while recovering session
  if (!sessionRecovered) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Authenticating...</Text>
            <Text style={styles.subtitle}>
              Please wait while we verify your reset link.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show success state after password update
  if (passwordUpdated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Password Updated!</Text>
            <Text style={styles.subtitle}>
              Your password has been successfully updated. You can now sign in with your new password.
            </Text>
          </View>
          
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Redirecting to sign in...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Set New Password</Text>
              <Text style={styles.subtitle}>
                Enter your new password below
              </Text>
            </View>

            <View style={styles.form}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="New Password"
                    required
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry
                    placeholder="Enter your new password"
                    error={errors.password?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Confirm New Password"
                    required
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry
                    placeholder="Confirm your new password"
                    error={errors.confirmPassword?.message}
                  />
                )}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title={loading ? 'Updating Password...' : 'Update Password'}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
                loading={loading}
                fullWidth
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 24,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: '#6B7280',
    fontSize: 16,
  },
});