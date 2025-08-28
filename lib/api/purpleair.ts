import type { AQIData } from '../../types/location';

const PURPLEAIR_API_KEY = process.env.EXPO_PUBLIC_PURPLEAIR_API_KEY;
const BASE_URL = 'https://api.purpleair.com/v1';

// PurpleAir API returns data as arrays, not objects
export type PurpleAirSensorData = any[]; // Array format from API

export interface PurpleAirSensor {
  sensor_index: number;
  name: string;
  latitude: number;
  longitude: number;
  'pm1.0': number;
  'pm2.5': number;
  'pm10.0': number;
  pm2_5_10minute: number;
  pm2_5_30minute: number;
  pm2_5_60minute: number;
  humidity: number;
  temperature: number;
  uptime: number;
  rssi: number;
}

export interface PurpleAirResponse {
  api_version: string;
  time_stamp: number;
  data_time_stamp: number;
  location_type: number;
  max_age: number;
  fields: string[];
  data: PurpleAirSensorData[];
}

/**
 * Convert PM2.5 concentration to AQI using EPA formula
 */
function pm25ToAQI(pm25: number): number {
  if (pm25 < 0) return -1;
  if (pm25 <= 12.0) return Math.round((50 - 0) / (12.0 - 0.0) * (pm25 - 0.0) + 0);
  if (pm25 <= 35.4) return Math.round((100 - 51) / (35.4 - 12.1) * (pm25 - 12.1) + 51);
  if (pm25 <= 55.4) return Math.round((150 - 101) / (55.4 - 35.5) * (pm25 - 35.5) + 101);
  if (pm25 <= 150.4) return Math.round((200 - 151) / (150.4 - 55.5) * (pm25 - 55.5) + 151);
  if (pm25 <= 250.4) return Math.round((300 - 201) / (250.4 - 150.5) * (pm25 - 150.5) + 201);
  if (pm25 <= 500.4) return Math.round((500 - 301) / (500.4 - 250.5) * (pm25 - 250.5) + 301);
  return 500;
}

/**
 * Convert PM10 concentration to AQI using EPA formula
 */
function pm10ToAQI(pm10: number): number {
  if (pm10 < 0) return -1;
  if (pm10 <= 54) return Math.round((50 - 0) / (54 - 0) * (pm10 - 0) + 0);
  if (pm10 <= 154) return Math.round((100 - 51) / (154 - 55) * (pm10 - 55) + 51);
  if (pm10 <= 254) return Math.round((150 - 101) / (254 - 155) * (pm10 - 155) + 101);
  if (pm10 <= 354) return Math.round((200 - 151) / (354 - 255) * (pm10 - 255) + 151);
  if (pm10 <= 424) return Math.round((300 - 201) / (424 - 355) * (pm10 - 355) + 201);
  if (pm10 <= 604) return Math.round((500 - 301) / (604 - 425) * (pm10 - 425) + 301);
  return 500;
}

/**
 * Convert AQI to level description
 */
