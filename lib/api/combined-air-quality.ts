import type { AQIData } from '../../types/location';
import { fetchGoogleAirQuality } from './google-air-quality';
import { fetchAirPollutionData } from './openweather';
import { fetchWAQIData } from './waqi';
import { fetchPurpleAirData } from './purpleair';
import { fetchAirNowObservations } from './airnow';
import { fetchMicrosoftCurrentAirQuality } from './microsoft-weather';

export interface CombinedAQIData extends AQIData {
  sources: {
    google?: boolean;
    openweather?: boolean;
    waqi?: boolean;
    purpleair?: boolean;
    airnow?: boolean;
    microsoft?: boolean;
  };
  confidence: 'high' | 'medium' | 'low' | 'conflicting';
  discrepancy?: {
    detected: boolean;
    maxDifference: number;
    strategy: 'average' | 'weighted_average' | 'median' | 'favor_majority' | 'flag_uncertainty';
    details: string;
  };
  rawData?: {
    google?: AQIData;
    openweather?: AQIData;
    waqi?: AQIData;
    purpleair?: AQIData;
    airnow?: AQIData;
    microsoft?: AQIData;
  };
}

/**
 * Convert AirNow observations to AQI format
 */
async function convertAirNowToAQI(lat: number, lon: number): Promise<AQIData | undefined> {
  try {
    const observations = await fetchAirNowObservations(lat, lon);
    
    if (!observations || observations.length === 0) {
      return undefined;
    }

    // Extract different pollutants
    const pm25Obs = observations.find(obs => obs.ParameterName === 'PM2.5');
    const pm10Obs = observations.find(obs => obs.ParameterName === 'PM10');
    const ozoneObs = observations.find(obs => obs.ParameterName === 'OZONE');

    // Use the highest AQI among available pollutants as overall AQI
    const aqiValues = [pm25Obs?.AQI, pm10Obs?.AQI, ozoneObs?.AQI].filter(val => val !== undefined && val >= 0) as number[];
    const overallAQI = aqiValues.length > 0 ? Math.max(...aqiValues) : -1;

    // Determine level from overall AQI
    let level: AQIData['level'] = 'Unknown';
    if (overallAQI >= 0) {
      if (overallAQI <= 50) level = 'Good';
      else if (overallAQI <= 100) level = 'Moderate';
      else if (overallAQI <= 150) level = 'Unhealthy for Sensitive Groups';
      else if (overallAQI <= 200) level = 'Unhealthy';
      else if (overallAQI <= 300) level = 'Very Unhealthy';
      else level = 'Hazardous';
    }

    return {
      aqi: overallAQI,
      level,
      pollutants: {
        pm25: pm25Obs?.AQI || -1,
        pm10: pm10Obs?.AQI || -1,
        o3: ozoneObs?.AQI || -1,
        no2: -1, // AirNow doesn't provide NO2
        so2: -1, // AirNow doesn't provide SO2
        co: -1,  // AirNow doesn't provide CO
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error converting AirNow data:', error);
    return undefined;
  }
}

/**
 * Analyze discrepancies between five AQI sources and determine best value
 */
function analyzeFiveSourceDiscrepancy(
  googleAQI?: number, 
  openWeatherAQI?: number,
  waqiAQI?: number,
  purpleairAQI?: number,
  airnowAQI?: number
): { value: number; discrepancy?: CombinedAQIData['discrepancy'] } {
  // Collect valid values
  const values: { source: string; value: number }[] = [];
  if (googleAQI !== undefined && googleAQI >= 0) values.push({ source: 'Google', value: googleAQI });
  if (openWeatherAQI !== undefined && openWeatherAQI >= 0) values.push({ source: 'OpenWeather', value: openWeatherAQI });
  if (waqiAQI !== undefined && waqiAQI >= 0) values.push({ source: 'WAQI', value: waqiAQI });
  if (purpleairAQI !== undefined && purpleairAQI >= 0) values.push({ source: 'PurpleAir', value: purpleairAQI });
  if (airnowAQI !== undefined && airnowAQI >= 0) values.push({ source: 'AirNow', value: airnowAQI });
  
  if (values.length === 0) {
    return { value: -1 };
  }
  
  if (values.length === 1) {
    return { value: values[0].value };
  }
  
  // Calculate statistics for multiple values
  const sortedValues = values.map(v => v.value).sort((a, b) => a - b);
  const min = sortedValues[0];
  const max = sortedValues[sortedValues.length - 1];
  const maxDifference = max - min;
  const mean = sortedValues.reduce((sum, val) => sum + val, 0) / sortedValues.length;
  const median = sortedValues.length % 2 === 0 
    ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
    : sortedValues[Math.floor(sortedValues.length / 2)];
  
  let strategy: 'average' | 'weighted_average' | 'median' | 'favor_majority' | 'flag_uncertainty';
  let finalValue: number;
  let details: string;
  
  console.log(`📊 Five-source AQI comparison:`, values.map(v => `${v.source}=${v.value}`).join(', '));
  
  // Determine if there's significant discrepancy
  const isSignificantDiscrepancy = maxDifference > 30;
  
  if (values.length >= 4) {
    // Four or five sources available
    if (maxDifference > 60) {
      // Very large discrepancy - use median to avoid outliers
      strategy = 'median';
      finalValue = Math.round(median);
      details = `Very large variance (${maxDifference}pts). Using median value.`;
      console.warn(`⚠️  Large ${values.length}-source discrepancy: range ${min}-${max}, using median ${finalValue}`);
    } else if (maxDifference > 40) {
      // Moderate discrepancy - weighted average favoring official sources
      strategy = 'weighted_average';
      const googleWeight = 0.25;
      const airnowWeight = airnowAQI !== undefined ? 0.25 : 0; // EPA official source
      const purpleairWeight = 0.25; // Very reliable for PM2.5
      const waqiWeight = 0.15;
      const openweatherWeight = 1 - googleWeight - airnowWeight - purpleairWeight - waqiWeight;
      finalValue = Math.round(
        (googleAQI || 0) * googleWeight + 
        (airnowAQI || 0) * airnowWeight +
        (purpleairAQI || 0) * purpleairWeight +
        (waqiAQI || 0) * waqiWeight + 
        (openWeatherAQI || 0) * openweatherWeight
      );
      details = `Moderate variance (${maxDifference}pts). Weighted average.`;
      console.log(`📊 ${values.length}-source weighted average: ${finalValue}`);
    } else {
      // Good agreement - simple average
      strategy = 'average';
      finalValue = Math.round(mean);
      details = `Good agreement across sources.`;
    }
  } else if (values.length === 3) {
    // Three sources available
    if (maxDifference > 50) {
      // Large discrepancy - use median to avoid outliers
      strategy = 'median';
      finalValue = Math.round(median);
      details = `Large variance (${maxDifference}pts). Using median value.`;
      console.warn(`⚠️  Large 3-source discrepancy: range ${min}-${max}, using median ${finalValue}`);
    } else if (maxDifference > 30) {
      // Moderate discrepancy - weighted average favoring official sources
      strategy = 'weighted_average';
      const googleWeight = 0.3;
      const airnowWeight = airnowAQI !== undefined ? 0.3 : 0;
      const purpleairWeight = purpleairAQI !== undefined ? 0.25 : 0;
      const waqiWeight = waqiAQI !== undefined ? 0.15 : 0;
      const openweatherWeight = 1 - googleWeight - airnowWeight - purpleairWeight - waqiWeight;
      finalValue = Math.round(
        (googleAQI || 0) * googleWeight + 
        (airnowAQI || 0) * airnowWeight +
        (purpleairAQI || 0) * purpleairWeight +
        (waqiAQI || 0) * waqiWeight + 
        (openWeatherAQI || 0) * openweatherWeight
      );
      details = `Moderate variance (${maxDifference}pts). Weighted average.`;
      console.log(`📊 3-source weighted average: ${finalValue}`);
    } else {
      // Good agreement - simple average
      strategy = 'average';
      finalValue = Math.round(mean);
      details = `Good agreement across sources.`;
    }
  } else {
    // Two or fewer sources available
    if (maxDifference > 50) {
      // Large discrepancy between sources - favor official sources first
      strategy = 'favor_majority';
      if (airnowAQI !== undefined && airnowAQI >= 0) {
        finalValue = airnowAQI;
        details = `Large variance. Favoring AirNow (EPA official).`;
      } else if (googleAQI !== undefined && googleAQI >= 0) {
        finalValue = googleAQI;
        details = `Large variance. Favoring Google.`;
      } else if (purpleairAQI !== undefined && purpleairAQI >= 0) {
        finalValue = purpleairAQI;
        details = `Large variance. Favoring PurpleAir.`;
      } else if (waqiAQI !== undefined && waqiAQI >= 0) {
        finalValue = waqiAQI;
        details = `Large variance. Favoring WAQI.`;
      } else {
        finalValue = openWeatherAQI!;
        details = `Using OpenWeather (only available source).`;
      }
    } else {
      // Reasonable agreement - weighted average
      strategy = 'weighted_average';
      finalValue = Math.round(mean);
      details = `${values.length}-source average.`;
    }
  }
  
  return {
    value: finalValue,
    discrepancy: isSignificantDiscrepancy ? {
      detected: true,
      maxDifference,
      strategy,
      details
    } : undefined
  };
}

/**
 * Analyze discrepancy between six air quality sources and determine best combination strategy
 */
function analyzeSixSourceDiscrepancy(
  googleAQI?: number, 
  openWeatherAQI?: number,
  waqiAQI?: number,
  purpleairAQI?: number,
  airnowAQI?: number,
  microsoftAQI?: number
): { value: number; discrepancy?: CombinedAQIData['discrepancy'] } {
  // Collect valid values
  const values: { source: string; value: number }[] = [];
  if (googleAQI !== undefined && googleAQI >= 0) values.push({ source: 'Google', value: googleAQI });
  if (openWeatherAQI !== undefined && openWeatherAQI >= 0) values.push({ source: 'OpenWeather', value: openWeatherAQI });
  if (waqiAQI !== undefined && waqiAQI >= 0) values.push({ source: 'WAQI', value: waqiAQI });
  if (purpleairAQI !== undefined && purpleairAQI >= 0) values.push({ source: 'PurpleAir', value: purpleairAQI });
  if (airnowAQI !== undefined && airnowAQI >= 0) values.push({ source: 'AirNow', value: airnowAQI });
  if (microsoftAQI !== undefined && microsoftAQI >= 0) values.push({ source: 'Microsoft', value: microsoftAQI });
  
  if (values.length === 0) {
    return { value: -1 };
  }
  
  if (values.length === 1) {
    return { value: values[0].value };
  }
  
  // Calculate statistics for multiple values
  const sortedValues = values.map(v => v.value).sort((a, b) => a - b);
  const min = sortedValues[0];
  const max = sortedValues[sortedValues.length - 1];
  const maxDifference = max - min;
  const mean = sortedValues.reduce((sum, val) => sum + val, 0) / sortedValues.length;
  const median = sortedValues.length % 2 === 0 
    ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
    : sortedValues[Math.floor(sortedValues.length / 2)];
  
  let strategy: 'average' | 'weighted_average' | 'median' | 'favor_majority' | 'flag_uncertainty';
  let finalValue: number;
  let details: string;
  
  console.log(`📊 Six-source AQI comparison:`, values.map(v => `${v.source}=${v.value}`).join(', '));
  
  // Determine if there's significant discrepancy
  const isSignificantDiscrepancy = maxDifference > 30;
  
  if (values.length >= 5) {
    // Five or six sources available
    if (maxDifference > 60) {
      // Very large discrepancy - use median to avoid outliers
      strategy = 'median';
      finalValue = Math.round(median);
      details = `Very large variance (${maxDifference}pts). Using median value.`;
      console.warn(`⚠️  Large ${values.length}-source discrepancy: range ${min}-${max}, using median ${finalValue}`);
    } else if (maxDifference > 40) {
      // Moderate discrepancy - weighted average favoring official sources
      strategy = 'weighted_average';
      const weights = {
        google: 0.2,
        airnow: airnowAQI !== undefined ? 0.25 : 0, // EPA official source
        microsoft: microsoftAQI !== undefined ? 0.2 : 0, // Microsoft official source
        purpleair: purpleairAQI !== undefined ? 0.2 : 0, // Very reliable for PM2.5
        waqi: waqiAQI !== undefined ? 0.1 : 0,
        openweather: 0.05
      };
      // Normalize weights to sum to 1
      const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
      const normalizedWeights = Object.fromEntries(
        Object.entries(weights).map(([key, value]) => [key, value / totalWeight])
      );
      
      finalValue = Math.round(
        (googleAQI || 0) * normalizedWeights.google + 
        (airnowAQI || 0) * normalizedWeights.airnow +
        (microsoftAQI || 0) * normalizedWeights.microsoft +
        (purpleairAQI || 0) * normalizedWeights.purpleair +
        (waqiAQI || 0) * normalizedWeights.waqi + 
        (openWeatherAQI || 0) * normalizedWeights.openweather
      );
      details = `Moderate variance (${maxDifference}pts). Weighted average favoring official sources.`;
      console.log(`📊 ${values.length}-source weighted average: ${finalValue}`);
    } else {
      // Good agreement - simple average
      strategy = 'average';
      finalValue = Math.round(mean);
      details = `Good agreement across sources.`;
    }
  } else {
    // Fewer sources - use median for robustness
    strategy = 'median';
    finalValue = Math.round(median);
    details = `${values.length}-source median value.`;
  }
  
  return {
    value: finalValue,
    discrepancy: isSignificantDiscrepancy ? {
      detected: true,
      maxDifference,
      strategy,
      details
    } : undefined
  };
}

/**
 * Merge pollutant data from five sources
 * Takes the average when multiple sources are available, otherwise uses whichever is available
 */
function mergeFiveSourcePollutants(
  googlePollutants?: AQIData['pollutants'],
  openWeatherPollutants?: AQIData['pollutants'],
  waqiPollutants?: AQIData['pollutants'],
  purpleairPollutants?: AQIData['pollutants'],
  airnowPollutants?: AQIData['pollutants']
): AQIData['pollutants'] {
  const merged: AQIData['pollutants'] = {
    pm25: -1,
    pm10: -1,
    o3: -1,
    no2: -1,
    so2: -1,
    co: -1,
  };

  const pollutantKeys: (keyof AQIData['pollutants'])[] = ['pm25', 'pm10', 'o3', 'no2', 'so2', 'co'];

  pollutantKeys.forEach(key => {
    const values: number[] = [];
    
    // Collect valid values from all sources
    if (googlePollutants?.[key] !== undefined && googlePollutants[key] >= 0) {
      values.push(googlePollutants[key]);
    }
    if (openWeatherPollutants?.[key] !== undefined && openWeatherPollutants[key] >= 0) {
      values.push(openWeatherPollutants[key]);
    }
    if (waqiPollutants?.[key] !== undefined && waqiPollutants[key] >= 0) {
      values.push(waqiPollutants[key]);
    }
    if (purpleairPollutants?.[key] !== undefined && purpleairPollutants[key] >= 0) {
      values.push(purpleairPollutants[key]);
    }
    if (airnowPollutants?.[key] !== undefined && airnowPollutants[key] >= 0) {
      values.push(airnowPollutants[key]);
    }
    
    // Calculate average of available values
    if (values.length > 0) {
      merged[key] = Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
    }
  });

  return merged;
}

/**
 * Determine AQI level based on combined value
 */
function determineLevel(aqi: number): AQIData['level'] {
  if (aqi < 0) return 'Unknown';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

/**
 * Determine confidence level based on five data sources and discrepancies
 */
function determineFiveSourceConfidence(
  googleSuccess: boolean, 
  openWeatherSuccess: boolean,
  waqiSuccess: boolean,
  purpleairSuccess: boolean,
  airnowSuccess: boolean,
  discrepancy?: CombinedAQIData['discrepancy']
): CombinedAQIData['confidence'] {
  const successCount = [googleSuccess, openWeatherSuccess, waqiSuccess, purpleairSuccess, airnowSuccess].filter(Boolean).length;
  
  if (successCount === 0) return 'low';
  if (successCount === 1) return 'medium';
  
  // Multiple sources available
  if (discrepancy?.detected) {
    // If there's significant discrepancy, confidence depends on strategy
    return discrepancy.strategy === 'median' ? 'medium' : 'conflicting';
  }
  
  // Good agreement between sources
  return successCount >= 4 ? 'high' : 'medium';
}

/**
 * Merge pollutant data from six sources
 */
function mergeSixSourcePollutants(
  googlePollutants?: AQIData['pollutants'],
  openWeatherPollutants?: AQIData['pollutants'],
  waqiPollutants?: AQIData['pollutants'],
  purpleairPollutants?: AQIData['pollutants'],
  airnowPollutants?: AQIData['pollutants'],
  microsoftPollutants?: AQIData['pollutants']
): AQIData['pollutants'] {
  // Collect all available pollutant values
  const allPollutants = [googlePollutants, openWeatherPollutants, waqiPollutants, purpleairPollutants, airnowPollutants, microsoftPollutants].filter(Boolean);
  
  if (allPollutants.length === 0) {
    return { pm25: 0, pm10: 0, o3: 0, no2: 0, so2: 0, co: 0 };
  }

  // Average each pollutant across available sources
  const merged = {
    pm25: Math.round(allPollutants.reduce((sum, p) => sum + (p!.pm25 || 0), 0) / allPollutants.length),
    pm10: Math.round(allPollutants.reduce((sum, p) => sum + (p!.pm10 || 0), 0) / allPollutants.length),
    o3: Math.round(allPollutants.reduce((sum, p) => sum + (p!.o3 || 0), 0) / allPollutants.length),
    no2: Math.round(allPollutants.reduce((sum, p) => sum + (p!.no2 || 0), 0) / allPollutants.length),
    so2: Math.round(allPollutants.reduce((sum, p) => sum + (p!.so2 || 0), 0) / allPollutants.length),
    co: Math.round(allPollutants.reduce((sum, p) => sum + (p!.co || 0), 0) / allPollutants.length)
  };

  return merged;
}

/**
 * Determine confidence level based on six data sources and discrepancies
 */
function determineSixSourceConfidence(
  googleSuccess: boolean, 
  openWeatherSuccess: boolean,
  waqiSuccess: boolean,
  purpleairSuccess: boolean,
  airnowSuccess: boolean,
  microsoftSuccess: boolean,
  discrepancy?: CombinedAQIData['discrepancy']
): CombinedAQIData['confidence'] {
  const successCount = [googleSuccess, openWeatherSuccess, waqiSuccess, purpleairSuccess, airnowSuccess, microsoftSuccess].filter(Boolean).length;
  
  if (successCount === 0) return 'low';
  if (successCount === 1) return 'medium';
  
  // Multiple sources available
  if (discrepancy?.detected) {
    // If there's significant discrepancy, confidence depends on strategy
    return discrepancy.strategy === 'median' ? 'medium' : 'conflicting';
  }
  
  // Good agreement between sources
  return successCount >= 5 ? 'high' : 'medium';
}

/**
 * Fetch air quality data from Microsoft only
 */
export async function fetchCombinedAirQuality(lat: number, lon: number): Promise<CombinedAQIData> {
  // Use only Microsoft data
  const microsoftResult = await Promise.allSettled([
    fetchMicrosoftCurrentAirQuality(lat, lon)
  ]);

  const microsoftData = microsoftResult[0].status === 'fulfilled' ? microsoftResult[0].value : undefined;

  // Log results for debugging
  if (microsoftResult[0].status === 'rejected') {
    console.log('Microsoft Air Quality API failed:', microsoftResult[0].reason?.message || 'Unknown error');
  } else {
    console.log('Microsoft Air Quality API succeeded, AQI:', microsoftData?.aqi);
  }

  // Use Microsoft data directly since it's our only source
  const combinedAQI = microsoftData?.aqi || -1;
  const level = microsoftData?.level || 'Unknown';
  const pollutants = microsoftData?.pollutants || { pm25: -1, pm10: -1, o3: -1, no2: -1, so2: -1, co: -1 };
  const confidence: CombinedAQIData['confidence'] = microsoftData ? 'high' : 'low';

  // Build the combined result
  const result: CombinedAQIData = {
    aqi: combinedAQI,
    level,
    pollutants,
    timestamp: microsoftData?.timestamp || new Date().toISOString(),
    sources: {
      google: false,
      openweather: false,
      waqi: false,
      purpleair: false,
      airnow: false,
      microsoft: microsoftResult[0].status === 'fulfilled'
    },
    confidence,
    rawData: {
      microsoft: microsoftData
    },
    ...(microsoftData && { 
      description: (microsoftData as any).description,
      dominantPollutant: (microsoftData as any).dominantPollutant,
      color: (microsoftData as any).color
    })
  };

  // Add error if no data available
  if (combinedAQI < 0) {
    result.error = 'No air quality data available from any source';
  }

  return result;
}

/**
 * Get a descriptive message about data sources (Microsoft-only)
 */
export function getDataSourceMessage(sources: CombinedAQIData['sources']): string {
  if (sources.microsoft) {
    return 'Data from Microsoft Azure Maps';
  }
  return 'No air quality data available';
}

/**
 * Get confidence indicator
 */
export function getConfidenceIndicator(confidence: CombinedAQIData['confidence']): string {
  switch (confidence) {
    case 'high':
      return '●●●●●'; // Five dots - multiple sources agree
    case 'medium':
      return '●●●●○'; // Four dots - good coverage
    case 'conflicting':
      return '⚠●●●●'; // Warning - sources disagree significantly
    case 'low':
      return '●○○○○'; // One dot - limited sources
    default:
      return '○○○○○';
  }
}

/**
 * Get discrepancy warning message
 */
export function getDiscrepancyMessage(data: CombinedAQIData): string | null {
  if (!data.discrepancy?.detected) return null;
  
  const { strategy, maxDifference } = data.discrepancy;
  
  switch (strategy) {
    case 'favor_majority':
      return `⚠️ Large data variance detected (+${maxDifference} points). Using preferred source.`;
    case 'flag_uncertainty':
      return `⚠️ Sources disagree by ${maxDifference} points. Data averaged but uncertain.`;
    default:
      return null;
  }
}