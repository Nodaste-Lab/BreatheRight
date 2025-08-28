import type { LightningData } from '../../types/location';

const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface OpenWeatherResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  clouds: {
    all: number;
  };
  rain?: {
    '1h'?: number;
    '3h'?: number;
  };
  dt: number;
}

export interface OpenWeatherForecast {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      humidity: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
    }>;
    clouds: {
      all: number;
    };
    pop: number; // Probability of precipitation
    rain?: {
      '3h'?: number;
    };
  }>;
}

/**
 * Calculate storm probability based on weather conditions
 * OpenWeatherMap weather codes:
 * - 2xx: Thunderstorm
 * - 3xx: Drizzle
 * - 5xx: Rain
 * - 6xx: Snow
 */
function calculateStormProbability(weatherData: OpenWeatherResponse, forecastData?: OpenWeatherForecast): LightningData {
  // Check current weather for thunderstorms
  const hasThunderstorm = weatherData.weather.some(w => w.id >= 200 && w.id < 300);
  const hasHeavyRain = weatherData.weather.some(w => w.id >= 502 && w.id < 600);
  const cloudCover = weatherData.clouds.all;
  const humidity = weatherData.main.humidity;
  
  let probability = 0;
  let level: LightningData['level'] = 'Low';
  
  if (hasThunderstorm) {
    // Current thunderstorm
    probability = Math.min(90, 70 + cloudCover / 5);
    level = 'High';
  } else if (forecastData) {
    // Check forecast for upcoming storms
    const next6Hours = forecastData.list.slice(0, 2); // Next 6 hours (3-hour intervals)
    const stormInForecast = next6Hours.some(item => 
      item.weather.some(w => w.id >= 200 && w.id < 300)
    );
    
    if (stormInForecast) {
      // Storm predicted in next 6 hours
      const maxPop = Math.max(...next6Hours.map(item => item.pop * 100));
      probability = Math.min(80, maxPop);
      level = maxPop > 60 ? 'High' : 'Moderate';
    } else if (hasHeavyRain || cloudCover > 80) {
      // Heavy rain or very cloudy conditions
      probability = Math.min(50, cloudCover / 2 + (humidity > 70 ? 10 : 0));
      level = probability > 30 ? 'Moderate' : 'Low';
    } else {
      // Calculate based on atmospheric conditions
      const humidityFactor = humidity > 60 ? (humidity - 60) / 2 : 0;
      const cloudFactor = cloudCover / 4;
      probability = Math.min(40, humidityFactor + cloudFactor);
      level = probability > 30 ? 'Moderate' : 'Low';
    }
  } else {
    // No forecast data, use current conditions only
    if (hasHeavyRain) {
      probability = 40;
      level = 'Moderate';
    } else {
      const humidityFactor = humidity > 60 ? (humidity - 60) / 4 : 0;
      const cloudFactor = cloudCover / 5;
      probability = Math.min(30, humidityFactor + cloudFactor);
      level = 'Low';
    }
  }
  
  return {
    probability: Math.round(probability),
    level,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Fetch current weather and storm probability
 */
export async function fetchWeatherData(lat: number, lon: number): Promise<LightningData> {
  if (!OPENWEATHER_API_KEY) {
    throw new Error('OpenWeatherMap API key not configured');
  }

  try {
    // Fetch both current weather and forecast
    const [weatherResponse, forecastResponse] = await Promise.all([
      fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`),
      fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&cnt=8&appid=${OPENWEATHER_API_KEY}`) // Next 24 hours
    ]);
    
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status} ${weatherResponse.statusText}`);
    }

    const weatherData: OpenWeatherResponse = await weatherResponse.json();
    let forecastData: OpenWeatherForecast | undefined;
    
    if (forecastResponse.ok) {
      forecastData = await forecastResponse.json();
    }
    
    return calculateStormProbability(weatherData, forecastData);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}

/**
 * Get simple storm status based on current weather only (faster, single API call)
 */
export async function fetchQuickStormStatus(lat: number, lon: number): Promise<LightningData> {
  if (!OPENWEATHER_API_KEY) {
    throw new Error('OpenWeatherMap API key not configured');
  }

  try {
    const response = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    const weatherData: OpenWeatherResponse = await response.json();
    return calculateStormProbability(weatherData);
  } catch (error) {
    console.error('Error fetching quick storm status:', error);
    throw error;
  }
}