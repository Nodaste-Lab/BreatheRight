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
  level: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  pollutants: {
    pm25: number;
    pm10: number;
    o3: number;
    no2: number;
    so2: number;
    co: number;
  };
  timestamp: string;
}

export interface PollenData {
  overall: number;
  tree: number;
  grass: number;
  weed: number;
  level: 'Low' | 'Low-Medium' | 'Medium' | 'Medium-High' | 'High';
  timestamp: string;
}

export interface LightningData {
  probability: number; // 0-100 percentage
  level: 'Low' | 'Moderate' | 'High';
  timestamp: string;
}

export interface LocationData {
  location: Location;
  aqi: AQIData | null;
  pollen: PollenData | null;
  lightning?: LightningData | null;
}