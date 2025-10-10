-- Custom Alerts Table
-- Stores user-defined custom alerts with custom names and times

CREATE TABLE custom_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Link to user's location
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,

  -- Alert Configuration
  alert_name text NOT NULL,
  alert_time time NOT NULL,
  enabled boolean NOT NULL DEFAULT true,

  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX idx_custom_alerts_location ON custom_alerts(location_id);
CREATE INDEX idx_custom_alerts_enabled ON custom_alerts(enabled, alert_time);
CREATE INDEX idx_custom_alerts_location_enabled ON custom_alerts(location_id, enabled);

-- RLS Policies (if Row Level Security is enabled)
-- Users can only access custom alerts for their own locations
CREATE POLICY "Users can view their own custom alerts" ON custom_alerts
  FOR SELECT USING (
    location_id IN (
      SELECT id FROM locations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own custom alerts" ON custom_alerts
  FOR UPDATE USING (
    location_id IN (
      SELECT id FROM locations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert custom alerts for their locations" ON custom_alerts
  FOR INSERT WITH CHECK (
    location_id IN (
      SELECT id FROM locations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own custom alerts" ON custom_alerts
  FOR DELETE USING (
    location_id IN (
      SELECT id FROM locations WHERE user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_alerts_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_alerts_updated_at
  BEFORE UPDATE ON custom_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_alerts_updated_at();

-- Comments for documentation
COMMENT ON TABLE custom_alerts IS 'User-defined custom alerts with custom names and times per location';
COMMENT ON COLUMN custom_alerts.location_id IS 'Reference to the location this alert applies to';
COMMENT ON COLUMN custom_alerts.alert_name IS 'User-defined name for the alert';
COMMENT ON COLUMN custom_alerts.alert_time IS 'Time to send alert (user local time)';
COMMENT ON COLUMN custom_alerts.enabled IS 'Whether this custom alert is enabled';
