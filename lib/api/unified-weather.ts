/**
 * Unified Weather Service
 * 
 * This service provides a single interface for fetching weather data from multiple providers.
 * It respects the user's selected weather source preference stored in their profile.
 * 
 * Key Features:
 * - Single API call per request (no averaging or multiple calls)
 * - Automatic fallback for unsupported data types
 * - Consistent data format across all providers
 * 
 * Supported Providers:
 * - Microsoft Azure: Comprehensive data (AQI, pollen, weather, alerts)
 * - Google: Strong AQI with health recommendations
 * - WAQI: Global air quality coverage
 * - PurpleAir: Hyperlocal sensor network data
 * - AirNow: Official US EPA data
 * - OpenWeather: Weather-focused (limited AQI support)
 */

import type { AQIData, LightningData, PollenData } from '../../types/location';
import { useAuthStore } from '../../store/auth';

// Import weather providers - only the selected one will be called
import { fetchWeatherData } from './weather';
import { 
  fetchMicrosoftCurrentAirQuality,
  fetchMicrosoftBreathingData,
  fetchMicrosoftDailyForecastWithAirAndPollen 
} from './microsoft-weather';
import { fetchGoogleAirQuality, fetchGooglePollenData } from './google-air-quality';
import { fetchWAQIData } from './waqi';
import { fetchPurpleAirData } from './purpleair';
import { fetchAirNowObservations } from './airnow';

export type WeatherSource = 'openweather' | 'microsoft' | 'google' | 'waqi' | 'purpleair' | 'airnow';

/**
 * Get the user's selected weather source from their profile
 * @returns The selected weather source, defaults to 'microsoft' if not set
 */
export function getWeatherSource(): WeatherSource {
  const profile = useAuthStore.getState().profile;
  return profile?.weather_source || 'microsoft';
}

/**
 * Convert AirNow observations to standard AQI format
 * AirNow returns separate observations for each pollutant, so we need to combine them
 * @param lat Latitude
 * @param lon Longitude
 * @returns Standard AQIData format
 */
