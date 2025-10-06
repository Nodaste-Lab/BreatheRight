import { create } from 'zustand';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  Purchase,
  PurchaseError,
  getAvailablePurchases,
} from 'react-native-iap';
import { Platform } from 'react-native';
import { validateReceiptWithBackend } from '../lib/services/subscription-validation';
import { supabase } from '../lib/supabase/client';

// Subscription product IDs
export const SUBSCRIPTION_PRODUCTS = {
  monthly: 'AQ_Buddy_Monthly_Subscription',
  annual: 'AQ_Buddy_Annual_Subscription',
} as const;

const productIds = Object.values(SUBSCRIPTION_PRODUCTS);

interface SubscriptionState {
  hasActiveSubscription: boolean;
  hasPremiumAccess: boolean;
  purchases: Purchase[];
  loading: boolean;
  initialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  checkSubscription: () => Promise<boolean>;
  purchaseSubscription: (productId: string) => Promise<void>;
  restorePurchases: () => Promise<void>;
  cleanup: () => void;
  isSubscribed: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  hasActiveSubscription: false,
  hasPremiumAccess: false,
  purchases: [],
  loading: false,
  initialized: false,
  error: null,

  initialize: async () => {
    try {
      set({ loading: true, error: null });

      // Initialize IAP connection
      await initConnection();

      // Set up purchase listeners
      const purchaseUpdateSubscription = purchaseUpdatedListener(
        async (purchase: Purchase) => {
          console.log('Purchase updated:', purchase);

          try {
            // Validate receipt with your backend before finishing transaction
            // For iOS, the receipt is in transactionReceipt (base64 encoded)
            // For Android, use purchaseToken
            const receipt = Platform.OS === 'ios'
              ? (purchase as any).transactionReceipt // iOS receipt
              : (purchase as any).purchaseToken; // Android purchase token

            const isValid = await validateReceiptWithBackend(receipt, purchase);
            if (!isValid) {
              console.error('Receipt validation failed');
              return;
            }

            // Finish the transaction
            await finishTransaction({ purchase, isConsumable: false });

            // Verify the purchase and update state
            await get().checkSubscription();
          } catch (error) {
            console.error('Error finishing transaction:', error);
          }
        }
      );

      const purchaseErrorSubscription = purchaseErrorListener(
        (error: PurchaseError) => {
          console.error('Purchase error:', error);
          set({ error: error.message, loading: false });
        }
      );

      // Store listeners for cleanup
      (get() as any).purchaseUpdateSubscription = purchaseUpdateSubscription;
      (get() as any).purchaseErrorSubscription = purchaseErrorSubscription;

      // Check for existing subscriptions
      const hasActive = await get().checkSubscription();

      set({
        initialized: true,
        loading: false,
        hasActiveSubscription: hasActive,
      });
    } catch (error) {
      console.error('Error initializing IAP:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to initialize',
        loading: false,
        initialized: true,
      });
    }
  },

  checkSubscription: async () => {
    try {
      set({ loading: true, error: null });

      // First, check database for active subscription (most reliable)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check for premium access flag
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('has_premium_access')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error checking premium access:', profileError);
        } else if (profile?.has_premium_access) {
          console.log('User has premium access granted');
          set({
            purchases: [],
            hasActiveSubscription: false,
            hasPremiumAccess: true,
            loading: false,
          });
          return true;
        }

        // Check for active subscription
        const { data: dbSubscriptions, error: dbError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .gte('expires_at', new Date().toISOString())
          .order('expires_at', { ascending: false });

        if (dbError) {
          console.error('Error checking database subscriptions:', dbError);
        } else if (dbSubscriptions && dbSubscriptions.length > 0) {
          console.log('Active subscription found in database:', dbSubscriptions[0]);
          set({
            purchases: [],
            hasActiveSubscription: true,
            hasPremiumAccess: false,
            loading: false,
          });
          return true;
        }
      }

      // If no database subscription, check device purchases (fallback)
      // This handles cases where user hasn't validated yet
      const availablePurchases = await getAvailablePurchases();
      console.log('Available device purchases:', availablePurchases);

      // Filter for our subscription products
      const subscriptionPurchases = availablePurchases.filter((purchase) =>
        productIds.includes(purchase.productId as typeof productIds[number])
      );

      // If we find device purchases, trigger validation
      if (subscriptionPurchases.length > 0 && user) {
        console.log('Found device purchases, triggering validation');
        // Validate each purchase with backend
        for (const purchase of subscriptionPurchases) {
          const receipt =
            Platform.OS === 'ios'
              ? (purchase as any).transactionReceipt
              : (purchase as any).purchaseToken;

          await validateReceiptWithBackend(receipt, purchase);
        }

        // Re-check database after validation
        const { data: updatedSubs } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .gte('expires_at', new Date().toISOString())
          .order('expires_at', { ascending: false });

        if (updatedSubs && updatedSubs.length > 0) {
          set({
            purchases: subscriptionPurchases,
            hasActiveSubscription: true,
            hasPremiumAccess: false,
            loading: false,
          });
          return true;
        }
      }

      // No active subscriptions found
      set({
        purchases: subscriptionPurchases,
        hasActiveSubscription: false,
        hasPremiumAccess: false,
        loading: false,
      });

      return false;
    } catch (error) {
      console.error('Error checking subscription:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to check subscription',
        loading: false,
        hasActiveSubscription: false,
        hasPremiumAccess: false,
      });
      return false;
    }
  },

  purchaseSubscription: async (productId: string) => {
    try {
      set({ loading: true, error: null });

      console.log('Starting purchase for:', productId);
      console.log('fetchProducts available?', typeof fetchProducts);
      console.log('requestPurchase available?', typeof requestPurchase);

      // react-native-iap v14+ uses fetchProducts instead of getSubscriptions
      const products = await fetchProducts({ skus: [productId], type: 'subs' });
      console.log('Retrieved products:', products);

      if (!products || products.length === 0) {
        // Check if running in simulator (IAP not available)
        const isSimulator = Platform.OS === 'ios' && !Platform.isPad && (await import('expo-device')).default.isDevice === false;

        if (isSimulator) {
          console.warn('IAP not available in iOS Simulator. Please test on a real device or TestFlight.');
          throw new Error('In-app purchases are not available in the iOS Simulator. Please test on a real device or via TestFlight.');
        }

        throw new Error('Subscription product not found. Make sure products are configured in App Store Connect.');
      }

      const product = products[0];

      // For Android, we need the offer token
      let offerToken: string | undefined;
      if (Platform.OS === 'android' && product && typeof product === 'object' && 'subscriptionOfferDetails' in product) {
        const details = (product as any).subscriptionOfferDetails;
        if (Array.isArray(details) && details.length > 0) {
          offerToken = details[0]?.offerToken;
        }
      }

      // Request purchase with proper parameters for v14 API
      console.log('Requesting purchase with params:', {
        productId,
        offerToken,
      });

      // v14 API requires request object with platform-specific config
      await requestPurchase({
        type: 'subs',
        request: {
          ios: {
            sku: productId,
          },
          android: {
            skus: [productId],
            ...(offerToken && {
              subscriptionOffers: [
                {
                  sku: productId,
                  offerToken: offerToken,
                },
              ],
            }),
          },
        },
      });

      console.log('Purchase request sent successfully');
      // The purchase listener will handle the completion
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      const errorMessage = error instanceof Error ? error.message : 'Failed to purchase subscription';
      set({
        error: errorMessage,
        loading: false,
      });
      // Alert will be shown by the component
      throw new Error(errorMessage);
    }
  },

  restorePurchases: async () => {
    try {
      set({ loading: true, error: null });

      // Check subscription will restore and verify purchases
      await get().checkSubscription();

      set({ loading: false });
    } catch (error) {
      console.error('Error restoring purchases:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to restore purchases',
        loading: false,
      });
      throw error;
    }
  },

  cleanup: () => {
    const state = get() as any;

    // Remove listeners
    if (state.purchaseUpdateSubscription) {
      state.purchaseUpdateSubscription.remove();
    }
    if (state.purchaseErrorSubscription) {
      state.purchaseErrorSubscription.remove();
    }

    // End IAP connection
    endConnection();
  },

  isSubscribed: () => {
    const state = get();
    // Check if user has premium access flag first
    if (state.hasPremiumAccess) {
      return true;
    }
    // Then check for active subscription
    return state.hasActiveSubscription;
  },
}));
