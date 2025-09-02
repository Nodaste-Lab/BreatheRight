export interface Location {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  google_place_id?: string;
  show_in_home: boolean;
  notify_daily: boolean;
  created_at: string;
}

export interface AQIData {
  aqi: number;
  level: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous' | 'Unknown';
  pollutants: {
    pm25: number;
    pm10: number;
    o3: number;
    no2: number;
    so2: number;
    co: number;
  };
  timestamp: string;
  error?: string;
}

export interface PollenData {
  overall: number;
  tree: number;
  grass: number;
  weed: number;
  level: 'Low' | 'Low-Medium' | 'Medium' | 'Medium-High' | 'High' | 'Unknown';
  timestamp: string;
  error?: string;
}

export interface LightningData {
  probability: number; // 0-100 percentage, -1 for N/A
  level: 'Low' | 'Moderate' | 'High' | 'Unknown';
  timestamp: string;
  error?: string;
}

export interface WildFireData {
  smokeRisk: {
    level: 'Low' | 'Moderate' | 'High' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous' | 'Unknown';
    pm25: number; // PM2.5 concentration from smoke
    visibility: number; // Visibility in miles, -1 if unavailable
  };
  dustRisk: {
    level: 'Low' | 'Moderate' | 'High' | 'Unknown';
    pm10: number; // PM10 concentration from dust
    visibility: number; // Visibility in miles, -1 if unavailable  
  };
  fireActivity: {
    nearbyFires: number; // Number of fires within 50 miles
    closestFireDistance: number; // Miles to closest fire, -1 if no fires
    largestFireSize: number; // Acres of largest nearby fire, -1 if no fires
  };
  outlook: {
    next24Hours: 'Improving' | 'Stable' | 'Worsening' | 'Unknown';
    confidence: 'Low' | 'Moderate' | 'High';
    details: string;
  };
  timestamp: string;
  error?: string;
}

export interface WeatherData {
  temperature: {
    current: number;
    feelsLike: number;
    unit: string; // 'C' or 'F'
  };
  conditions: {
    phrase: string; // e.g., "Partly cloudy", "Thunderstorms"
    iconCode: number;
    isDayTime: boolean;
  };
  details: {
    humidity: number; // percentage
    windSpeed: number;
    windDirection: string;
    visibility: number;
    uvIndex: number;
    pressure: number;
    cloudCover: number; // percentage
  };
  precipitation: {
    hasPrecipitation: boolean;
    type: string | null; // 'Rain', 'Snow', etc.
    pastHour: number; // mm
    past24Hours: number; // mm
  };
  timestamp: string;
  error?: string;
}

export interface SevereWeatherAlert {
  id: number;
  category: string;
  priority: number;
  description: string;
  severity: string;
  startTime: string;
  endTime: string;
  area: string;
  source: string;
}

export interface DailyHealthIndex {
  name: string;
  value: number;
  category: string;
  description: string;
  date: string;
}

export interface MicrosoftWeatherData {
  currentAirQuality?: AQIData;
  airQualityForecast?: AQIData[];
  severeAlerts?: {
    alerts: SevereWeatherAlert[];
    timestamp: string;
  };
  dailyIndices?: {
    indices: DailyHealthIndex[];
    timestamp: string;
  };
  pollenForecast?: {
    forecasts: Array<{
      date: string;
      pollen: {
        grass: { value: number; category: string; };
        tree: { value: number; category: string; };
        weed: { value: number; category: string; };
        mold: { value: number; category: string; };
      };
      uvIndex: { value: number; category: string; };
    }>;
    timestamp: string;
  };
}

export interface LocationData {
  location: Location;
  aqi: AQIData;
  microsoft?: MicrosoftWeatherData;
}