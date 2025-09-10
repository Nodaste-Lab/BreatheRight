-- Alert Preferences Table
-- Stores user preferences for morning/evening reports and threshold alerts

CREATE TABLE alert_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Link to user's location
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  
  -- Morning Report Settings
  morning_report_enabled boolean NOT NULL DEFAULT true,
  morning_report_time time NOT NULL DEFAULT '08:00:00',
  
  -- Evening Report Settings  
  evening_report_enabled boolean NOT NULL DEFAULT true,
  evening_report_time time NOT NULL DEFAULT '18:00:00',
  
  -- Threshold Alert Settings
  aqi_threshold_enabled boolean NOT NULL DEFAULT true,
  aqi_threshold integer NOT NULL DEFAULT 100,
  pollen_alert_enabled boolean NOT NULL DEFAULT true,
  storm_alert_enabled boolean NOT NULL DEFAULT true,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX idx_alert_preferences_location ON alert_preferences(location_id);
CREATE INDEX idx_alert_preferences_morning_enabled ON alert_preferences(morning_report_enabled, morning_report_time);
CREATE INDEX idx_alert_preferences_evening_enabled ON alert_preferences(evening_report_enabled, evening_report_time);

-- RLS Policies (if Row Level Security is enabled)
-- Users can only access preferences for their own locations
CREATE POLICY "Users can view their own alert preferences" ON alert_preferences
  FOR SELECT USING (
    location_id IN (
      SELECT id FROM locations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own alert preferences" ON alert_preferences
  FOR UPDATE USING (
    location_id IN (
      SELECT id FROM locations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert alert preferences for their locations" ON alert_preferences
  FOR INSERT WITH CHECK (
    location_id IN (
      SELECT id FROM locations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own alert preferences" ON alert_preferences
  FOR DELETE USING (
    location_id IN (
      SELECT id FROM locations WHERE user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_alert_preferences_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_alert_preferences_updated_at
  BEFORE UPDATE ON alert_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_preferences_updated_at();

-- Comments for documentation
COMMENT ON TABLE alert_preferences IS 'User preferences for morning/evening reports and threshold alerts per location';
COMMENT ON COLUMN alert_preferences.location_id IS 'Reference to the location these preferences apply to';
COMMENT ON COLUMN alert_preferences.morning_report_enabled IS 'Enable daily morning air quality report';
COMMENT ON COLUMN alert_preferences.morning_report_time IS 'Time to send morning report (user local time)';
COMMENT ON COLUMN alert_preferences.evening_report_enabled IS 'Enable daily evening air quality summary';
COMMENT ON COLUMN alert_preferences.evening_report_time IS 'Time to send evening report (user local time)';
COMMENT ON COLUMN alert_preferences.aqi_threshold_enabled IS 'Enable alerts when AQI exceeds threshold';
COMMENT ON COLUMN alert_preferences.aqi_threshold IS 'AQI level that triggers threshold alerts';
COMMENT ON COLUMN alert_preferences.pollen_alert_enabled IS 'Enable high pollen count alerts';
COMMENT ON COLUMN alert_preferences.storm_alert_enabled IS 'Enable severe weather/storm alerts';