-- Add has_premium_access column to profiles table
-- This allows granting free premium access to specific users
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_premium_access BOOLEAN DEFAULT FALSE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_premium_access ON profiles(has_premium_access) WHERE has_premium_access = TRUE;
