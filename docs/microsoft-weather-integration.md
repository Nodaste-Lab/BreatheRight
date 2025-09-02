# Microsoft Weather Integration for BreathRight

This document outlines the Microsoft Azure Maps Weather API integration focusing on breathing and respiratory health data for the BreathRight mobile application.

## Overview

The Microsoft Weather integration provides comprehensive breathing-relevant data including:
- **Air Quality Data**: Current conditions and hourly forecasts with detailed pollutant breakdowns
- **Severe Weather Alerts**: Storm, fire, and air quality alerts that affect respiratory health
- **Daily Health Indices**: UV index, air quality indices, and outdoor activity recommendations
- **Pollen & Environmental Data**: Daily pollen forecasts integrated with air quality information

## Setup

1. **API Key Configuration**
   - Obtain an Azure Maps API key from the Azure portal
   - Add it to your environment variables as `EXPO_PUBLIC_AZURE_MAPS_API_KEY`

2. **Service Implementation**
   - Located in `lib/api/microsoft-weather.ts`
   - Provides multiple functions for breathing-relevant data

## API Functions

### Core Air Quality Functions

#### `fetchMicrosoftCurrentAirQuality(lat: number, lon: number): Promise<AQIData>`
Fetches current air quality with Microsoft's enhanced pollutant data including:
- Global air quality index with color-coded categories
- Individual pollutant concentrations (PM2.5, PM10, O3, NO2, SO2, CO)
- Dominant pollutant identification
- Health impact descriptions

#### `fetchMicrosoftAirQualityForecast(lat: number, lon: number, hours?: number): Promise<AQIData[]>`
Hourly air quality forecasts (1-96 hours) with:
- Hourly pollutant level predictions
- Air quality trend analysis
- Health recommendations for sensitive groups

### Health & Safety Functions

#### `fetchMicrosoftSevereWeatherAlerts(lat: number, lon: number)`
Severe weather alerts affecting respiratory health:
- Fire and smoke alerts
- Dust storm warnings
- High wind advisories
- Temperature extremes
- Thunderstorm and tornado warnings

#### `fetchMicrosoftDailyIndices(lat: number, lon: number, days?: number)`
Daily health indices including:
- UV Index with exposure recommendations
- Air Quality Index forecasts
- Outdoor Activity Index
- Running Weather Index
- General health and comfort indices

#### `fetchMicrosoftDailyForecastWithAirAndPollen(lat: number, lon: number, days?: number)`
Comprehensive daily forecasts with:
- Pollen data (grass, tree, weed, mold)
- UV index predictions
- Air quality integrated with weather conditions
- Temperature and humidity factors

### Comprehensive Data Function

#### `fetchMicrosoftBreathingData(lat: number, lon: number)`
One-stop function that fetches all breathing-relevant data:
- Current air quality conditions
- 24-hour air quality forecast
- Active severe weather alerts
- 5-day health indices
- 5-day pollen and environmental forecast

## Integration Points

### Location Store
The location store (`store/location.ts`) automatically fetches Microsoft breathing data when loading location information:
- Integrates seamlessly with existing air quality sources
- Provides enhanced pollutant details
- Adds severe weather alert monitoring
- Supplements pollen data with Microsoft's forecasts

### UI Components

#### LocationFeedCard Enhancements
- **Enhanced Air Quality**: Shows Microsoft's detailed air quality data with dominant pollutant
- **Severe Weather Alerts**: Displays active breathing-related alerts with severity indicators
- **Health Indices Grid**: Shows UV index, outdoor activity recommendations, and air quality forecasts
- **Alert Cards**: Interactive severe weather alert cards with timing and severity information

#### SevereWeatherAlert Component
New component for displaying breathing-related alerts:
- Color-coded severity levels (minor, moderate, severe, extreme)
- Category-specific icons (fire, storm, wind, etc.)
- Time-based information (start/end times)
- Geographic area affected
- Source attribution

## Data Processing

### Air Quality Conversion
Microsoft's air quality data is converted to standard US AQI format:
- Global AQ scale (0-100+) converted to US AQI (0-500)
- Category mapping: Excellent/Good → Good, Fair/Moderate → Moderate, etc.
- Preserves Microsoft's detailed descriptions and color coding
- Maintains dominant pollutant identification

### Alert Processing
Severe weather alerts are processed for breathing relevance:
- Priority-based sorting (highest risk first)
- Category filtering for respiratory impact
- Time-based filtering for active/upcoming alerts
- Geographic relevance to user location

## Health-Focused Features

### Respiratory Health Indicators
- **PM2.5 & PM10**: Fine and coarse particulate matter levels
- **Ozone (O3)**: Ground-level ozone concentrations
- **Nitrogen Dioxide (NO2)**: Traffic and industrial pollution indicator
- **Dominant Pollutant**: Primary air quality concern identification

### Environmental Health Alerts
- **Fire & Smoke**: Wildfire smoke affecting air quality
- **Dust Storms**: Particulate matter from weather events  
- **High Wind**: Pollen and particulate distribution alerts
- **Temperature Extremes**: Heat/cold affecting respiratory conditions

### Activity Recommendations
- **Outdoor Activity Index**: Safe exercise recommendations
- **UV Index**: Sun exposure guidance for outdoor activities
- **Running Weather**: Specific guidance for outdoor exercise
- **Air Quality Trends**: Hourly predictions for activity planning

## Error Handling & Fallbacks

- **Graceful Degradation**: App functions normally if Microsoft API is unavailable
- **Data Validation**: All responses validated against expected schemas
- **Fallback Strategy**: Falls back to existing air quality sources if Microsoft fails
- **Error Logging**: Comprehensive error tracking for monitoring API health

## Type Safety

Strong TypeScript typing throughout:
- `MicrosoftAirQualityResponse` - Raw API response format
- `MicrosoftWeatherData` - Processed data for app consumption
- `SevereWeatherAlert` - Alert data structure
- `DailyHealthIndex` - Health index data format

## Testing & Validation

### API Key Validation
- Environment variable presence checking
- Runtime API key validation
- Proper error messages for configuration issues

### Data Integration Testing
- Microsoft data compared with existing sources
- Alert filtering and processing validation
- UI display of enhanced data verified

## Future Enhancements

### Advanced Health Features
- Personalized health recommendations based on conditions
- Historical correlation of air quality and health symptoms
- Integration with health tracking apps
- Custom alert thresholds for sensitive individuals

### Enhanced Alert System
- Push notifications for severe breathing-related alerts
- Geofenced alerting for multiple locations
- Alert history and trend analysis
- Integration with calendar for outdoor activity planning

### AI-Powered Insights
- Machine learning for personalized recommendations
- Predictive modeling for air quality trends
- Smart suggestions based on user patterns and health data