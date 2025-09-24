import React, { useState } from 'react';
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

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type SignInForm = z.infer<typeof signInSchema>;

export default function SignInScreen() {
  const { signInWithMagicLink, loading } = useAuthStore();
  const [emailSent, setEmailSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: SignInForm) => {
    try {
      const result = await signInWithMagicLink(data.email);
      if (result.needsEmailConfirmation) {
        setEmailSent(true);
      }
    } catch (error: any) {
      Alert.alert(
        'Sign In Failed',
        error.message || 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const resendEmail = async () => {
    const { email } = control._formValues;
    if (email) {
      await onSubmit({ email });
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to:
            </Text>
            <Text style={styles.email}>{control._formValues.email}</Text>
          </View>

          <View style={styles.instructionsContainer}>
            <Text style={styles.instructions}>
              Check your email for a 6-digit verification code.
            </Text>
            <Text style={styles.instructions}>
              If you don't see the email, check your spam folder or look for an email from "Supabase Auth".
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Enter Code"
              onPress={() => {
                router.push({
                  pathname: '/(auth)/verify-otp',
                  params: { email: control._formValues.email },
                });
              }}
              fullWidth
              variant="primary"
              size="md"
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Resend Email"
              onPress={resendEmail}
              disabled={loading}
              loading={loading}
              fullWidth
              variant="secondary"
              size="md"
            />
          </View>

          <View style={styles.linkContainer}>
            <Link href="/(auth)/sign-up">
              <Text style={styles.linkButton}>Create Account</Text>
            </Link>
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
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Enter your email and we'll send you a code to sign in
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
                title={loading ? 'Sending Code...' : 'Send Code'}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
                loading={loading}
                fullWidth
                variant="primary"
                size="md"
              />
            </View>

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Don&apos;t have an account? </Text>
              <Link href="/(auth)/sign-up">
                <Text style={styles.linkButton}>Sign Up</Text>
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
    backgroundColor: 'transparent', // Allow gradient to show through
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
    fontSize: 24,
    fontWeight: '700',
    color: '#491124',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#2563EB',
    fontSize: 14,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9CA3AF',
    fontSize: 14,
  },
  magicLinkButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  magicLinkButtonText: {
    color: '#491124',
    fontSize: 16,
    fontWeight: '600',
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: '#491124',
    marginTop: 8,
  },
  instructionsContainer: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  instructions: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
});