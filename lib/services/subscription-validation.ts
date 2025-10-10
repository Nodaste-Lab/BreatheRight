import { Platform } from 'react-native';
import { supabase } from '../supabase/client';

// Import Purchase type conditionally to avoid Expo Go crash
type Purchase = any;

/**
 * Backend Receipt Validation
 *
 * This module handles server-side validation of App Store and Google Play receipts.
 *
 * WHY YOU NEED THIS:
 * - Client-side validation alone is insecure and can be bypassed
 * - Receipts can be forged or replayed
 * - Subscription status needs to be verified with Apple/Google servers
 * - You need to track subscription state in your database
 *
 * WHAT YOU NEED TO BUILD:
 *
 * 1. Backend API Endpoint (e.g., POST /api/subscriptions/validate)
 *    - Receives receipt data from the mobile app
 *    - Validates receipt with Apple/Google servers
 *    - Stores subscription status in your database
 *    - Returns validation result to the app
 *
 * 2. Apple App Store Validation (iOS):
 *    - Use Apple's verifyReceipt API
 *    - Production URL: https://buy.itunes.apple.com/verifyReceipt
 *    - Sandbox URL: https://sandbox.itunes.apple.com/verifyReceipt
 *    - Parse the response to check:
 *      • Receipt validity
 *      • Subscription expiration date
 *      • Auto-renewal status
 *      • Cancellation date (if any)
 *
 * 3. Google Play Validation (Android):
 *    - Use Google Play Developer API
 *    - Requires OAuth 2.0 authentication
 *    - Check subscription status via:
 *      purchases.subscriptions.get API
 *    - Verify:
 *      • Purchase token validity
 *      • Subscription state (active, expired, canceled)
 *      • Expiration timestamp
 *
 * 4. Database Schema (recommended):
 *    - Store in your Supabase database:
 *      • user_id
 *      • platform (ios/android)
 *      • product_id
 *      • transaction_id / order_id
 *      • purchase_date
 *      • expiration_date
 *      • is_active
 *      • auto_renewing
 *      • last_validated_at
 */

interface ValidationResponse {
  isValid: boolean;
  expiresAt?: Date;
  isActive?: boolean;
  productId?: string;
}

/**
 * Validates a purchase receipt with your backend server
 *
 * @param receipt - The transaction receipt from the purchase
 * @param purchase - The full purchase object
 * @returns Promise<boolean> - True if the subscription is valid and active
 *
 * IMPLEMENTATION STEPS:
 *
 * 1. Create a backend API endpoint (e.g., in Supabase Edge Functions or Express.js)
 * 2. Send receipt data to your backend
 * 3. Backend validates with Apple/Google
 * 4. Backend stores subscription status in database
 * 5. Backend returns validation result
 * 6. App updates local state based on result
 */
export async function validateReceiptWithBackend(
  receipt: string | undefined,
  purchase: Purchase
): Promise<boolean> {
  console.log('=== validateReceiptWithBackend START ===');
  console.log('Receipt provided?', !!receipt);

  if (!receipt) {
    console.error('No receipt provided for validation');
    return false;
  }

  try {
    // Get the current session
    console.log('Getting session...');
    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log('Session exists?', !!session);
    console.log('User ID:', session?.user?.id);

    if (!session) {
      console.error('No active session for validation');
      console.error('ERROR: User must be logged in to purchase subscriptions');
      // For production: require authentication for purchases
      return false;
    }

    // Get Supabase URL from environment
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    console.log('Supabase URL:', supabaseUrl);

    if (!supabaseUrl) {
      console.error('EXPO_PUBLIC_SUPABASE_URL not configured');
      console.error('ERROR: Cannot validate subscription without Supabase URL');
      return false;
    }

    // Call the Edge Function to validate receipt
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/validate-subscription`;
    console.log('Calling edge function:', edgeFunctionUrl);
    // In v14, transactionId is in the `id` field
    const transactionId = purchase.transactionId || (purchase as any).id;

    console.log('Request body:', {
      platform: Platform.OS,
      productId: purchase.productId,
      transactionId,
      receiptLength: receipt.length,
    });

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        receipt,
        platform: Platform.OS,
        productId: purchase.productId,
        transactionId,
        purchaseToken: (purchase as any).purchaseToken,
      }),
    });

    console.log('Edge function response status:', response.status);
    console.log('Edge function response ok?', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Receipt validation failed:', response.status, errorText);
      console.error('ERROR: Edge function returned error');
      return false;
    }

    const data: ValidationResponse = await response.json();
    console.log('Edge function response data:', data);

    // Check if subscription is valid and active
    if (data.isValid && data.isActive) {
      // Optionally check expiration date
      if (data.expiresAt) {
        const expirationDate = new Date(data.expiresAt);
        const now = new Date();

        if (expirationDate < now) {
          console.log('Subscription has expired');
          return false;
        }
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error validating receipt with backend:', error);
    return false;
  }
}

/**
 * Example Backend Implementation (Supabase Edge Function)
 *
 * File: supabase/functions/validate-subscription/index.ts
 *
 * ```typescript
 * import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
 *
 * serve(async (req) => {
 *   const { receipt, platform, productId, transactionId } = await req.json()
 *
 *   if (platform === 'ios') {
 *     // Validate with Apple
 *     const response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
 *       method: 'POST',
 *       body: JSON.stringify({
 *         'receipt-data': receipt,
 *         'password': 'YOUR_SHARED_SECRET', // From App Store Connect
 *       }),
 *     })
 *
 *     const data = await response.json()
 *
 *     // Parse Apple's response
 *     if (data.status === 0) {
 *       const latestReceipt = data.latest_receipt_info[0]
 *       const expiresDate = new Date(parseInt(latestReceipt.expires_date_ms))
 *       const isActive = expiresDate > new Date()
 *
 *       // Store in database
 *       await supabase.from('subscriptions').upsert({
 *         user_id: req.user.id,
 *         platform: 'ios',
 *         product_id: productId,
 *         transaction_id: transactionId,
 *         expires_at: expiresDate,
 *         is_active: isActive,
 *       })
 *
 *       return new Response(JSON.stringify({
 *         isValid: true,
 *         isActive,
 *         expiresAt: expiresDate,
 *       }))
 *     }
 *   } else if (platform === 'android') {
 *     // Validate with Google Play
 *     // Use Google Play Developer API
 *     // ... implementation here
 *   }
 *
 *   return new Response(JSON.stringify({ isValid: false }))
 * })
 * ```
 */

/**
 * Example Database Schema (Supabase SQL)
 *
 * ```sql
 * CREATE TABLE subscriptions (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
 *   platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
 *   product_id TEXT NOT NULL,
 *   transaction_id TEXT UNIQUE NOT NULL,
 *   purchase_token TEXT, -- For Android
 *   purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   expires_at TIMESTAMPTZ NOT NULL,
 *   is_active BOOLEAN DEFAULT true,
 *   auto_renewing BOOLEAN DEFAULT true,
 *   last_validated_at TIMESTAMPTZ DEFAULT NOW(),
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- Index for quick lookup
 * CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
 * CREATE INDEX idx_subscriptions_active ON subscriptions(user_id, is_active);
 *
 * -- Function to check if user has active subscription
 * CREATE OR REPLACE FUNCTION has_active_subscription(user_uuid UUID)
 * RETURNS BOOLEAN AS $$
 * BEGIN
 *   RETURN EXISTS (
 *     SELECT 1 FROM subscriptions
 *     WHERE user_id = user_uuid
 *       AND is_active = true
 *       AND expires_at > NOW()
 *   );
 * END;
 * $$ LANGUAGE plpgsql;
 * ```
 */
