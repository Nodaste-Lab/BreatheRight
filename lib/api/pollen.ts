import type { PollenData } from '../../types/location';

/**
 * Fetch pollen data using multiple sources with fallbacks
 * Currently uses simplified estimation based on location and season
 * TODO: Integrate with Tomorrow.io or AccuWeather pollen APIs
 */
export async function fetchPollenData(lat: number, lon: number): Promise<PollenData> {
  try {
    // For now, we'll use a seasonal estimation model
    // In production, replace this with a real pollen API
    const pollenData = await estimatePollenData(lat, lon);
    return pollenData;
  } catch (error) {
    console.error('Error fetching pollen data:', error);
    // Return fallback data
    return getFallbackPollenData();
  }
}

/**
 * Estimate pollen levels based on location and current season
 * This is a simplified model - replace with real API in production
 */
async function estimatePollenData(lat: number, lon: number): Promise<PollenData> {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const isNorthernHemisphere = lat > 0;
  
  // Adjust season based on hemisphere
  const adjustedMonth = isNorthernHemisphere ? month : (month + 6) % 12;
  
  // Spring (March-May): High tree pollen
  // Summer (June-August): High grass pollen  
  // Fall (September-November): High weed pollen
  // Winter (December-February): Low overall
  
  let tree = 2, grass = 2, weed = 2;
  
  if (adjustedMonth >= 2 && adjustedMonth <= 4) {
    // Spring - high tree pollen
    tree = Math.floor(Math.random() * 4) + 6; // 6-9
    grass = Math.floor(Math.random() * 3) + 2; // 2-4
    weed = Math.floor(Math.random() * 2) + 1;  // 1-2
  } else if (adjustedMonth >= 5 && adjustedMonth <= 7) {
    // Summer - high grass pollen
    tree = Math.floor(Math.random() * 3) + 3;  // 3-5
    grass = Math.floor(Math.random() * 4) + 6; // 6-9
    weed = Math.floor(Math.random() * 3) + 2;  // 2-4
  } else if (adjustedMonth >= 8 && adjustedMonth <= 10) {
    // Fall - high weed pollen
    tree = Math.floor(Math.random() * 2) + 1;  // 1-2
    grass = Math.floor(Math.random() * 3) + 2; // 2-4
    weed = Math.floor(Math.random() * 4) + 6;  // 6-9
  } else {
    // Winter - low overall
    tree = Math.floor(Math.random() * 2) + 1;  // 1-2
    grass = Math.floor(Math.random() * 2) + 1; // 1-2
    weed = Math.floor(Math.random() * 2) + 1;  // 1-2
  }
  
  // Add some location-based variation
  const locationFactor = Math.abs(Math.sin(lat * Math.PI / 180) * Math.cos(lon * Math.PI / 180));
  tree = Math.min(10, Math.max(1, Math.round(tree * (0.7 + locationFactor * 0.6))));
  grass = Math.min(10, Math.max(1, Math.round(grass * (0.7 + locationFactor * 0.6))));
  weed = Math.min(10, Math.max(1, Math.round(weed * (0.7 + locationFactor * 0.6))));
  
  const overall = Math.round((tree + grass + weed) / 3);
  
  return {
    overall,
    tree,
    grass,
    weed,
    level: getPollenLevel(overall),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Convert pollen count to risk level
 */
function getPollenLevel(count: number): PollenData['level'] {
  if (count <= 2) return 'Low';
  if (count <= 4) return 'Low-Medium';
  if (count <= 6) return 'Medium';
  if (count <= 8) return 'Medium-High';
  return 'High';
}

/**
 * Fallback pollen data when API fails
 */
function getFallbackPollenData(): PollenData {
  return {
    overall: 3,
    tree: 3,
    grass: 3,
    weed: 2,
    level: 'Low-Medium',
    timestamp: new Date().toISOString(),
  };
}

// TODO: Implement real pollen API integration
// Example integration with Tomorrow.io:
/*
const TOMORROW_IO_API_KEY = process.env.EXPO_PUBLIC_TOMORROW_IO_API_KEY;

export async function fetchTomorrowIoPollenData(lat: number, lon: number): Promise<PollenData> {
  const url = `https://api.tomorrow.io/v4/timelines?location=${lat},${lon}&fields=treeIndex,grassIndex,weedIndex&timesteps=current&apikey=${TOMORROW_IO_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  const current = data.data.timelines[0].intervals[0].values;
  
  return {
    overall: Math.round((current.treeIndex + current.grassIndex + current.weedIndex) / 3),
    tree: current.treeIndex,
    grass: current.grassIndex,
    weed: current.weedIndex,
    level: getPollenLevel(Math.round((current.treeIndex + current.grassIndex + current.weedIndex) / 3)),
    timestamp: new Date().toISOString(),
  };
}
*/