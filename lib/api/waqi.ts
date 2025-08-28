import type { AQIData } from '../../types/location';

const WAQI_API_KEY = process.env.EXPO_PUBLIC_WAQI_API_KEY;
const BASE_URL = 'https://api.waqi.info';

export interface WAQIResponse {
  status: string;
  data: {
    aqi: number;
    idx: number;
    attributions: Array<{
      url: string;
      name: string;
      logo?: string;
    }>;
    city: {
      geo: [number, number];
      name: string;
      url: string;
    };
    dominentpol: string;
    iaqi: {
      co?: { v: number };
      h?: { v: number };
      no2?: { v: number };
      o3?: { v: number };
      p?: { v: number };
      pm10?: { v: number };
      pm25?: { v: number };
      so2?: { v: number };
      t?: { v: number };
      w?: { v: number };
      wg?: { v: number };
    };
    time: {
      s: string;
      tz: string;
      v: number;
      iso: string;
    };
    forecast?: {
      daily: {
        o3: Array<{ avg: number; day: string; max: number; min: number }>;
        pm10: Array<{ avg: number; day: string; max: number; min: number }>;
        pm25: Array<{ avg: number; day: string; max: number; min: number }>;
      };
    };
  };
}

/**
 * Convert WAQI AQI value to standard level
 */
function convertWAQILevel(aqi: number): AQIData['level'] {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

/**
 * Extract pollutant values from WAQI response
 * Note: WAQI returns individual AQI values for each pollutant, not concentrations
 */
function extractPollutants(iaqi: WAQIResponse['data']['iaqi']): AQIData['pollutants'] {
  return {
    pm25: iaqi.pm25?.v || -1,
    pm10: iaqi.pm10?.v || -1,
    o3: iaqi.o3?.v || -1,
    no2: iaqi.no2?.v || -1,
    so2: iaqi.so2?.v || -1,
    co: iaqi.co?.v || -1,
  };
}

/**
 * Fetch air quality data from WAQI by coordinates
 */
export async function fetchWAQIData(lat: number, lon: number): Promise<AQIData> {
  if (!WAQI_API_KEY) {
    throw new Error('WAQI API key not configured');
  }

  const url = `${BASE_URL}/feed/geo:${lat};${lon}/?token=${WAQI_API_KEY}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`WAQI API error: ${response.status} ${response.statusText}`);
    }

    const data: WAQIResponse = await response.json();
    
    if (data.status !== 'ok') {
      throw new Error(`WAQI API returned error status: ${data.status}`);
    }

    if (!data.data || data.data.aqi === undefined) {
      throw new Error('No AQI data available from WAQI API');
    }

    const pollutants = extractPollutants(data.data.iaqi || {});
    const level = convertWAQILevel(data.data.aqi);

    return {
      aqi: data.data.aqi,
      level,
      pollutants,
      timestamp: data.data.time?.iso ? new Date(data.data.time.iso).toISOString() : new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching WAQI data:', error);
    throw error;
  }
}

/**
 * Search for nearest air quality monitoring station
 */
export async function searchWAQIStation(query: string): Promise<{
  stations: Array<{
    uid: number;
    aqi: string;
    time: string;
    station: {
      name: string;
      geo: [number, number];
      url: string;
    };
  }>;
}> {
  if (!WAQI_API_KEY) {
    throw new Error('WAQI API key not configured');
  }

  const url = `${BASE_URL}/search/?token=${WAQI_API_KEY}&keyword=${encodeURIComponent(query)}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`WAQI search error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status !== 'ok') {
      throw new Error(`WAQI search returned error: ${data.status}`);
    }

    return { stations: data.data || [] };
  } catch (error) {
    console.error('Error searching WAQI stations:', error);
    throw error;
  }
}