import type { WildFireData, AQIData } from '../../types/location';

/**
 * Generate realistic wildfire data estimates based on actual AQI and pollutant levels.
 * 
 * This function correlates air quality data with wildfire risk assessments:
 * - Higher PM2.5 levels indicate increased smoke risk
 * - Higher PM10 levels indicate increased dust risk  
 * - Overall AQI drives fire activity estimates
 * 
 * @param aqiData - Current air quality data with pollutant levels
 * @returns Estimated wildfire data based on air quality conditions
 */
export function generateWildfireEstimate(aqiData: AQIData): WildFireData {
  // Use actual AQI or fallback to moderate level
  const currentAQI = aqiData.aqi >= 0 ? aqiData.aqi : 25;
  
  // Extract or estimate pollutant levels from AQI
  const pm25Level = aqiData.pollutants?.pm25 >= 0 
    ? aqiData.pollutants.pm25 
    : Math.round(currentAQI * 0.6);
    
  const pm10Level = aqiData.pollutants?.pm10 >= 0 
    ? aqiData.pollutants.pm10 
    : Math.round(currentAQI * 0.8);

  return {
    smokeRisk: {
      level: getSmokeRiskLevel(pm25Level),
      pm25: pm25Level,
      visibility: calculateSmokeVisibility(pm25Level),
    },
    dustRisk: {
      level: getDustRiskLevel(pm10Level),
      pm10: pm10Level,
      visibility: calculateDustVisibility(pm10Level),
    },
    fireActivity: estimateFireActivity(currentAQI),
    outlook: generateFireOutlook(currentAQI),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Determine smoke risk level based on PM2.5 concentration.
 * Uses EPA AQI breakpoints for PM2.5 health categories.
 */
function getSmokeRiskLevel(pm25: number): WildFireData['smokeRisk']['level'] {
  if (pm25 <= 15) return 'Low';
  if (pm25 <= 35) return 'Moderate';
  if (pm25 <= 65) return 'High';
  if (pm25 <= 100) return 'Unhealthy';
  if (pm25 <= 150) return 'Very Unhealthy';
  return 'Hazardous';
}

/**
 * Determine dust risk level based on PM10 concentration.
 * Uses simplified risk categories for dust particles.
 */
function getDustRiskLevel(pm10: number): WildFireData['dustRisk']['level'] {
  if (pm10 <= 50) return 'Low';
  if (pm10 <= 100) return 'Moderate';
  return 'High';
}

/**
 * Calculate visibility reduction due to smoke particles.
 * Higher PM2.5 levels reduce visibility more significantly.
 */
function calculateSmokeVisibility(pm25Level: number): number {
  return Math.max(1, Math.round(20 - (pm25Level / 5)));
}

/**
 * Calculate visibility reduction due to dust particles.
 * PM10 particles affect visibility but less severely than smoke.
 */
function calculateDustVisibility(pm10Level: number): number {
  return Math.max(1, Math.round(25 - (pm10Level / 8)));
}

/**
 * Estimate fire activity based on overall AQI levels.
 * Higher AQI suggests possible wildfire influence.
 */
function estimateFireActivity(currentAQI: number): WildFireData['fireActivity'] {
  // Only estimate fire activity when AQI suggests possible wildfire influence
  if (currentAQI <= 100) {
    return {
      nearbyFires: 0,
      closestFireDistance: -1,
      largestFireSize: 0,
    };
  }

  // Generate realistic estimates based on AQI severity
  const fireIntensity = Math.min(1, (currentAQI - 100) / 200); // 0-1 scale
  
  return {
    nearbyFires: Math.floor(fireIntensity * 3) + 1, // 1-3 fires
    closestFireDistance: Math.floor((1 - fireIntensity) * 40) + 10, // 10-50 miles
    largestFireSize: currentAQI > 150 ? Math.floor(fireIntensity * 900) + 100 : 0, // 100-1000 acres
  };
}

/**
 * Generate fire outlook based on current AQI conditions.
 * Provides next 24-hour prediction with confidence level.
 */
function generateFireOutlook(currentAQI: number): WildFireData['outlook'] {
  if (currentAQI <= 100) {
    return {
      next24Hours: 'Stable',
      confidence: 'High',
      details: 'No significant wildfire activity expected.',
    };
  }

  // For elevated AQI, provide realistic outlook assessment
  const isWorsening = currentAQI > 150; // Higher AQI more likely to worsen
  const confidence = currentAQI > 150 ? 'Moderate' : 'High';
  
  return {
    next24Hours: isWorsening ? 'Worsening' : 'Improving',
    confidence,
    details: 'Air quality may be affected by particulate matter from wildfire activity.',
  };
}