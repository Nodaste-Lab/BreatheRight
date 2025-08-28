import type { WildFireData } from '../../types/location';

const AIRNOW_API_KEY = process.env.EXPO_PUBLIC_AIRNOW_API_KEY;
const BASE_URL = 'https://www.airnowapi.org/aq';

// AirNow API Response Interfaces
export interface AirNowObservation {
  DateObserved: string;
  HourObserved: number;
  LocalTimeZone: string;
  ReportingArea: string;
  StateCode: string;
  Latitude: number;
  Longitude: number;
  ParameterName: string; // "PM2.5" | "PM10" | "OZONE"
  AQI: number;
  Category: {
    Number: number; // 1-6
    Name: string; // "Good", "Moderate", etc.
  };
}

export interface AirNowForecast {
  DateIssued: string;
  DateForecast: string;
  ReportingArea: string;
  StateCode: string;
  Latitude: number;
  Longitude: number;
  ParameterName: string;
  AQI: number;
  Category: {
    Number: number;
    Name: string;
  };
  ActionDay?: boolean;
  Discussion?: string;
}

/**
 * Convert AirNow category to our risk levels
 */
function convertAirNowCategory(categoryName: string): WildFireData['smokeRisk']['level'] {
  switch (categoryName.toLowerCase()) {
    case 'good':
      return 'Low';
    case 'moderate':
      return 'Moderate';
    case 'unhealthy for sensitive groups':
      return 'High';
    case 'unhealthy':
      return 'Unhealthy';
    case 'very unhealthy':
      return 'Very Unhealthy';
    case 'hazardous':
      return 'Hazardous';
    default:
      return 'Unknown';
  }
}

/**
 * Calculate visibility from PM2.5 concentration
 * Uses EPA visibility formula: Visibility ≈ 1000 / PM2.5
 */
function calculateVisibility(pm25: number): number {
  if (pm25 <= 0) return -1;
  if (pm25 < 5) return 50; // Clear conditions
  return Math.max(1, Math.round(1000 / pm25));
}

/**
 * Determine dust risk level from PM10 values
 */
function calculateDustRisk(pm10: number): WildFireData['dustRisk']['level'] {
  if (pm10 < 0) return 'Unknown';
  if (pm10 <= 50) return 'Low';
  if (pm10 <= 150) return 'Moderate';
  return 'High';
}

/**
 * Analyze forecast trend to determine outlook
 */
function analyzeOutlook(
  currentPM25: number, 
  forecastData: AirNowForecast[]
): WildFireData['outlook'] {
  if (forecastData.length === 0) {
    return {
      next24Hours: 'Unknown',
      confidence: 'Low',
      details: 'No forecast data available'
    };
  }

  // Get tomorrow's PM2.5 forecast
  const tomorrowForecast = forecastData.find(f => f.ParameterName === 'PM2.5');
  
  if (!tomorrowForecast) {
    return {
      next24Hours: 'Unknown',
      confidence: 'Low', 
      details: 'PM2.5 forecast unavailable'
    };
  }

  const tomorrowPM25 = tomorrowForecast.AQI; // AQI as proxy for concentration
  const difference = tomorrowPM25 - currentPM25;
  
  let trend: WildFireData['outlook']['next24Hours'];
  let details: string;
  
  if (difference > 10) {
    trend = 'Worsening';
    details = `Air quality expected to worsen. PM2.5 levels may increase significantly.`;
  } else if (difference < -10) {
    trend = 'Improving';
    details = `Air quality expected to improve. PM2.5 levels should decrease.`;
  } else {
    trend = 'Stable';
    details = `Air quality expected to remain similar to current conditions.`;
  }

  // Add discussion if available
  if (tomorrowForecast.Discussion) {
    details += ` ${tomorrowForecast.Discussion}`;
  }

  return {
    next24Hours: trend,
    confidence: 'Moderate', // AirNow forecasts are generally reliable
    details
  };
}

/**
 * Fetch current air quality observations from AirNow
 */
