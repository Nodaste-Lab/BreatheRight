-- Migration: Add 'custom' alert type to ai_alerts table
-- Date: 2025-01-12
-- Description: Updates the alert_type CHECK constraint to allow 'custom' in addition to 'morning' and 'evening'

-- Drop the existing CHECK constraint
ALTER TABLE ai_alerts DROP CONSTRAINT IF EXISTS ai_alerts_alert_type_check;

-- Add the new CHECK constraint with 'custom' included
ALTER TABLE ai_alerts
ADD CONSTRAINT ai_alerts_alert_type_check
CHECK (alert_type IN ('morning', 'evening', 'custom'));

-- Update comments
COMMENT ON TABLE ai_alerts IS 'Cached OpenAI-generated alert messages for morning, evening, and custom reports';
COMMENT ON COLUMN ai_alerts.alert_type IS 'Type of alert: morning (day planning), evening (summary/prep), or custom (user-defined time)';
