import type { AQIData } from '../../types/location';

const AZURE_MAPS_API_KEY = process.env.EXPO_PUBLIC_AZURE_MAPS_API_KEY;
const BASE_URL = 'https://atlas.microsoft.com/weather';

// Microsoft Air Quality Response Types (actual API format)
export interface MicrosoftAirQualityResponse {
  results: Array<{
    dateTime: string;
    index: number;
    globalIndex: number;
    dominantPollutant: string;
    category: string;
    categoryColor: string;
    description: string;
    pollutants: Array<{
      type: string; // "NO2", "O3", "PM10", "PM2.5", "CO", "SO2"
      name: string;
      index: number;
      globalIndex: number;
      concentration: {
        value: number;
        unit: string; // "µg/m³"
        unitType: number;
      };
    }>;
  }>;
}

// Microsoft Air Quality Hourly Forecast Response (actual structure)
export interface MicrosoftAirQualityHourlyForecast {
  results: Array<{
    dateTime: string;
    index: number;
    globalIndex: number;
    dominantPollutant: string;
    category: string;
    categoryColor: string;
    description: string;
    pollutants: Array<{
      type: string; // "NO2", "O3", "PM10", "PM2.5", "CO", "SO2"
      name: string;
      index: number;
      globalIndex: number;
      concentration: {
        value: number;
        unit: string; // "µg/m³"
        unitType: number;
      };
    }>;
  }>;
}

// Severe Weather Alerts Response
export interface MicrosoftSevereWeatherAlertsResponse {
  results: Array<{
    countryCode: string;
    alertId: number;
    description: {
      localized: string;
      english: string;
    };
    category: string;
    priority: number;
    source: string;
    sourceId: number;
    alertDetailsUrl?: string;
    disclaimer: string;
    validFromUtc: string;
    validUntilUtc: string;
    alertAreas: Array<{
      name: string;
      summary: string;
      startTime: string;
      endTime: string;
      severity: string;
      type: number;
      alertDetails: string;
    }>;
  }>;
}

// Daily Indices Response (for UV, Air Quality, and other health indices)
export interface MicrosoftDailyIndicesResponse {
  results: Array<{
    dateTime: string;
    indices: Array<{
      name: string;
      id: string;
      ascending: boolean;
      value: number;
      category: string;
      categoryDescription: string;
      description: string;
    }>;
  }>;
}

// Daily Forecast with Air and Pollen Data
export interface MicrosoftDailyForecastResponse {
  forecasts: Array<{
    date: string;
    sun: {
      rise: string;
      set: string;
    };
    moon: {
      rise: string;
      set: string;
      phase: string;
    };
    temperature: {
      minimum: {
        value: number;
        unit: string;
      };
      maximum: {
        value: number;
        unit: string;
      };
    };
    realFeelTemperature: {
      minimum: {
        value: number;
        unit: string;
      };
      maximum: {
        value: number;
        unit: string;
      };
    };
    hoursOfSun: number;
    degreeDaySummary: {
      heating: {
        value: number;
        unit: string;
      };
      cooling: {
        value: number;
        unit: string;
      };
    };
    airAndPollen: Array<{
      name: string;
      value: number;
      category: string;
      categoryValue: number;
      type: string;
    }>;
    day: {
      iconCode: number;
      iconPhrase: string;
      hasPrecipitation: boolean;
      shortPhrase: string;
      longPhrase: string;
      precipitationProbability: number;
      thunderstormProbability: number;
      rainProbability: number;
      snowProbability: number;
      iceProbability: number;
      wind: {
        direction: {
          degrees: number;
          localizedDescription: string;
        };
        speed: {
          value: number;
          unit: string;
        };
      };
      windGust: {
        direction: {
          degrees: number;
          localizedDescription: string;
        };
        speed: {
          value: number;
          unit: string;
        };
      };
      totalLiquid: {
        value: number;
        unit: string;
      };
      rain: {
        value: number;
        unit: string;
      };
      snow: {
        value: number;
        unit: string;
      };
      ice: {
        value: number;
        unit: string;
      };
      hoursOfPrecipitation: number;
      hoursOfRain: number;
      hoursOfSnow: number;
      hoursOfIce: number;
      cloudCover: number;
    };
    night: {
      iconCode: number;
      iconPhrase: string;
      hasPrecipitation: boolean;
      shortPhrase: string;
      longPhrase: string;
      precipitationProbability: number;
      thunderstormProbability: number;
      rainProbability: number;
      snowProbability: number;
      iceProbability: number;
      wind: {
        direction: {
          degrees: number;
          localizedDescription: string;
        };
        speed: {
          value: number;
          unit: string;
        };
      };
      windGust: {
        direction: {
          degrees: number;
          localizedDescription: string;
        };
        speed: {
          value: number;
          unit: string;
        };
      };
      totalLiquid: {
        value: number;
        unit: string;
      };
      rain: {
        value: number;
        unit: string;
      };
      snow: {
        value: number;
        unit: string;
      };
      ice: {
        value: number;
        unit: string;
      };
      hoursOfPrecipitation: number;
      hoursOfRain: number;
      hoursOfSnow: number;
      hoursOfIce: number;
      cloudCover: number;
    };
  }>;
}

