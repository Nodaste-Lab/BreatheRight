-- Add updated_at column to locations table
-- This fixes the trigger error when updating locations

ALTER TABLE public.locations
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing rows to have updated_at = created_at
UPDATE public.locations
SET updated_at = created_at
WHERE updated_at IS NULL;
