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
    hasPremiumAccess,
    initialized: subscriptionInitialized,
    initialize: initializeSubscription,
    checkSubscription,
  } = useSubscriptionStore();
  const router = useRouter();
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    initialize();
    initializeSubscription();
  }, []);

  // Re-check subscription when user logs in
  useEffect(() => {
    if (user && initialized) {
      console.log('User logged in, checking subscription status...');
      checkSubscription();
    }
  }, [user, initialized]);

  useEffect(() => {
    console.log('=== INDEX ROUTING LOGIC ===');
    console.log('initialized:', initialized);
    console.log('subscriptionInitialized:', subscriptionInitialized);
    console.log('user:', user ? 'exists' : 'null');
    console.log('hasActiveSubscription:', hasActiveSubscription);
    console.log('hasPremiumAccess:', hasPremiumAccess);

    if (!initialized || !subscriptionInitialized) {
      console.log('Waiting for initialization...');
      return;
    }

    // First check if user is logged in
    if (!user) {
      // Not logged in - go to sign up
      console.log('No user - navigating to sign-up');
      router.replace('/(auth)/sign-up');
      return;
    }

    // User is logged in - check subscription status or premium access
    const hasAccess = hasActiveSubscription || hasPremiumAccess;

    if (!hasAccess) {
      // Logged in but no subscription or premium access - show paywall
      console.log('User logged in but no subscription/premium access - showing paywall');
      setShowPaywall(true);
      return;
    }

    // Logged in with active subscription or premium access - go to app
    console.log('User has access - navigating to tabs');
    router.replace('/(tabs)');
  }, [user, initialized, hasActiveSubscription, hasPremiumAccess, subscriptionInitialized]);

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