/**
 * Convert Microsoft Air Quality to standard AQI format
 */
function convertMicrosoftAQIToStandard(microsoftAQ: MicrosoftAirQualityResponse['results'][0]): AQIData {
  // Use Microsoft's globalIndex as the main AQI value (it's already in 0-100+ range)
  let aqi = Math.round(microsoftAQ.globalIndex || microsoftAQ.index || 50);
  
  // Map Microsoft category to US AQI levels
  let level: AQIData['level'] = 'Unknown';
  switch (microsoftAQ.category?.toLowerCase()) {
    case 'excellent':
    case 'good':
      level = 'Good';
      break;
    case 'fair':
    case 'moderate':
      level = 'Moderate';
      break;
    case 'poor':
      level = 'Unhealthy for Sensitive Groups';
      break;
    case 'very poor':
      level = 'Unhealthy';
      break;
    case 'extremely poor':
      level = 'Very Unhealthy';
      break;
    default:
      // Determine level based on AQI value if category is unclear
      if (aqi <= 50) level = 'Good';
      else if (aqi <= 100) level = 'Moderate';
      else if (aqi <= 150) level = 'Unhealthy for Sensitive Groups';
      else if (aqi <= 200) level = 'Unhealthy';
      else level = 'Very Unhealthy';
  }

  // Extract pollutant concentrations from the array
  const pollutantMap: { [key: string]: number } = {};
  microsoftAQ.pollutants?.forEach(p => {
    if (p.concentration?.value) {
      switch (p.type) {
        case 'PM2.5':
          pollutantMap.pm25 = p.concentration.value;
          break;
        case 'PM10':
          pollutantMap.pm10 = p.concentration.value;
          break;
        case 'O3':
          pollutantMap.o3 = p.concentration.value;
          break;
        case 'NO2':
          pollutantMap.no2 = p.concentration.value;
          break;
        case 'SO2':
          pollutantMap.so2 = p.concentration.value;
          break;
        case 'CO':
          // CO is in µg/m³, convert to mg/m³ for consistency
          pollutantMap.co = Math.round(p.concentration.value / 1000);
          break;
      }
    }
  });

  return {
    aqi,
    level,
    pollutants: {
      pm25: Math.round(pollutantMap.pm25 || 0),
      pm10: Math.round(pollutantMap.pm10 || 0),
      o3: Math.round(pollutantMap.o3 || 0),
      no2: Math.round(pollutantMap.no2 || 0),
      so2: Math.round(pollutantMap.so2 || 0),
      co: pollutantMap.co || 0,
    },
    timestamp: microsoftAQ.dateTime || new Date().toISOString(),
    // Add Microsoft-specific metadata
    source: 'microsoft',
    dominantPollutant: microsoftAQ.dominantPollutant || 'PM2.5',
    description: microsoftAQ.description || level,
    color: microsoftAQ.categoryColor || '#6b7280',
  } as AQIData & { source: string; dominantPollutant: string; description: string; color: string };
}

/**
 * Fetch current air quality from Microsoft Weather API
 */
