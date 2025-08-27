import type { AQIData, PollenData } from '../../types/location';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const AIR_QUALITY_BASE_URL = 'https://airquality.googleapis.com/v1';

// Google Air Quality API Response Types
interface GoogleAirQualityResponse {
  dateTime: string;
  regionCode: string;
  indexes: Array<{
    code: 'aqi' | 'uaqi' | 'baqi' | 'waqti';
    displayName: string;
    aqi: number;
    aqiDisplay: string;
    color: {
      red: number;
      green: number;
      blue: number;
    };
    category: string;
    dominantPollutant: string;
  }>;
  pollutants: Array<{
    code: string;
    displayName: string;
    fullName: string;
    concentration: {
      value: number;
      units: string;
    };
    additionalInfo: {
      sources: string;
      effects: string;
    };
  }>;
  healthRecommendations: {
    generalPopulation: string;
    elderly: string;
    lungDiseasePopulation: string;
    heartDiseasePopulation: string;
    athletes: string;
    pregnantWomen: string;
    children: string;
  };
}

/**
 * Convert Google AQI category to our standard level format
 */
function convertGoogleAQILevel(category: string): AQIData['level'] {
  switch (category.toLowerCase()) {
    case 'excellent':
    case 'good':
      return 'Good';
    case 'moderate':
      return 'Moderate';
    case 'unhealthy for sensitive groups':
    case 'lightly polluted':
      return 'Unhealthy for Sensitive Groups';
    case 'unhealthy':
    case 'moderately polluted':
      return 'Unhealthy';
    case 'very unhealthy':
    case 'heavily polluted':
      return 'Very Unhealthy';
    case 'hazardous':
    case 'severely polluted':
      return 'Hazardous';
    default:
      return 'Good';
  }
}

/**
 * Extract pollutant values from Google API response
 */
function extractPollutants(pollutants: GoogleAirQualityResponse['pollutants']) {
  const pollutantMap: Record<string, number> = {};
  
  pollutants.forEach((pollutant) => {
    const value = Math.round(pollutant.concentration.value);
    
    switch (pollutant.code) {
      case 'pm25':
        pollutantMap.pm25 = value;
        break;
      case 'pm10':
        pollutantMap.pm10 = value;
        break;
      case 'o3':
        pollutantMap.o3 = value;
        break;
      case 'no2':
        pollutantMap.no2 = value;
        break;
      case 'so2':
        pollutantMap.so2 = value;
        break;
      case 'co':
        // Convert from mg/m³ to µg/m³ if needed
        pollutantMap.co = pollutant.concentration.units === 'mg/m³' ? value : Math.round(value / 1000);
        break;
    }
  });

  return {
    pm25: pollutantMap.pm25 || 0,
    pm10: pollutantMap.pm10 || 0,
    o3: pollutantMap.o3 || 0,
    no2: pollutantMap.no2 || 0,
    so2: pollutantMap.so2 || 0,
    co: pollutantMap.co || 0,
  };
}

/**
 * Fetch current air quality data from Google Maps Air Quality API
 */
export async function fetchGoogleAirQuality(lat: number, lon: number): Promise<AQIData> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key not configured');
  }

  const url = `${AIR_QUALITY_BASE_URL}/currentConditions:lookup?key=${GOOGLE_MAPS_API_KEY}`;
  
  const requestBody = {
    universalAqi: true,
    location: {
      latitude: lat,
      longitude: lon,
    },
    extraComputations: [
      'HEALTH_RECOMMENDATIONS',
      'POLLUTANT_CONCENTRATION',
      'LOCAL_AQI',
      'POLLUTANT_ADDITIONAL_INFO'
    ],
    languageCode: 'en'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Air Quality API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: GoogleAirQualityResponse = await response.json();
    
    // Get the universal AQI index (most commonly used)
    const universalAQI = data.indexes.find(index => index.code === 'uaqi') || data.indexes[0];
    
    if (!universalAQI) {
      throw new Error('No AQI data available from Google API');
    }

    const pollutants = extractPollutants(data.pollutants || []);
    const level = convertGoogleAQILevel(universalAQI.category);

    return {
      aqi: universalAQI.aqi,
      level,
      pollutants,
      timestamp: new Date(data.dateTime || Date.now()).toISOString(),
    };
  } catch (error) {
    console.error('Error fetching Google air quality data:', error);
    throw error;
  }
}

/**
 * Fetch air quality forecast from Google (if available)
 * Note: Google Air Quality API currently focuses on current conditions
 * For forecast data, you might need to combine with other services
 */
export async function fetchGoogleAirQualityHistory(lat: number, lon: number, hours: number = 24): Promise<AQIData[]> {
  // Google Air Quality API doesn't provide historical data in the same call
  // This is a placeholder for potential future implementation
  // You could make multiple calls with different timestamps or use other Google APIs
  
  try {
    const currentData = await fetchGoogleAirQuality(lat, lon);
    
    // Return current data as a single-item array for now
    // In production, you might want to store historical data or use other APIs
    return [currentData];
  } catch (error) {
    console.error('Error fetching Google air quality history:', error);
    throw error;
  }
}

/**
 * Get Google Maps Pollen API data (if available)
 * Note: Google has announced Pollen API but it may not be fully available yet
 */
export async function fetchGooglePollenData(lat: number, lon: number): Promise<PollenData> {
  // Google Pollen API is still in preview/limited availability
  // For now, fall back to the seasonal estimation model
  
  const { fetchPollenData } = await import('./pollen');
  return fetchPollenData(lat, lon);
}