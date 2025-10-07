-- Add custom name fields for morning and evening reports
-- Allows users to personalize their alert names per location

ALTER TABLE public.alert_preferences
ADD COLUMN IF NOT EXISTS morning_report_name TEXT DEFAULT 'Morning Report',
ADD COLUMN IF NOT EXISTS evening_report_name TEXT DEFAULT 'Evening Report';

-- Update existing rows to have the default names
UPDATE public.alert_preferences
SET morning_report_name = 'Morning Report'
WHERE morning_report_name IS NULL;

UPDATE public.alert_preferences
SET evening_report_name = 'Evening Report'
WHERE evening_report_name IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN alert_preferences.morning_report_name IS 'Custom name for morning report notifications';
COMMENT ON COLUMN alert_preferences.evening_report_name IS 'Custom name for evening report notifications';
