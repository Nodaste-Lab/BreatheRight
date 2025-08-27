import type { AQIData } from '../../types/location';

const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface OpenWeatherAirPollution {
  coord: {
    lon: number;
    lat: number;
  };
  list: Array<{
    dt: number;
    main: {
      aqi: number; // 1-5 scale
    };
    components: {
      co: number;    // Carbon monoxide μg/m³
      no: number;    // Nitric oxide μg/m³ 
      no2: number;   // Nitrogen dioxide μg/m³
      o3: number;    // Ozone μg/m³
      so2: number;   // Sulphur dioxide μg/m³
      pm2_5: number; // Fine particles matter μg/m³
      pm10: number;  // Coarse particulate matter μg/m³
      nh3: number;   // Ammonia μg/m³
    };
  }>;
}

/**
 * Convert OpenWeather AQI (1-5 scale) to standard AQI (0-500 scale) and level
 */
function convertAQIScale(openWeatherAQI: number): { aqi: number; level: AQIData['level'] } {
  switch (openWeatherAQI) {
    case 1:
      return { aqi: 25, level: 'Good' };
    case 2:
      return { aqi: 75, level: 'Moderate' };
    case 3:
      return { aqi: 125, level: 'Unhealthy for Sensitive Groups' };
    case 4:
      return { aqi: 175, level: 'Unhealthy' };
    case 5:
      return { aqi: 250, level: 'Very Unhealthy' };
    default:
      return { aqi: 50, level: 'Good' };
  }
}

/**
 * Fetch current air pollution data from OpenWeatherMap
 */
export async function fetchAirPollutionData(lat: number, lon: number): Promise<AQIData> {
  if (!OPENWEATHER_API_KEY) {
    throw new Error('OpenWeatherMap API key not configured');
  }

  const url = `${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`);
    }

    const data: OpenWeatherAirPollution = await response.json();
    
    if (!data.list || data.list.length === 0) {
      throw new Error('No air pollution data available');
    }

    const current = data.list[0];
    const { aqi, level } = convertAQIScale(current.main.aqi);

    return {
      aqi,
      level,
      pollutants: {
        pm25: Math.round(current.components.pm2_5),
        pm10: Math.round(current.components.pm10),
        o3: Math.round(current.components.o3),
        no2: Math.round(current.components.no2),
        so2: Math.round(current.components.so2),
        co: Math.round(current.components.co / 1000), // Convert to mg/m³
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching air pollution data:', error);
    throw error;
  }
}

/**
 * Fetch air pollution forecast (next 5 days)
 */
export async function fetchAirPollutionForecast(lat: number, lon: number): Promise<AQIData[]> {
  if (!OPENWEATHER_API_KEY) {
    throw new Error('OpenWeatherMap API key not configured');
  }

  const url = `${BASE_URL}/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`);
    }

    const data: OpenWeatherAirPollution = await response.json();
    
    return data.list.map((item) => {
      const { aqi, level } = convertAQIScale(item.main.aqi);
      
      return {
        aqi,
        level,
        pollutants: {
          pm25: Math.round(item.components.pm2_5),
          pm10: Math.round(item.components.pm10),
          o3: Math.round(item.components.o3),
          no2: Math.round(item.components.no2),
          so2: Math.round(item.components.so2),
          co: Math.round(item.components.co / 1000),
        },
        timestamp: new Date(item.dt * 1000).toISOString(),
      };
    });
  } catch (error) {
    console.error('Error fetching air pollution forecast:', error);
    throw error;
  }
}