export async function fetchAirNowObservations(lat: number, lon: number): Promise<AirNowObservation[]> {
  if (!AIRNOW_API_KEY) {
    throw new Error('AirNow API key not configured');
  }

  const url = `${BASE_URL}/observation/latLong/current/?format=application/json&latitude=${lat}&longitude=${lon}&distance=50&API_KEY=${AIRNOW_API_KEY}`;

  console.log('AirNow API URL:', url);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`AirNow API error: ${response.status} ${response.statusText}`);
    }

    const data: AirNowObservation[] = await response.json();
    console.log(`AirNow API returned ${data.length} observations`);
    
    return data;
  } catch (error) {
    console.error('Error fetching AirNow observations:', error);
    
    // Provide helpful error message for CORS issues
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('AirNow API blocked by browser CORS policy. Please test on mobile device.');
    }
    
    throw error;
  }
}

/**
 * Fetch air quality forecast from AirNow
 */
export async function fetchAirNowForecast(lat: number, lon: number): Promise<AirNowForecast[]> {
  if (!AIRNOW_API_KEY) {
    throw new Error('AirNow API key not configured');
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const url = `${BASE_URL}/forecast/latLong/?format=application/json&latitude=${lat}&longitude=${lon}&date=${today}&distance=50&API_KEY=${AIRNOW_API_KEY}`;

  console.log('AirNow Forecast API URL:', url);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`AirNow Forecast API error: ${response.status} ${response.statusText}`);
    }

    const data: AirNowForecast[] = await response.json();
    console.log(`AirNow Forecast API returned ${data.length} forecasts`);
    
    return data;
  } catch (error) {
    console.error('Error fetching AirNow forecast:', error);
    
    // Provide helpful error message for CORS issues
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('AirNow API blocked by browser CORS policy. Please test on mobile device.');
    }
    
    throw error;
  }
}

/**
 * Fetch comprehensive wildfire, smoke, and dust data
 */
export async function fetchWildFireData(lat: number, lon: number): Promise<WildFireData> {
  try {
    // Fetch both current observations and forecast
    const [observations, forecasts] = await Promise.allSettled([
      fetchAirNowObservations(lat, lon),
      fetchAirNowForecast(lat, lon)
    ]);

    const observationData = observations.status === 'fulfilled' ? observations.value : [];
    const forecastData = forecasts.status === 'fulfilled' ? forecasts.value : [];

    if (observationData.length === 0) {
      throw new Error('No air quality data available for this location');
    }

    // Extract PM2.5 and PM10 data
    const pm25Obs = observationData.find(obs => obs.ParameterName === 'PM2.5');
    const pm10Obs = observationData.find(obs => obs.ParameterName === 'PM10');

    const pm25Value = pm25Obs?.AQI || 0;
    const pm10Value = pm10Obs?.AQI || 0;

    // Calculate smoke risk (primarily from PM2.5)
    const smokeLevel = pm25Obs ? convertAirNowCategory(pm25Obs.Category.Name) : 'Unknown';
    const smokeVisibility = calculateVisibility(pm25Value);

    // Calculate dust risk (primarily from PM10)
    const dustLevel = calculateDustRisk(pm10Value);
    const dustVisibility = calculateVisibility(pm10Value * 0.6); // PM10 affects visibility less than PM2.5

    // Analyze outlook based on forecast
    const outlook = analyzeOutlook(pm25Value, forecastData);

    return {
      smokeRisk: {
        level: smokeLevel,
        pm25: pm25Value,
        visibility: smokeVisibility
      },
      dustRisk: {
        level: dustLevel,
        pm10: pm10Value,
        visibility: dustVisibility
      },
      fireActivity: {
        nearbyFires: -1, // AirNow doesn't provide fire count data
        closestFireDistance: -1, // AirNow doesn't provide fire location data
        largestFireSize: -1 // AirNow doesn't provide fire size data
      },
      outlook,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error fetching wildfire data:', error);
    throw error;
  }
}

/**
 * Get simplified smoke status for quick checks
 */
export async function fetchQuickSmokeStatus(lat: number, lon: number): Promise<WildFireData['smokeRisk']> {
  try {
    const observations = await fetchAirNowObservations(lat, lon);
    const pm25Obs = observations.find(obs => obs.ParameterName === 'PM2.5');
    
    if (!pm25Obs) {
      return {
        level: 'Unknown',
        pm25: -1,
        visibility: -1
      };
    }

    return {
      level: convertAirNowCategory(pm25Obs.Category.Name),
      pm25: pm25Obs.AQI,
      visibility: calculateVisibility(pm25Obs.AQI)
    };

  } catch (error) {
    console.error('Error fetching quick smoke status:', error);
    throw error;
  }
}