import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const APPLE_VERIFY_RECEIPT_URL_PRODUCTION = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_VERIFY_RECEIPT_URL_SANDBOX = 'https://sandbox.itunes.apple.com/verifyReceipt';
const APPLE_SHARED_SECRET = Deno.env.get('APPLE_SHARED_SECRET')!;

interface ValidationRequest {
  receipt: string;
  platform: 'ios' | 'android';
  productId: string;
  transactionId: string;
  purchaseToken?: string;
}

interface AppleValidationResult {
  isValid: boolean;
  isActive?: boolean;
  expiresAt?: Date;
  originalTransactionId?: string;
  autoRenewing?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with user's auth token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body: ValidationRequest = await req.json();
    const { receipt, platform, productId, transactionId } = body;

    console.log('Validating subscription:', { platform, productId, userId: user.id });

    if (platform === 'ios') {
      // Validate with Apple
      const validationResult = await validateAppleReceipt(receipt);

      if (validationResult.isValid && validationResult.isActive) {
        // Store in database using service role client
        const serviceClient = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        const { error: upsertError } = await serviceClient
          .from('subscriptions')
          .upsert(
            {
              user_id: user.id,
              platform: 'ios',
              product_id: productId,
              transaction_id: transactionId,
              original_transaction_id: validationResult.originalTransactionId,
              expires_at: validationResult.expiresAt?.toISOString(),
              is_active: validationResult.isActive,
              auto_renewing: validationResult.autoRenewing,
              last_validated_at: new Date().toISOString(),
            },
            {
              onConflict: 'transaction_id',
            }
          );

        if (upsertError) {
          console.error('Error storing subscription:', upsertError);
          return new Response(JSON.stringify({ error: 'Failed to store subscription' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(
          JSON.stringify({
            isValid: true,
            isActive: validationResult.isActive,
            expiresAt: validationResult.expiresAt,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    } else if (platform === 'android') {
      // TODO: Implement Google Play validation
      return new Response(
        JSON.stringify({ error: 'Android validation not yet implemented' }),
        {
          status: 501,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ isValid: false }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Validation error:', error);
    return new Response(JSON.stringify({ error: 'Validation failed', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function validateAppleReceipt(receiptData: string): Promise<AppleValidationResult> {
  // Try production first
  let response = await fetch(APPLE_VERIFY_RECEIPT_URL_PRODUCTION, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'receipt-data': receiptData,
      password: APPLE_SHARED_SECRET,
      'exclude-old-transactions': true,
    }),
  });

  let data = await response.json();

  // If sandbox receipt (status 21007), try sandbox URL
  if (data.status === 21007) {
    console.log('Retrying with sandbox URL');
    response = await fetch(APPLE_VERIFY_RECEIPT_URL_SANDBOX, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': receiptData,
        password: APPLE_SHARED_SECRET,
        'exclude-old-transactions': true,
      }),
    });
    data = await response.json();
  }

  console.log('Apple validation response:', { status: data.status });

  if (data.status !== 0) {
    console.error('Apple validation failed:', data.status);
    return { isValid: false };
  }

  // Get latest subscription info
  const latestReceipt = data.latest_receipt_info?.[0];
  if (!latestReceipt) {
    console.error('No receipt info found');
    return { isValid: false };
  }

  const expiresDate = new Date(parseInt(latestReceipt.expires_date_ms));
  const isActive = expiresDate > new Date();

  console.log('Subscription details:', {
    expiresDate: expiresDate.toISOString(),
    isActive,
    autoRenewing: latestReceipt.auto_renew_status === '1',
  });

  return {
    isValid: true,
    isActive,
    expiresAt: expiresDate,
    originalTransactionId: latestReceipt.original_transaction_id,
    autoRenewing: latestReceipt.auto_renew_status === '1',
  };
}
