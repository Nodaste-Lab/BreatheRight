# Backend Receipt Validation Setup Guide

## Overview

This guide explains how to implement server-side validation for your AQ Buddy app subscriptions. **Backend validation is critical** - without it, users can easily bypass the subscription requirement.

## Why Backend Validation is Required

❌ **Without backend validation:**
- Users can modify the app to fake subscription status
- Receipts can be replayed or forged
- No way to track actual revenue
- Cannot enforce subscription expiration
- Vulnerable to piracy and fraud

✅ **With backend validation:**
- Receipts are verified directly with Apple/Google
- Subscription status stored securely in your database
- Can track renewals, cancellations, and refunds
- Prevents fraud and unauthorized access
- Enables features like family sharing control

---

## Implementation Steps

### Step 1: Create Database Schema

Add this table to your Supabase database:

```sql
-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  product_id TEXT NOT NULL,
  transaction_id TEXT UNIQUE NOT NULL,
  purchase_token TEXT, -- For Android
  original_transaction_id TEXT, -- For iOS
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  auto_renewing BOOLEAN DEFAULT true,
  cancellation_date TIMESTAMPTZ,
  last_validated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_active ON subscriptions(user_id, is_active);
CREATE INDEX idx_subscriptions_transaction ON subscriptions(transaction_id);

-- Function to check active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = user_uuid
      AND is_active = true
      AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Only backend can insert/update (via service role)
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');
```

---

### Step 2: Set Up Apple App Store Server Notifications (iOS)

1. **Get Shared Secret from App Store Connect:**
   - Go to App Store Connect
   - Select your app
   - Go to "App Information" → "App-Specific Shared Secret"
   - Generate and save the shared secret

2. **Configure Server Notifications (recommended):**
   - In App Store Connect, go to "App Information" → "App Store Server Notifications"
   - Set up a URL endpoint for Apple to send subscription events
   - This enables real-time updates for renewals, cancellations, refunds

---

### Step 3: Create Backend API Endpoint

Create a Supabase Edge Function to validate receipts:

**File: `supabase/functions/validate-subscription/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const APPLE_VERIFY_RECEIPT_URL_PRODUCTION = 'https://buy.itunes.apple.com/verifyReceipt'
const APPLE_VERIFY_RECEIPT_URL_SANDBOX = 'https://sandbox.itunes.apple.com/verifyReceipt'
const APPLE_SHARED_SECRET = Deno.env.get('APPLE_SHARED_SECRET')!

interface ValidationRequest {
  receipt: string
  platform: 'ios' | 'android'
  productId: string
  transactionId: string
  purchaseToken?: string
}

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const body: ValidationRequest = await req.json()
    const { receipt, platform, productId, transactionId } = body

    if (platform === 'ios') {
      // Validate with Apple
      const validationResult = await validateAppleReceipt(receipt)

      if (validationResult.isValid) {
        // Store in database using service role client
        const serviceClient = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        await serviceClient.from('subscriptions').upsert({
          user_id: user.id,
          platform: 'ios',
          product_id: productId,
          transaction_id: transactionId,
          original_transaction_id: validationResult.originalTransactionId,
          expires_at: validationResult.expiresAt,
          is_active: validationResult.isActive,
          auto_renewing: validationResult.autoRenewing,
          last_validated_at: new Date().toISOString(),
        }, {
          onConflict: 'transaction_id'
        })

        return new Response(JSON.stringify({
          isValid: true,
          isActive: validationResult.isActive,
          expiresAt: validationResult.expiresAt,
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }
    } else if (platform === 'android') {
      // Validate with Google Play
      const validationResult = await validateGooglePlayReceipt(
        body.purchaseToken!,
        productId
      )

      if (validationResult.isValid) {
        // Store in database
        const serviceClient = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        await serviceClient.from('subscriptions').upsert({
          user_id: user.id,
          platform: 'android',
          product_id: productId,
          transaction_id: transactionId,
          purchase_token: body.purchaseToken,
          expires_at: validationResult.expiresAt,
          is_active: validationResult.isActive,
          auto_renewing: validationResult.autoRenewing,
          last_validated_at: new Date().toISOString(),
        }, {
          onConflict: 'transaction_id'
        })

        return new Response(JSON.stringify({
          isValid: true,
          isActive: validationResult.isActive,
          expiresAt: validationResult.expiresAt,
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    return new Response(JSON.stringify({ isValid: false }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Validation error:', error)
    return new Response(JSON.stringify({ error: 'Validation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function validateAppleReceipt(receiptData: string) {
  // Try production first
  let response = await fetch(APPLE_VERIFY_RECEIPT_URL_PRODUCTION, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'receipt-data': receiptData,
      'password': APPLE_SHARED_SECRET,
      'exclude-old-transactions': true,
    }),
  })

  let data = await response.json()

  // If sandbox receipt, try sandbox URL
  if (data.status === 21007) {
    response = await fetch(APPLE_VERIFY_RECEIPT_URL_SANDBOX, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': receiptData,
        'password': APPLE_SHARED_SECRET,
        'exclude-old-transactions': true,
      }),
    })
    data = await response.json()
  }

  if (data.status !== 0) {
    return { isValid: false }
  }

  // Get latest subscription info
  const latestReceipt = data.latest_receipt_info?.[0]
  if (!latestReceipt) {
    return { isValid: false }
  }

  const expiresDate = new Date(parseInt(latestReceipt.expires_date_ms))
  const isActive = expiresDate > new Date()

  return {
    isValid: true,
    isActive,
    expiresAt: expiresDate,
    originalTransactionId: latestReceipt.original_transaction_id,
    autoRenewing: latestReceipt.auto_renew_status === '1',
  }
}

async function validateGooglePlayReceipt(purchaseToken: string, productId: string) {
  // TODO: Implement Google Play validation
  // Requires OAuth 2.0 and Google Play Developer API
  // See: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions/get

  throw new Error('Google Play validation not yet implemented')
}
```

