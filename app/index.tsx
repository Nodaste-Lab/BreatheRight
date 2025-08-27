import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/auth';

export default function IndexScreen() {
  const { user, initialized, initialize } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    if (user) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/sign-in');
    }
  }, [user, initialized]);

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );
}