import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/auth';
import { useSubscriptionStore } from '../store/subscription';
import { SubscriptionPaywall } from '../components/SubscriptionPaywall';

export default function IndexScreen() {
  const { user, initialized, initialize } = useAuthStore();
  const {
    hasActiveSubscription,
    initialized: subscriptionInitialized,
    initialize: initializeSubscription,
  } = useSubscriptionStore();
  const router = useRouter();
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    initialize();
    initializeSubscription();
  }, []);

  useEffect(() => {
    if (!initialized || !subscriptionInitialized) return;

    // Check if user has an active subscription
    if (!hasActiveSubscription) {
      setShowPaywall(true);
      return;
    }

    // If subscription is active, proceed with normal auth flow
    if (user) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/sign-in');
    }
  }, [user, initialized, hasActiveSubscription, subscriptionInitialized]);

  // Show paywall if subscription is not active
  if (showPaywall) {
    return <SubscriptionPaywall />;
  }

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );
}