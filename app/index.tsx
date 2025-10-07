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
    console.log('=== INDEX ROUTING LOGIC ===');
    console.log('initialized:', initialized);
    console.log('subscriptionInitialized:', subscriptionInitialized);
    console.log('user:', user ? 'exists' : 'null');
    console.log('hasActiveSubscription:', hasActiveSubscription);

    if (!initialized || !subscriptionInitialized) {
      console.log('Waiting for initialization...');
      return;
    }

    // First check if user is logged in
    if (!user) {
      // Not logged in - go to sign in
      console.log('No user - navigating to sign-in');
      router.replace('/(auth)/sign-in');
      return;
    }

    // User is logged in - check subscription status
    if (!hasActiveSubscription) {
      // Logged in but no subscription - show paywall
      console.log('User logged in but no subscription - showing paywall');
      setShowPaywall(true);
      return;
    }

    // Logged in with active subscription - go to app
    console.log('User has subscription - navigating to tabs');
    router.replace('/(tabs)');
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