---

### Step 4: Deploy the Edge Function

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
supabase secrets set APPLE_SHARED_SECRET=your_shared_secret_here

# Deploy the function
supabase functions deploy validate-subscription
```

---

### Step 5: Update Mobile App to Use Backend Validation

Update `store/subscription.ts` to uncomment the validation calls:

```typescript
// In purchaseUpdatedListener
const receipt = Platform.OS === 'ios'
  ? purchase.transactionReceipt
  : purchase.purchaseToken;

const isValid = await validateReceiptWithBackend(receipt, purchase);
if (!isValid) {
  console.error('Receipt validation failed');
  return;
}
```

Update `lib/services/subscription-validation.ts` with your actual endpoint:

```typescript
const response = await fetch('YOUR_SUPABASE_URL/functions/v1/validate-subscription', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`, // Get from Supabase auth
  },
  body: JSON.stringify({
    receipt,
    platform: Platform.OS,
    productId: purchase.productId,
    transactionId: purchase.transactionId,
    purchaseToken: purchase.purchaseToken,
  }),
});
```

---

### Step 6: Add Subscription Status Check in Auth Flow

Update `app/index.tsx` to also check the database:

```typescript
useEffect(() => {
  if (!user) return;

  // Check subscription status in database
  const checkDbSubscription = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single();

    setHasActiveSubscription(!!data);
  };

  checkDbSubscription();
}, [user]);
```

---

## Testing

### Development Testing:

1. **iOS Sandbox Testing:**
   - Create sandbox test accounts in App Store Connect
   - Sign out of App Store on device
   - Sign in with sandbox account when purchasing
   - Test monthly and annual subscriptions

2. **Backend Validation:**
   - Check Supabase logs to see validation requests
   - Verify subscription records in database
   - Test expired subscriptions (sandbox subscriptions expire quickly)

### Important Notes:

- Sandbox subscriptions renew much faster than production (e.g., 5 minutes instead of 1 month)
- Always test on real devices (not simulator) for IAP
- Use TestFlight for beta testing with real purchases
- Set up proper error handling for network failures

---

## Production Checklist

- [ ] Database schema created with RLS policies
- [ ] Apple Shared Secret configured
- [ ] Backend Edge Function deployed
- [ ] Backend validation enabled in app
- [ ] Subscription products created in App Store Connect
- [ ] App Store Server Notifications configured
- [ ] Privacy policy updated for subscriptions
- [ ] Terms of service include subscription terms
- [ ] Tested with sandbox accounts
- [ ] Tested subscription renewal
- [ ] Tested subscription cancellation
- [ ] Tested restore purchases
- [ ] Error handling for network failures
- [ ] Analytics tracking for subscription events

---

## Additional Resources

- [Apple Receipt Validation Guide](https://developer.apple.com/documentation/appstorereceipts/verifyreceipt)
- [Google Play Billing API](https://developer.android.com/google/play/billing)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [react-native-iap Documentation](https://github.com/hyochan/react-native-iap)
