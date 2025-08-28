import type { AQIData } from '../../types/location';
import { fetchGoogleAirQuality } from './google-air-quality';
import { fetchAirPollutionData } from './openweather';
import { fetchWAQIData } from './waqi';
import { fetchPurpleAirData } from './purpleair';
import { fetchAirNowObservations } from './airnow';

export interface CombinedAQIData extends AQIData {
  sources: {
    google?: boolean;
    openweather?: boolean;
    waqi?: boolean;
    purpleair?: boolean;
    airnow?: boolean;
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
 * Fetch air quality data from five sources and combine them intelligently
 */
export async function fetchCombinedAirQuality(lat: number, lon: number): Promise<CombinedAQIData> {
  // Fetch from all five sources in parallel
  const [googleResult, openWeatherResult, waqiResult, purpleairResult, airnowResult] = await Promise.allSettled([
    fetchGoogleAirQuality(lat, lon),
    fetchAirPollutionData(lat, lon),
    fetchWAQIData(lat, lon),
    fetchPurpleAirData(lat, lon),
    convertAirNowToAQI(lat, lon)
  ]);

  const googleData = googleResult.status === 'fulfilled' ? googleResult.value : undefined;
  const openWeatherData = openWeatherResult.status === 'fulfilled' ? openWeatherResult.value : undefined;
  const waqiData = waqiResult.status === 'fulfilled' ? waqiResult.value : undefined;
  const purpleairData = purpleairResult.status === 'fulfilled' ? purpleairResult.value : undefined;
  const airnowData = airnowResult.status === 'fulfilled' ? airnowResult.value : undefined;

  // Log results for debugging
  if (googleResult.status === 'rejected') {
    console.log('Google Air Quality API failed:', googleResult.reason?.message || 'Unknown error');
  } else {
    console.log('Google Air Quality API succeeded, AQI:', googleData?.aqi);
  }

  if (openWeatherResult.status === 'rejected') {
    console.log('OpenWeather Air Pollution API failed:', openWeatherResult.reason?.message || 'Unknown error');
  } else {
    console.log('OpenWeather Air Pollution API succeeded, AQI:', openWeatherData?.aqi);
  }

  if (waqiResult.status === 'rejected') {
    console.log('WAQI API failed:', waqiResult.reason?.message || 'Unknown error');
  } else {
    console.log('WAQI API succeeded, AQI:', waqiData?.aqi);
  }

  if (purpleairResult.status === 'rejected') {
    console.log('PurpleAir API failed:', purpleairResult.reason?.message || 'Unknown error');
  } else {
    console.log('PurpleAir API succeeded, AQI:', purpleairData?.aqi);
  }

  if (airnowResult.status === 'rejected') {
    console.log('AirNow API failed:', airnowResult.reason?.message || 'Unknown error');
  } else {
    console.log('AirNow API succeeded, AQI:', airnowData?.aqi);
  }

  // Analyze discrepancies and combine the data
  const aqiAnalysis = analyzeFiveSourceDiscrepancy(googleData?.aqi, openWeatherData?.aqi, waqiData?.aqi, purpleairData?.aqi, airnowData?.aqi);
  const combinedAQI = aqiAnalysis.value;
  const mergedPollutants = mergeFiveSourcePollutants(googleData?.pollutants, openWeatherData?.pollutants, waqiData?.pollutants, purpleairData?.pollutants, airnowData?.pollutants);
  const level = determineLevel(combinedAQI);
  const confidence = determineFiveSourceConfidence(
    googleResult.status === 'fulfilled',
    openWeatherResult.status === 'fulfilled',
    waqiResult.status === 'fulfilled',
    purpleairResult.status === 'fulfilled',
    airnowResult.status === 'fulfilled',
    aqiAnalysis.discrepancy
  );

  // Build the combined result
  const result: CombinedAQIData = {
    aqi: combinedAQI,
    level,
    pollutants: mergedPollutants,
    timestamp: new Date().toISOString(),
    sources: {
      google: googleResult.status === 'fulfilled',
      openweather: openWeatherResult.status === 'fulfilled',
      waqi: waqiResult.status === 'fulfilled',
      purpleair: purpleairResult.status === 'fulfilled',
      airnow: airnowResult.status === 'fulfilled'
    },
    confidence,
    discrepancy: aqiAnalysis.discrepancy,
    rawData: {
      google: googleData,
      openweather: openWeatherData,
      waqi: waqiData,
      purpleair: purpleairData,
      airnow: airnowData
    }
  };

  // Add error if no data available
  if (combinedAQI < 0) {
    result.error = 'No air quality data available from any source';
  }

  return result;
}

/**
 * Get a descriptive message about data sources
 */
export function getDataSourceMessage(sources: CombinedAQIData['sources']): string {
  const activeSources = [];
  if (sources.google) activeSources.push('Google');
  if (sources.openweather) activeSources.push('OpenWeather');
  if (sources.waqi) activeSources.push('WAQI');
  if (sources.purpleair) activeSources.push('PurpleAir');
  if (sources.airnow) activeSources.push('AirNow');
  
  if (activeSources.length === 0) return 'No data available';
  if (activeSources.length === 1) return `Data from ${activeSources[0]}`;
  if (activeSources.length === 2) return `Combined: ${activeSources.join(' + ')}`;
  if (activeSources.length === 3) return `Triple-source: ${activeSources.join(' + ')}`;
  if (activeSources.length === 4) return `Quad-source: ${activeSources.join(' + ')}`;
  return `Penta-source: ${activeSources.join(' + ')}`;
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