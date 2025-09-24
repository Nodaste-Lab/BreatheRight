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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useAuthStore } from '../../store/auth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const otpSchema = z.object({
  token: z.string().length(6, 'Verification code must be exactly 6 digits'),
});

type OtpForm = z.infer<typeof otpSchema>;

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { verifyOtp, loading } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      token: '',
    },
  });

  const onSubmit = async (data: OtpForm) => {
    try {
      await verifyOtp(email || '', data.token);
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(
        'Verification Failed',
        error.message || 'Invalid verification code. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

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
              <Text style={styles.title}>Enter Verification Code</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit code to:
              </Text>
              <Text style={styles.email}>{email}</Text>
            </View>

            <View style={styles.form}>
              <Controller
                control={control}
                name="token"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Verification Code"
                    required
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="000000"
                    error={errors.token?.message}
                  />
                )}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title={loading ? 'Verifying...' : 'Verify'}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
                loading={loading}
                fullWidth
                variant="primary"
                size="md"
              />
            </View>

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Didn't receive the code? </Text>
              <Text
                style={styles.linkButton}
                onPress={() => router.back()}
              >
                Request new code
              </Text>
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
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: '#491124',
    marginTop: 8,
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