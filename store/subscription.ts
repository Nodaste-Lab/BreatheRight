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

interface Subscription {
  id: string;
  user_id: string;
  product_id: string;
  transaction_id: string;
  expires_at: string;
  is_active: boolean;
  auto_renewing: boolean;
  platform: string;
  created_at: string;
  updated_at: string;
}

interface SubscriptionState {
  hasActiveSubscription: boolean;
  hasPremiumAccess: boolean;
  currentSubscription: Subscription | null;
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
  currentSubscription: null,
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
          console.log('=== PURCHASE UPDATED ===');
          console.log('Purchase object:', JSON.stringify(purchase, null, 2));
          console.log('Purchase keys:', Object.keys(purchase));
          console.log('Platform:', Platform.OS);

          try {
            // Set loading false since purchase completed
            set({ loading: false });

            // Validate receipt with your backend before finishing transaction
            // In v14, the receipt is always in purchaseToken for both iOS and Android
            // For iOS, it's a JWT token, for Android it's the purchase token
            const receipt = purchase.purchaseToken;

            console.log('Receipt exists?', !!receipt);
            console.log('Receipt (first 50 chars):', receipt ? receipt.substring(0, 50) + '...' : 'null');

            if (!receipt) {
              console.error('No receipt token found in purchase');
              set({ error: 'No receipt found', loading: false });
              return;
            }

            console.log('Calling validateReceiptWithBackend...');

            const isValid = await validateReceiptWithBackend(receipt, purchase);
            console.log('Validation result:', isValid);

            if (!isValid) {
              console.error('Receipt validation failed');
              set({ error: 'Receipt validation failed', loading: false });
              return;
            }

            console.log('Finishing transaction...');
            // Finish the transaction
            await finishTransaction({ purchase, isConsumable: false });
            console.log('Transaction finished');

            // Verify the purchase and update state
            console.log('Checking subscription status...');
            await get().checkSubscription();
            console.log('Subscription check complete');
          } catch (error) {
            console.error('Error finishing transaction:', error);
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
            set({ error: 'Failed to process purchase', loading: false });
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
      console.log('=== checkSubscription START ===');
      set({ loading: true, error: null });

      // First, check database for active subscription (most reliable)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log('User in checkSubscription:', user ? user.id : 'No user');

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
            currentSubscription: dbSubscriptions[0] as Subscription,
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
          // In v14, purchaseToken is used for both iOS and Android
          const receipt = (purchase as any).purchaseToken;

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
            currentSubscription: updatedSubs[0] as Subscription,
            hasActiveSubscription: true,
            hasPremiumAccess: false,
            loading: false,
          });
          return true;
        }
      }

      // No active subscriptions found
      console.log('No active subscriptions found');
      set({
        purchases: subscriptionPurchases,
        hasActiveSubscription: false,
        hasPremiumAccess: false,
        loading: false,
      });

      console.log('=== checkSubscription END: returning false ===');
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
      // But also set a timeout to reset loading state if listener doesn't fire
      setTimeout(() => {
        const state = get();
        if (state.loading) {
          console.warn('Purchase listener did not fire within 10 seconds, resetting loading state');
          set({ loading: false });
        }
      }, 10000);
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