function aqiToLevel(aqi: number): AQIData['level'] {
  if (aqi < 0) return 'Unknown';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

/**
 * Convert array data from PurpleAir API to object format
 */
function convertArrayToSensor(data: PurpleAirSensorData, fields: string[]): PurpleAirSensor {
  const sensor: any = {};
  fields.forEach((field, index) => {
    sensor[field] = data[index];
  });
  return sensor as PurpleAirSensor;
}

/**
 * Apply PurpleAir correction factor for outdoor sensors
 * US EPA correction: PM2.5 corrected = 0.524 * PA_PM2.5 - 0.0862 * RH + 5.75
 */
function applyEPACorrection(pm25: number, humidity: number): number {
  if (pm25 < 0 || humidity < 0) return pm25;
  const corrected = 0.524 * pm25 - 0.0862 * humidity + 5.75;
  return Math.max(0, corrected);
}

/**
 * Fetch air quality data from PurpleAir API
 */
export async function fetchPurpleAirData(lat: number, lon: number): Promise<AQIData> {
  if (!PURPLEAIR_API_KEY) {
    throw new Error('PurpleAir API key not configured');
  }

  try {
    // Find sensors within 10km radius
    const radius = 10000; // 10km in meters
    const fields = [
      'sensor_index',
      'name',
      'latitude',
      'longitude',
      'pm1.0',
      'pm2.5',
      'pm10.0',
      'pm2.5_10minute',
      'pm2.5_30minute',
      'pm2.5_60minute',
      'humidity',
      'temperature',
      'uptime',
      'rssi'
    ].join(',');

    const url = `${BASE_URL}/sensors?fields=${fields}&location_type=0&max_age=3600&nwlat=${lat + 0.1}&nwlng=${lon - 0.1}&selat=${lat - 0.1}&selng=${lon + 0.1}`;
    
    console.log('PurpleAir API URL:', url);
    console.log('Searching for sensors around:', { lat, lon });
    
    const response = await fetch(url, {
      headers: {
        'X-API-Key': PURPLEAIR_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`PurpleAir API error: ${response.status} ${response.statusText}`);
    }

    const data: PurpleAirResponse = await response.json();

    console.log(`PurpleAir API returned ${data.data?.length || 0} sensors`);

    if (!data.data || data.data.length === 0) {
      throw new Error('No PurpleAir sensors found in the area');
    }

    // Convert array data to objects
    const sensors = data.data.map(sensorData => convertArrayToSensor(sensorData, data.fields));

    // Debug: Log sensor details before filtering
    console.log('First few sensors:', sensors.slice(0, 3).map(sensor => ({
      sensor_index: sensor.sensor_index,
      name: sensor.name,
      uptime: sensor.uptime,
      pm25: sensor['pm2.5'],
      rssi: sensor.rssi,
      humidity: sensor.humidity,
      temperature: sensor.temperature
    })));

    // Filter sensors that are active and have good data quality
    const validSensors = sensors.filter(sensor => {
      const isActive = sensor.uptime > 0;
      const hasRecentData = sensor['pm2.5'] !== null && sensor['pm2.5'] >= 0;
      const goodSignal = sensor.rssi > -95; // Relaxed WiFi signal requirement
      
      return isActive && hasRecentData && goodSignal;
    });

    console.log(`After filtering: ${validSensors.length} valid sensors out of ${data.data.length} total`);
    
    if (validSensors.length === 0) {
      // Debug: Show why sensors were filtered out
      const filterResults = sensors.slice(0, 5).map(sensor => ({
        sensor_index: sensor.sensor_index,
        name: sensor.name,
        isActive: sensor.uptime > 0,
        hasRecentData: sensor['pm2.5'] !== null && sensor['pm2.5'] >= 0,
        goodSignal: sensor.rssi > -95,
        uptime: sensor.uptime,
        pm25: sensor['pm2.5'],
        rssi: sensor.rssi
      }));
      console.log('Sensor filter results:', filterResults);
      throw new Error('No valid PurpleAir sensors found in the area');
    }

    // Calculate distance and find closest sensors
    const sensorsWithDistance = validSensors.map(sensor => {
      const distance = Math.sqrt(
        Math.pow(lat - sensor.latitude, 2) + Math.pow(lon - sensor.longitude, 2)
      );
      return { sensor, distance };
    });

    // Sort by distance and take up to 3 closest sensors
    sensorsWithDistance.sort((a, b) => a.distance - b.distance);
    const closestSensors = sensorsWithDistance.slice(0, 3);

    // Average the readings from closest sensors
    let totalPM25 = 0;
    let totalPM10 = 0;
    let totalHumidity = 0;
    let count = 0;

    closestSensors.forEach(({ sensor }) => {
      if (sensor['pm2.5'] >= 0) {
        // Apply EPA correction if humidity is available
        const correctedPM25 = sensor.humidity > 0 
          ? applyEPACorrection(sensor['pm2.5'], sensor.humidity)
          : sensor['pm2.5'];
        
        totalPM25 += correctedPM25;
        totalPM10 += sensor['pm10.0'] || 0;
        totalHumidity += sensor.humidity || 0;
        count++;
      }
    });

    if (count === 0) {
      throw new Error('No valid PM2.5 readings from PurpleAir sensors');
    }

    const avgPM25 = totalPM25 / count;
    const avgPM10 = totalPM10 / count;

    // Calculate AQI from PM2.5 (primary) and PM10
    const pm25AQI = pm25ToAQI(avgPM25);
    const pm10AQI = pm10ToAQI(avgPM10);
    
    // Use the higher AQI as the overall AQI
    const overallAQI = Math.max(pm25AQI, pm10AQI);
    
    const level = aqiToLevel(overallAQI);

    return {
      aqi: overallAQI,
      level,
      pollutants: {
        pm25: Math.round(avgPM25),
        pm10: Math.round(avgPM10),
        o3: -1, // PurpleAir doesn't measure ozone
        no2: -1, // PurpleAir doesn't measure NO2
        so2: -1, // PurpleAir doesn't measure SO2
        co: -1   // PurpleAir doesn't measure CO
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error fetching PurpleAir data:', error);
    throw error;
  }
}

/**
 * Debug function to test PurpleAir API calls and sensor filtering
 */
export async function debugPurpleAirSensors(lat: number, lon: number): Promise<{
  totalSensors: number;
  validSensors: number;
  sampleData: any[];
  filterBreakdown: any;
}> {
  try {
    const result = await fetchPurpleAirData(lat, lon);
    return {
      totalSensors: -1,
      validSensors: -1, 
      sampleData: [],
      filterBreakdown: { success: true, aqi: result.aqi }
    };
  } catch (error) {
    // This will trigger our debug logs
    console.error('Debug error:', error);
    return {
      totalSensors: 0,
      validSensors: 0,
      sampleData: [],
      filterBreakdown: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

/**
 * Get sensor information for debugging/display
 */
export async function getPurpleAirSensorInfo(lat: number, lon: number): Promise<string[]> {
  if (!PURPLEAIR_API_KEY) {
    return ['PurpleAir API key not configured'];
  }

  try {
    const fields = 'sensor_index,name,latitude,longitude,uptime,rssi';
    const url = `${BASE_URL}/sensors?fields=${fields}&location_type=0&max_age=3600&nwlat=${lat + 0.1}&nwlng=${lon - 0.1}&selat=${lat - 0.1}&selng=${lon + 0.1}`;
    
    const response = await fetch(url, {
      headers: {
        'X-API-Key': PURPLEAIR_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return [`PurpleAir API error: ${response.status}`];
    }

    const data: PurpleAirResponse = await response.json();
    
    const sensors = data.data.map(sensorData => convertArrayToSensor(sensorData, data.fields));
    
    return sensors.map(sensor => 
      `${sensor.name} (${sensor.sensor_index}) - ${sensor.latitude.toFixed(4)}, ${sensor.longitude.toFixed(4)}`
    );

  } catch (error) {
    return [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`];
  }
}