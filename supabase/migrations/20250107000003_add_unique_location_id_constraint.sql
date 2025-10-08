-- Add unique constraint to location_id in alert_preferences table
-- This ensures each location can only have one set of alert preferences

-- First, remove any duplicate rows (keep the most recently updated one)
DELETE FROM alert_preferences a
USING alert_preferences b
WHERE a.id < b.id
  AND a.location_id = b.location_id;

-- Now add the unique constraint
ALTER TABLE alert_preferences
ADD CONSTRAINT alert_preferences_location_id_unique UNIQUE (location_id);
