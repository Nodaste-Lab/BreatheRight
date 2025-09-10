# Weather Data Sources Documentation

## Overview

BreatheRight supports multiple weather data providers, allowing users to choose their preferred source for air quality, weather, and environmental data. The app uses a unified weather service that ensures only the selected API is called, eliminating unnecessary API requests and costs.

## Architecture

### Unified Weather Service (`lib/api/unified-weather.ts`)

The core service that:
- Reads user's weather source preference from their profile
- Routes API calls to the appropriate provider
- Ensures consistent data format across all providers
- Provides fallback mechanisms for unsupported data types

**Key Principle**: Only ONE API is called per request - the one selected by the user.

## Available Weather Sources

### 1. Microsoft Azure Maps (Default)
- **Coverage**: Global
- **Strengths**: Most comprehensive data
- **Features**:
  - Current and forecast AQI
  - Pollen data (tree, grass, weed, mold)
  - Severe weather alerts
  - UV index
  - Daily health indices
  - Storm probability
- **Best for**: Users wanting comprehensive environmental data

### 2. Google Maps
- **Coverage**: Global
- **Strengths**: Strong AQI with health recommendations
- **Features**:
  - Universal AQI
  - Detailed pollutant concentrations
  - Health recommendations by population group
  - Local AQI calculations
- **Best for**: Users focused on health impacts

### 3. World Air Quality Index (WAQI)
- **Coverage**: Global (70+ countries)
- **Strengths**: Real-time data from official stations
- **Features**:
  - Real-time AQI
  - Individual pollutant indices
  - Forecast data
  - Attribution to data sources
- **Best for**: Users wanting official government data globally

### 4. PurpleAir
- **Coverage**: Primarily US, some global
- **Strengths**: Hyperlocal sensor network
- **Features**:
  - Community sensor data
  - EPA correction factors applied
  - 10-minute, 30-minute, 60-minute averages
  - Temperature and humidity
- **Best for**: Users wanting hyperlocal, real-time data

### 5. AirNow (EPA)
- **Coverage**: United States
- **Strengths**: Official US government data
- **Features**:
  - EPA-validated AQI
  - PM2.5, PM10, and Ozone data
  - Action day alerts
  - Official forecasts
- **Best for**: US users wanting official EPA data

### 6. OpenWeather
- **Coverage**: Global
- **Strengths**: Weather-focused
- **Features**:
  - Basic weather data
  - Storm probability calculations
  - Limited AQI support (falls back to Microsoft)
- **Best for**: Users primarily interested in weather

## Implementation Details

### User Settings

Users can change their weather source in:
**Settings → Preferences → Weather Source**

The selection is stored in the Supabase `profiles` table in the `weather_source` column.

### Data Flow

1. User selects weather source in Settings
2. Choice is saved to their profile in Supabase
3. When data is requested:
   - `getWeatherSource()` reads from user profile
   - Appropriate API is called based on selection
   - Data is formatted to standard structure
   - UI displays the data

### API Efficiency

**Before**: The app used `combined-air-quality.ts` which called multiple APIs and averaged results.

**Now**: Only the selected API is called, reducing:
- API costs
- Network requests
- Response time
- Rate limit issues

## Adding New Weather Sources

To add a new weather source:

1. **Update Types** (`types/auth.ts`):
   ```typescript
   weather_source?: '...' | 'newsource';
   ```

2. **Create API Module** (`lib/api/newsource.ts`):
   ```typescript
   export async function fetchNewSourceData(lat: number, lon: number): Promise<AQIData> {
     // Implementation
   }
   ```

3. **Update Unified Service** (`lib/api/unified-weather.ts`):
   - Import the new module
   - Add case in `fetchUnifiedAQIData()`
   - Update `getWeatherSourceDisplayName()`

4. **Update Settings UI** (`app/(tabs)/settings.tsx`):
   - Add to `weatherSourceOptions` array

5. **Update Database**:
   - Ensure Supabase column accepts new value

## Testing

To verify only the selected API is called:

1. Open browser DevTools Network tab
2. Change weather source in Settings
3. Navigate to home or location detail
4. Verify only one weather API request is made
5. Confirm it matches the selected source

## Environment Variables

Each weather source requires its API key in `.env.local`:

```env
EXPO_PUBLIC_AZURE_MAPS_API_KEY=xxx
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=xxx
EXPO_PUBLIC_WAQI_API_KEY=xxx
EXPO_PUBLIC_PURPLEAIR_API_KEY=xxx
EXPO_PUBLIC_AIRNOW_API_KEY=xxx
EXPO_PUBLIC_OPENWEATHER_API_KEY=xxx
```

## Troubleshooting

### Issue: Wrong API being called
- Check `profile?.weather_source` value
- Verify profile is loaded before API calls
- Check for cached data

### Issue: Fallback to Microsoft
- Some sources don't support all data types
- OpenWeather has no native AQI support
- Check console for fallback warnings

### Issue: No data displayed
- Verify API key is set for selected source
- Check API rate limits
- Verify network connectivity
- Check error logs in console

## Performance Considerations

- Microsoft: Most data per call, slower response
- Google: Fast response, good coverage
- WAQI: Variable based on station availability
- PurpleAir: Fast for US locations
- AirNow: Reliable but US-only
- OpenWeather: Fast but limited AQI

## Future Improvements

- [ ] Cache data per source to reduce API calls
- [ ] Add source reliability indicators
- [ ] Implement smart source selection based on location
- [ ] Add data source attribution in UI
- [ ] Implement offline fallback