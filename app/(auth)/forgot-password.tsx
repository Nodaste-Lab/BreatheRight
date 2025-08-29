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
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useAuthStore } from '../../store/auth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordScreen() {
  const { resetPassword, loading } = useAuthStore();
  const [emailSent, setEmailSent] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      console.log('Sending password reset email...');
      await resetPassword(data.email);
      console.log('Password reset email sent successfully');
      
      setEmailSent(true);
      
      Alert.alert(
        'Password Reset Sent',
        'Check your email for instructions to reset your password.',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('Alert OK pressed, navigating back...');
              reset();
              router.back();
            },
          },
        ]
      );
      
      // Fallback redirect after 3 seconds if alert doesn't work
      setTimeout(() => {
        console.log('Automatic redirect back to sign-in...');
        router.push('/(auth)/sign-in');
      }, 3000);
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      Alert.alert(
        'Reset Failed',
        error.message || 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Check Your Email!</Text>
            <Text style={styles.subtitle}>
              We sent you password reset instructions. Check your email and follow the link to reset your password.
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
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter your email address and we&apos;ll send you instructions to reset your password
              </Text>
            </View>

            <View style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email"
                    required
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Enter your email"
                    error={errors.email?.message}
                  />
                )}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title={loading ? 'Sending Instructions...' : 'Send Reset Instructions'}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
                loading={loading}
                fullWidth
              />
            </View>

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Remember your password? </Text>
              <Link href="/(auth)/sign-in">
                <Text style={styles.linkButton}>Sign In</Text>
              </Link>
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
  linkButton: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
});