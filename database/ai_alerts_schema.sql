-- AI Alerts Cache Table
-- Stores OpenAI-generated morning and evening alert messages
-- Shared across all users to minimize API costs

CREATE TABLE ai_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Cache identification
  cache_key text UNIQUE NOT NULL,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  
  -- Alert metadata
  alert_type text NOT NULL CHECK (alert_type IN ('morning', 'evening')),
  message text NOT NULL,
  
  -- Caching parameters (for fuzzy matching)
  weather_source text NOT NULL CHECK (weather_source IN ('openweather', 'microsoft', 'google', 'waqi', 'purpleair', 'airnow')),
  aqi_level integer NOT NULL, -- Rounded AQI value (nearest 5)
  pollen_level integer NOT NULL DEFAULT 0, -- Rounded pollen index (nearest 2)
  lightning_level integer NOT NULL DEFAULT 0, -- Rounded lightning probability (nearest 10%)
  
  -- Time-based caching
  cache_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '12 hours'), -- Shorter expiry for alerts
  
  -- Performance optimization
  last_accessed_at timestamp with time zone DEFAULT now(),
  access_count integer DEFAULT 1
);

-- Indexes for fast lookups
CREATE INDEX idx_ai_alerts_cache_key ON ai_alerts(cache_key);
CREATE INDEX idx_ai_alerts_location_type ON ai_alerts(location_id, alert_type, weather_source, cache_date);
CREATE INDEX idx_ai_alerts_expires_at ON ai_alerts(expires_at);
CREATE INDEX idx_ai_alerts_cache_date ON ai_alerts(cache_date);

-- Composite index for fuzzy matching queries
CREATE INDEX idx_ai_alerts_fuzzy_match ON ai_alerts(
  location_id, 
  alert_type,
  weather_source, 
  cache_date,
  aqi_level, 
  pollen_level, 
  lightning_level
);

-- Function to clean up expired alerts
CREATE OR REPLACE FUNCTION cleanup_expired_ai_alerts()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_alerts 
  WHERE expires_at < now() 
  OR cache_date < CURRENT_DATE - interval '3 days';
END;
$$ LANGUAGE plpgsql;

-- RLS Policies (if Row Level Security is enabled)
-- Allow all authenticated users to read alerts (shared cache)
CREATE POLICY "Allow authenticated users to read AI alerts" ON ai_alerts
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert new alerts
CREATE POLICY "Allow authenticated users to insert AI alerts" ON ai_alerts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update access tracking
CREATE POLICY "Allow authenticated users to update AI alert access" ON ai_alerts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE ai_alerts IS 'Cached OpenAI-generated alert messages for morning and evening reports';
COMMENT ON COLUMN ai_alerts.cache_key IS 'Unique identifier: locationId-alertType-weatherSource-aqiLevel-pollenLevel-lightningLevel-cacheDate';
COMMENT ON COLUMN ai_alerts.alert_type IS 'Type of alert: morning (day planning) or evening (summary/prep)';
COMMENT ON COLUMN ai_alerts.message IS 'Generated alert message under 178 characters for push notifications';
COMMENT ON COLUMN ai_alerts.aqi_level IS 'Rounded AQI value (nearest 5) for fuzzy matching';
COMMENT ON COLUMN ai_alerts.pollen_level IS 'Rounded pollen index (nearest 2) for fuzzy matching';
COMMENT ON COLUMN ai_alerts.lightning_level IS 'Rounded lightning probability (nearest 10%) for fuzzy matching';
COMMENT ON COLUMN ai_alerts.cache_date IS 'Date-based cache expiration (alerts expire after 12 hours)';

-- Example cache keys:
-- 'uuid123-morning-microsoft-50-4-20-2025-01-15'
-- 'uuid456-evening-airnow-100-6-30-2025-01-15'