async function convertAirNowToAQI(lat: number, lon: number): Promise<AQIData> {
  const observations = await fetchAirNowObservations(lat, lon);
  
  if (!observations || observations.length === 0) {
    throw new Error('No AirNow data available');
  }

  // Extract different pollutants
  const pm25Obs = observations.find(obs => obs.ParameterName === 'PM2.5');
  const pm10Obs = observations.find(obs => obs.ParameterName === 'PM10');
  const ozoneObs = observations.find(obs => obs.ParameterName === 'OZONE');
  
  // Use the highest AQI value
  const aqiValues = [pm25Obs?.AQI, pm10Obs?.AQI, ozoneObs?.AQI].filter(v => v !== undefined);
  const maxAQI = Math.max(...aqiValues);
  
  // Determine level from the observation with highest AQI
  const primaryObs = [pm25Obs, pm10Obs, ozoneObs]
    .filter(obs => obs && obs.AQI === maxAQI)[0];
  
  let level: AQIData['level'] = 'Unknown';
  if (primaryObs) {
    switch (primaryObs.Category.Name.toLowerCase()) {
      case 'good': level = 'Good'; break;
      case 'moderate': level = 'Moderate'; break;
      case 'unhealthy for sensitive groups': level = 'Unhealthy for Sensitive Groups'; break;
      case 'unhealthy': level = 'Unhealthy'; break;
      case 'very unhealthy': level = 'Very Unhealthy'; break;
      case 'hazardous': level = 'Hazardous'; break;
    }
  }

  return {
    aqi: maxAQI || -1,
    level,
    pollutants: {
      pm25: pm25Obs?.AQI || -1,
      pm10: pm10Obs?.AQI || -1,
      o3: ozoneObs?.AQI || -1,
      no2: -1,
      so2: -1,
      co: -1,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Fetch AQI data from the user's selected weather source
 * Only makes a single API call to the selected provider
 * @param lat Latitude
 * @param lon Longitude
 * @returns AQI data in standard format
 */
export async function fetchUnifiedAQIData(lat: number, lon: number): Promise<AQIData> {
  const source = getWeatherSource();
  
  switch (source) {
    case 'microsoft':
      return fetchMicrosoftCurrentAirQuality(lat, lon);
    
    case 'google':
      return fetchGoogleAirQuality(lat, lon);
    
    case 'waqi':
      return fetchWAQIData(lat, lon);
    
    case 'purpleair':
      return fetchPurpleAirData(lat, lon);
    
    case 'airnow':
      return convertAirNowToAQI(lat, lon);
    
    case 'openweather':
      // OpenWeather doesn't have direct AQI API, so fall back to Microsoft
      console.warn('OpenWeather AQI not available, using Microsoft as fallback');
      return fetchMicrosoftCurrentAirQuality(lat, lon);
    
    default:
      return fetchMicrosoftCurrentAirQuality(lat, lon);
  }
}

/**
 * Fetch storm/lightning data from the user's selected weather source
 * Note: Not all providers support storm data, falls back to OpenWeather when needed
 * @param lat Latitude
 * @param lon Longitude
 * @returns Lightning/storm probability data
 */
export async function fetchUnifiedStormData(lat: number, lon: number): Promise<LightningData> {
  const source = getWeatherSource();
  
  switch (source) {
    case 'openweather':
      return fetchWeatherData(lat, lon);
    
    case 'microsoft':
      // Use Microsoft's daily forecast to calculate storm probability
      try {
        const forecast = await fetchMicrosoftDailyForecastWithAirAndPollen(lat, lon, 1);
        const todayForecast = forecast.forecasts[0];
        
        if (todayForecast) {
          const thunderstormProb = Math.max(
            todayForecast.day.thunderstormProbability || 0,
            todayForecast.night.thunderstormProbability || 0
          );
          
          let level: LightningData['level'] = 'Low';
          if (thunderstormProb > 60) level = 'High';
          else if (thunderstormProb > 30) level = 'Moderate';
          
          return {
            probability: Math.round(thunderstormProb),
            level,
            timestamp: new Date().toISOString(),
          };
        }
      } catch (error) {
        console.error('Error fetching Microsoft storm data:', error);
      }
      // Fall back to OpenWeather if Microsoft fails
      return fetchWeatherData(lat, lon);
    
    case 'google':
      // Google doesn't provide storm data directly, use OpenWeather
      return fetchWeatherData(lat, lon);
    
    default:
      return fetchWeatherData(lat, lon);
  }
}

/**
 * Fetch pollen data from the user's selected weather source
 * Note: Limited provider support, uses seasonal model as fallback
 * @param lat Latitude
 * @param lon Longitude
 * @returns Pollen data
 */
export async function fetchUnifiedPollenData(lat: number, lon: number): Promise<PollenData> {
  const source = getWeatherSource();
  
  switch (source) {
    case 'microsoft':
      // Use Microsoft's daily forecast with air and pollen data
      try {
        const forecast = await fetchMicrosoftDailyForecastWithAirAndPollen(lat, lon, 1);
        const todayForecast = forecast.forecasts[0];
        
        if (todayForecast?.airAndPollen) {
          const pollenData = todayForecast.airAndPollen.find(item => 
            item.name.toLowerCase().includes('pollen')
          );
          
          if (pollenData) {
            let level: PollenData['level'] = 'Low';
            if (pollenData.categoryValue >= 4) level = 'High';
            else if (pollenData.categoryValue >= 3) level = 'Medium-High';
            else if (pollenData.categoryValue >= 2) level = 'Medium';
            else if (pollenData.categoryValue >= 1) level = 'Low-Medium';

            return {
              overall: pollenData.categoryValue,
              tree: pollenData.categoryValue, // Microsoft doesn't separate types, so use same value
              grass: 0,
              weed: 0,
              level,
              timestamp: new Date().toISOString(),
            };
          }
        }
      } catch (error) {
        console.error('Error fetching Microsoft pollen data:', error);
      }
      // Fall back to default pollen service
      const { fetchPollenData } = await import('./pollen');
      return fetchPollenData(lat, lon);
    
    case 'google':
      return fetchGooglePollenData(lat, lon);
    
    case 'openweather':
      // OpenWeather doesn't provide pollen data, use default service
      const { fetchPollenData: fetchDefaultPollen } = await import('./pollen');
      return fetchDefaultPollen(lat, lon);
    
    default:
      const { fetchPollenData: fetchFallbackPollen } = await import('./pollen');
      return fetchFallbackPollen(lat, lon);
  }
}

/**
 * Fetch comprehensive breathing-related data from the selected source
 * Combines AQI, storm, and pollen data when available
 * @param lat Latitude
 * @param lon Longitude
 * @returns Combined breathing data with source indicator
 */
export async function fetchUnifiedBreathingData(lat: number, lon: number) {
  const source = getWeatherSource();
  
  if (source === 'microsoft') {
    // Microsoft has the most comprehensive API
    return fetchMicrosoftBreathingData(lat, lon);
  }
  
  // For other sources, combine individual API calls
  try {
    const [airQuality, stormData, pollenData] = await Promise.allSettled([
      fetchUnifiedAQIData(lat, lon),
      fetchUnifiedStormData(lat, lon),
      fetchUnifiedPollenData(lat, lon),
    ]);
    
    return {
      currentAirQuality: airQuality.status === 'fulfilled' ? airQuality.value : null,
      stormData: stormData.status === 'fulfilled' ? stormData.value : null,
      pollenData: pollenData.status === 'fulfilled' ? pollenData.value : null,
      timestamp: new Date().toISOString(),
      source,
    };
  } catch (error) {
    console.error('Error fetching unified breathing data:', error);
    throw error;
  }
}

/**
 * Get human-readable display name for a weather source
 * @param source Weather source identifier
 * @returns Display name for UI
 */
export function getWeatherSourceDisplayName(source: WeatherSource): string {
  switch (source) {
    case 'microsoft':
      return 'Microsoft Azure';
    case 'google':
      return 'Google';
    case 'openweather':
      return 'OpenWeather';
    case 'waqi':
      return 'World Air Quality Index';
    case 'purpleair':
      return 'PurpleAir';
    case 'airnow':
      return 'AirNow (EPA)';
    default:
      return 'Unknown';
  }
}