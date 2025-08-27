# Google Maps Platform Integration Guide

## Overview

BreathRight uses Google Maps Platform for:
- Air Quality API (10K free requests/month)
- Pollen API (5K free requests/month) 
- Current Conditions API for weather/lightning (10K free requests/month)
- Places API for location search

## Setup

### 1. Google Cloud Console

1. Create project: https://console.cloud.google.com
2. Enable APIs:
   ```
   - Air Quality API
   - Pollen API  
   - Places API
   - Maps SDK for iOS
   - Maps SDK for Android
   ```

### 2. API Key Configuration

Create API key with restrictions:
- Application restrictions: iOS/Android apps
- Bundle IDs: com.yourcompany.breathright
- API restrictions: Only enabled APIs

### 3. Supabase Edge Function Setup

Create Edge Function to proxy Google Maps requests:

```typescript
// supabase/functions/google-maps-proxy/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')!

serve(async (req) => {
  const { endpoint, params } = await req.json()
  
  // Validate request
  const allowedEndpoints = ['airquality', 'pollen', 'places']
  if (!allowedEndpoints.includes(endpoint)) {
    return new Response('Invalid endpoint', { status: 400 })
  }
  
  // Build Google Maps API URL
  const url = `https://maps.googleapis.com/maps/api/${endpoint}/json?${params}&key=${GOOGLE_MAPS_API_KEY}`
  
  // Fetch from Google
  const response = await fetch(url)
  const data = await response.json()
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

## API Usage

### Air Quality

```typescript
// lib/api/air-quality.ts
export async function getAirQuality(lat: number, lng: number) {
  const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
    body: {
      endpoint: 'airquality',
      params: `location=${lat},${lng}`
    }
  })
  
  if (error) throw error
  return data
}
```

### Pollen Data

```typescript
// lib/api/pollen.ts
export async function getPollenData(lat: number, lng: number) {
  const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
    body: {
      endpoint: 'pollen',
      params: `location=${lat},${lng}&days=1`
    }
  })
  
  if (error) throw error
  return data
}
```

### Places Search

```typescript
// lib/api/places.ts
export async function searchPlaces(query: string) {
  const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
    body: {
      endpoint: 'places/autocomplete',
      params: `input=${encodeURIComponent(query)}&types=geocode`
    }
  })
  
  if (error) throw error
  return data
}
```

## Rate Limiting

Implement client-side rate limiting:

```typescript
// utils/rate-limiter.ts
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  canMakeRequest(endpoint: string, limit: number): boolean {
    const now = Date.now()
    const hourAgo = now - 3600000
    
    const requests = this.requests.get(endpoint) || []
    const recentRequests = requests.filter(time => time > hourAgo)
    
    if (recentRequests.length >= limit) {
      return false
    }
    
    recentRequests.push(now)
    this.requests.set(endpoint, recentRequests)
    return true
  }
}

export const rateLimiter = new RateLimiter()
```

## Error Handling

```typescript
// utils/google-maps-errors.ts
export class GoogleMapsError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message)
    this.name = 'GoogleMapsError'
  }
}

export function handleGoogleMapsError(error: any): never {
  if (error.error_message) {
    throw new GoogleMapsError(
      error.error_message,
      error.status,
      error.code || 'UNKNOWN_ERROR'
    )
  }
  throw error
}
```

## Monitoring

Track API usage in Supabase:

```sql
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  response_time_ms INTEGER,
  status_code INTEGER
);

-- Daily usage view
CREATE VIEW daily_api_usage AS
SELECT 
  DATE(timestamp) as date,
  endpoint,
  COUNT(*) as request_count,
  AVG(response_time_ms) as avg_response_time
FROM api_usage
GROUP BY DATE(timestamp), endpoint;
```