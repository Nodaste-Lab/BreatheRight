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

export interface LocationData {
  location: Location;
  aqi: AQIData;
  pollen: PollenData;
  lightning: LightningData;
  wildfire: WildFireData;
}