export async function fetchMicrosoftCurrentAirQuality(lat: number, lon: number): Promise<AQIData> {
  if (!AZURE_MAPS_API_KEY) {
    throw new Error('Azure Maps API key not configured');
  }

  const url = `${BASE_URL}/airQuality/current/json?api-version=1.1&query=${lat},${lon}&subscription-key=${AZURE_MAPS_API_KEY}&pollutants=true`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Microsoft Air Quality API error: ${response.status} ${response.statusText}`);
    }

    const data: MicrosoftAirQualityResponse = await response.json();
    
    if (!data.results || data.results.length === 0) {
      throw new Error('No air quality data available');
    }

    return convertMicrosoftAQIToStandard(data.results[0]);
  } catch (error) {
    console.error('Error fetching Microsoft air quality data:', error);
    throw error;
  }
}

/**
 * Fetch hourly air quality forecast from Microsoft Weather API
 */
export async function fetchMicrosoftAirQualityForecast(
  lat: number, 
  lon: number, 
  hours: number = 24
): Promise<AQIData[]> {
  if (!AZURE_MAPS_API_KEY) {
    throw new Error('Azure Maps API key not configured');
  }

  // Valid durations: 1, 12, 24, 48, 72, 96
  const validHours = [1, 12, 24, 48, 72, 96];
  const duration = validHours.reduce((prev, curr) => 
    Math.abs(curr - hours) < Math.abs(prev - hours) ? curr : prev
  );

  const url = `${BASE_URL}/airQuality/forecasts/hourly/json?api-version=1.1&query=${lat},${lon}&duration=${duration}&subscription-key=${AZURE_MAPS_API_KEY}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Microsoft Air Quality Forecast API error: ${response.status} ${response.statusText}`);
    }

    const data: MicrosoftAirQualityHourlyForecast = await response.json();
    
    if (!data.results || data.results.length === 0) {
      throw new Error('No air quality forecast data available');
    }

    // The forecast API returns the same structure as current air quality, so we can directly use convertMicrosoftAQIToStandard
    return data.results.map(result => convertMicrosoftAQIToStandard(result));
  } catch (error) {
    console.error('Error fetching Microsoft air quality forecast:', error);
    throw error;
  }
}

/**
 * Fetch severe weather alerts from Microsoft Weather API
 */
export async function fetchMicrosoftSevereWeatherAlerts(lat: number, lon: number) {
  if (!AZURE_MAPS_API_KEY) {
    throw new Error('Azure Maps API key not configured');
  }

  const url = `${BASE_URL}/severe/alerts/json?api-version=1.1&query=${lat},${lon}&subscription-key=${AZURE_MAPS_API_KEY}&details=true`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Microsoft Severe Weather Alerts API error: ${response.status} ${response.statusText}`);
    }

    const data: MicrosoftSevereWeatherAlertsResponse = await response.json();
    
    return {
      alerts: data.results || [],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching Microsoft severe weather alerts:', error);
    throw error;
  }
}

/**
 * Fetch daily health indices from Microsoft Weather API (UV, Air Quality, etc.)
 */
export async function fetchMicrosoftDailyIndices(lat: number, lon: number, days: number = 5) {
  if (!AZURE_MAPS_API_KEY) {
    throw new Error('Azure Maps API key not configured');
  }

  // Valid durations: 1, 5, 10, 15
  const validDays = [1, 5, 10, 15];
  const duration = validDays.reduce((prev, curr) => 
    Math.abs(curr - days) < Math.abs(prev - days) ? curr : prev
  );

  const url = `${BASE_URL}/indices/daily/json?api-version=1.1&query=${lat},${lon}&duration=${duration}&subscription-key=${AZURE_MAPS_API_KEY}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Microsoft Daily Indices API error: ${response.status} ${response.statusText}`);
    }

    const data: MicrosoftDailyIndicesResponse = await response.json();
    
    return {
      indices: data.results || [],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching Microsoft daily indices:', error);
    throw error;
  }
}

/**
 * Fetch daily forecast with air and pollen data from Microsoft Weather API
 */
export async function fetchMicrosoftDailyForecastWithAirAndPollen(lat: number, lon: number, days: number = 5) {
  if (!AZURE_MAPS_API_KEY) {
    throw new Error('Azure Maps API key not configured');
  }

  // Valid durations: 1, 5, 10, 15, 25, 45 (depending on pricing tier)
  const validDays = [1, 5, 10, 15, 25, 45];
  const duration = validDays.reduce((prev, curr) => 
    Math.abs(curr - days) < Math.abs(prev - days) ? curr : prev
  );

  const url = `${BASE_URL}/forecast/daily/json?api-version=1.1&query=${lat},${lon}&duration=${duration}&subscription-key=${AZURE_MAPS_API_KEY}&details=true`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Microsoft Daily Forecast API error: ${response.status} ${response.statusText}`);
    }

    const data: MicrosoftDailyForecastResponse = await response.json();
    
    return {
      forecasts: data.forecasts || [],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching Microsoft daily forecast with air and pollen:', error);
    throw error;
  }
}

/**
 * Get comprehensive breathing-related data from Microsoft Weather API
 */
export async function fetchMicrosoftBreathingData(lat: number, lon: number) {
  try {
    const [currentAirQuality, airQualityForecast, severeAlerts, dailyIndices, dailyForecast] = await Promise.allSettled([
      fetchMicrosoftCurrentAirQuality(lat, lon),
      fetchMicrosoftAirQualityForecast(lat, lon, 24),
      fetchMicrosoftSevereWeatherAlerts(lat, lon),
      fetchMicrosoftDailyIndices(lat, lon, 5),
      fetchMicrosoftDailyForecastWithAirAndPollen(lat, lon, 5),
    ]);

    return {
      currentAirQuality: currentAirQuality.status === 'fulfilled' ? currentAirQuality.value : null,
      airQualityForecast: airQualityForecast.status === 'fulfilled' ? airQualityForecast.value : null,
      severeAlerts: severeAlerts.status === 'fulfilled' ? severeAlerts.value : null,
      dailyIndices: dailyIndices.status === 'fulfilled' ? dailyIndices.value : null,
      dailyForecast: dailyForecast.status === 'fulfilled' ? dailyForecast.value : null,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching Microsoft breathing data:', error);
    throw error;
  }
}