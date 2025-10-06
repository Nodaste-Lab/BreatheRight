-- Migration: Create subscriptions table for managing user subscriptions
-- Description: This table stores iOS and Android subscription data validated against App Store/Play Store

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  product_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  purchase_token TEXT, -- For Android
  original_transaction_id TEXT, -- For iOS
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  auto_renewing BOOLEAN DEFAULT true,
  cancellation_date TIMESTAMPTZ,
  last_validated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique transaction IDs
  CONSTRAINT unique_transaction_id UNIQUE (transaction_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_active
  ON public.subscriptions(user_id, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at
  ON public.subscriptions(expires_at);

CREATE INDEX IF NOT EXISTS idx_subscriptions_transaction
  ON public.subscriptions(transaction_id);

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = user_uuid
      AND is_active = true
      AND expires_at > NOW()
  );
END;
$$;

-- Function to get user's active subscription
CREATE OR REPLACE FUNCTION public.get_active_subscription(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  product_id TEXT,
  platform TEXT,
  expires_at TIMESTAMPTZ,
  auto_renewing BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.product_id,
    s.platform,
    s.expires_at,
    s.auto_renewing
  FROM public.subscriptions s
  WHERE s.user_id = user_uuid
    AND s.is_active = true
    AND s.expires_at > NOW()
  ORDER BY s.expires_at DESC
  LIMIT 1;
END;
$$;

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;

-- Policy: Users can read their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Only service role can insert/update/delete
-- This ensures only the backend (with service role key) can modify subscriptions
CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.has_active_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_subscription(UUID) TO authenticated;

-- Add helpful comment
COMMENT ON TABLE public.subscriptions IS
  'Stores validated in-app purchase subscriptions from iOS App Store and Google Play Store';
