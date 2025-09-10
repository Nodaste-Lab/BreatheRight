-- AI Summaries Cache Table
-- Stores OpenAI-generated location summaries with smart caching
-- Shared across all users to minimize API costs

CREATE TABLE ai_summaries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Cache identification
  cache_key text UNIQUE NOT NULL,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  
  -- AI-generated content
  headline text NOT NULL,
  description text NOT NULL,
  
  -- Caching parameters (for fuzzy matching)
  weather_source text NOT NULL CHECK (weather_source IN ('openweather', 'microsoft', 'google', 'waqi', 'purpleair', 'airnow')),
  aqi_level integer NOT NULL, -- Rounded AQI value (nearest 5)
  pollen_level integer NOT NULL DEFAULT 0, -- Rounded pollen index (nearest 2)
  lightning_level integer NOT NULL DEFAULT 0, -- Rounded lightning probability (nearest 10%)
  
  -- Time-based caching
  cache_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '24 hours'),
  
  -- Performance optimization
  last_accessed_at timestamp with time zone DEFAULT now(),
  access_count integer DEFAULT 1
);

-- Indexes for fast lookups
CREATE INDEX idx_ai_summaries_cache_key ON ai_summaries(cache_key);
CREATE INDEX idx_ai_summaries_location_conditions ON ai_summaries(location_id, weather_source, aqi_level, pollen_level, lightning_level, cache_date);
CREATE INDEX idx_ai_summaries_expires_at ON ai_summaries(expires_at);
CREATE INDEX idx_ai_summaries_cache_date ON ai_summaries(cache_date);

-- Composite index for fuzzy matching queries
CREATE INDEX idx_ai_summaries_fuzzy_match ON ai_summaries(
  location_id, 
  weather_source, 
  cache_date,
  aqi_level, 
  pollen_level, 
  lightning_level
);

-- Function to clean up expired summaries
CREATE OR REPLACE FUNCTION cleanup_expired_ai_summaries()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_summaries 
  WHERE expires_at < now() 
  OR cache_date < CURRENT_DATE - interval '7 days';
END;
$$ LANGUAGE plpgsql;

-- Auto-cleanup trigger (runs daily via pg_cron if available)
-- Alternatively, can be called manually or via app logic

-- RLS Policies (if Row Level Security is enabled)
-- Allow all authenticated users to read summaries (shared cache)
CREATE POLICY "Allow authenticated users to read AI summaries" ON ai_summaries
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert new summaries
CREATE POLICY "Allow authenticated users to insert AI summaries" ON ai_summaries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update access tracking
CREATE POLICY "Allow authenticated users to update AI summary access" ON ai_summaries
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE ai_summaries IS 'Cached OpenAI-generated location summaries with fuzzy matching';
COMMENT ON COLUMN ai_summaries.cache_key IS 'Unique identifier for cache lookup: locationId-weatherSource-aqiLevel-pollenLevel-lightningLevel-cacheDate';
COMMENT ON COLUMN ai_summaries.aqi_level IS 'Rounded AQI value (nearest 5) for fuzzy matching';
COMMENT ON COLUMN ai_summaries.pollen_level IS 'Rounded pollen index (nearest 2) for fuzzy matching';
COMMENT ON COLUMN ai_summaries.lightning_level IS 'Rounded lightning probability (nearest 10%) for fuzzy matching';
COMMENT ON COLUMN ai_summaries.cache_date IS 'Date-based cache expiration (summaries expire daily)';
COMMENT ON COLUMN ai_summaries.access_count IS 'Track cache hit frequency for analytics';

-- Example cache keys:
-- 'uuid123-microsoft-50-4-20-2025-01-15'
-- 'uuid456-airnow-100-6-30-2025-01-15'