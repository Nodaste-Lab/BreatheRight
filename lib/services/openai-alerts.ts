/**
 * OpenAI Alert Generation Service
 * 
 * Generates concise, personalized morning and evening air quality alerts.
 * Designed for push notifications with 178 character limit.
 * 
 * Features:
 * - Morning reports: Focus on the day ahead and outdoor planning
 * - Evening reports: Summarize the day and recommend next-day preparation
 * - Smart caching based on time of day and environmental conditions
 * - Fallback content for API failures
 */

import type { LocationData } from '../../types/location';
import { supabase } from '../supabase/client';

// Alert types for different times of day
export type AlertType = 'morning' | 'evening';

// Cache key structure for alert caching
interface AlertCacheKey {
  locationId: string;
  alertType: AlertType;
  weatherSource: string;
  aqiLevel: number;
  pollenLevel: number;
  lightningLevel: number;
  cacheDate: string; // YYYY-MM-DD format
}

interface CachedAlert {
  message: string;
  cacheKey: AlertCacheKey;
  generatedAt: string;
}

/**
 * Generate cache key for alert caching
 * Uses similar rounding to summary service but with alert type
 */
function generateAlertCacheKey(locationData: LocationData, alertType: AlertType): AlertCacheKey {
  // Round values for fuzzy matching
  const aqiLevel = Math.round(locationData.aqi.aqi / 5) * 5;
  const pollenLevel = locationData.pollen?.overall ? Math.round(locationData.pollen.overall / 2) * 2 : 0;
  const lightningLevel = locationData.lightning?.probability ? Math.round(locationData.lightning.probability / 10) * 10 : 0;
  
  return {
    locationId: locationData.location.id,
    alertType,
    weatherSource: locationData.weatherSource || 'microsoft',
    aqiLevel,
    pollenLevel,
    lightningLevel,
    cacheDate: new Date().toISOString().split('T')[0],
  };
}

/**
 * Create cache key string for Supabase storage
 */
function createAlertCacheKeyString(cacheKey: AlertCacheKey): string {
  return `${cacheKey.locationId}-${cacheKey.alertType}-${cacheKey.weatherSource}-${cacheKey.aqiLevel}-${cacheKey.pollenLevel}-${cacheKey.lightningLevel}-${cacheKey.cacheDate}`;
}

/**
 * Check for cached alert in Supabase
 */
async function getCachedAlert(locationData: LocationData, alertType: AlertType): Promise<CachedAlert | null> {
  try {
    const cacheKey = generateAlertCacheKey(locationData, alertType);
    const keyString = createAlertCacheKeyString(cacheKey);
    
    // Try exact match first
    const { data: exactMatch } = await supabase
      .from('ai_alerts')
      .select('message, created_at')
      .eq('cache_key', keyString)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (exactMatch) {
      // Update access tracking
      supabase
        .from('ai_alerts')
        .update({ 
          last_accessed_at: new Date().toISOString()
        })
        .eq('cache_key', keyString)
        .then(() => {}, (err: any) => console.log('Alert cache tracking update failed:', err));
      
      return {
        message: exactMatch.message,
        cacheKey,
        generatedAt: exactMatch.created_at
      };
    }
    
    // Try fuzzy matching for similar conditions
    const { data: fuzzyMatches } = await supabase
      .from('ai_alerts')
      .select('message, created_at, aqi_level, pollen_level, lightning_level')
      .eq('location_id', cacheKey.locationId)
      .eq('alert_type', cacheKey.alertType)
      .eq('weather_source', cacheKey.weatherSource)
      .eq('cache_date', cacheKey.cacheDate)
      .gt('expires_at', new Date().toISOString())
      .limit(3);
    
    if (fuzzyMatches && fuzzyMatches.length > 0) {
      // Find closest match
      const bestMatch = fuzzyMatches.reduce((closest, current) => {
        const currentDiff = Math.abs(current.aqi_level - cacheKey.aqiLevel) +
                           Math.abs(current.pollen_level - cacheKey.pollenLevel) +
                           Math.abs(current.lightning_level - cacheKey.lightningLevel);
        
        if (!closest) return current;
        
        const closestDiff = Math.abs(closest.aqi_level - cacheKey.aqiLevel) +
                           Math.abs(closest.pollen_level - cacheKey.pollenLevel) +
                           Math.abs(closest.lightning_level - cacheKey.lightningLevel);
        
        return currentDiff < closestDiff ? current : closest;
      });
      
      // Use fuzzy match if conditions are similar (within 10 points)
      const totalDiff = Math.abs(bestMatch.aqi_level - cacheKey.aqiLevel) +
                       Math.abs(bestMatch.pollen_level - cacheKey.pollenLevel) +
                       Math.abs(bestMatch.lightning_level - cacheKey.lightningLevel);
      
      if (totalDiff <= 10) {
        return {
          message: bestMatch.message,
          cacheKey,
          generatedAt: bestMatch.created_at
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error checking cached alert:', error);
    return null;
  }
}

/**
 * Generate prompt for OpenAI based on location data and alert type
 */
function generateAlertPrompt(locationData: LocationData, alertType: AlertType): string {
  const { location, aqi, pollen, lightning, wildfire } = locationData;
  
  // Build context about current conditions
  const conditions = [];
  conditions.push(`Air Quality: ${aqi.aqi} (${aqi.level})`);
  
  if (pollen) {
    conditions.push(`Pollen: ${pollen.level} (${pollen.overall})`);
  }
  
  if (lightning) {
    conditions.push(`Storm risk: ${lightning.probability}% (${lightning.level})`);
  }
  
  if (wildfire) {
    conditions.push(`Smoke: ${wildfire.smokeRisk.level}`);
  }

  const timeContext = alertType === 'morning' 
    ? 'starting your day' 
    : 'wrapping up your day';
    
  const focusArea = alertType === 'morning'
    ? 'outdoor planning and activities ahead'
    : 'reflection on today and preparation for tomorrow';

  return `Generate a concise ${alertType} air quality alert for ${location.name} for someone ${timeContext}.

Current conditions:
${conditions.join('\n')}

Requirements:
- Maximum 178 characters (for push notification)
- Focus on ${focusArea}
- Be actionable and helpful
- Use friendly, encouraging tone
- Include location name if space allows

${alertType === 'morning' ? 
  'Morning focus: Help plan outdoor activities, commute, exercise' :
  'Evening focus: Summarize the day, suggest tomorrow preparation'
}

Tone:
- Silly
- Fun
- Friendly
- Approachable
- Encouraging

Respond with just the alert message, no extra formatting.`;
}

/**
 * Call OpenAI API to generate alert
 */
async function callOpenAIForAlert(prompt: string, alertType: AlertType): Promise<string> {
  const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not found, using fallback alert');
    return alertType === 'morning' 
      ? "Good morning! Check today's air quality before heading out. Stay informed, stay healthy! 🌅"
      : "Evening air quality update: Review today's conditions and plan for tomorrow. Sweet dreams! 🌙";
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an air quality expert creating brief, helpful push notification alerts. Keep responses under 178 characters and focus on actionable advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 60,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim() || '';
    
    // Ensure message is under 178 characters
    if (content.length > 178) {
      return content.substring(0, 175) + '...';
    }
    
    return content || (alertType === 'morning' 
      ? "Good morning! Check air quality before outdoor activities today. 🌅"
      : "Evening update: Air quality stable. Plan ahead for tomorrow! 🌙");
    
  } catch (error) {
    console.error('Error calling OpenAI API for alert:', error);
    // Fallback messages
    return alertType === 'morning' 
      ? "Morning air quality check: Review conditions before outdoor activities. Have a great day! ☀️"
      : "Evening air quality summary: Today's conditions logged. Rest well and plan for tomorrow! 🌙";
  }
}

/**
 * Generate or retrieve cached alert message
 */
export async function generateAlert(locationData: LocationData, alertType: AlertType): Promise<string> {
  // Check cache first
  const cached = await getCachedAlert(locationData, alertType);
  if (cached) {
    console.log(`Using cached ${alertType} alert for location:`, locationData.location.name);
    return cached.message;
  }

  console.log(`Generating new ${alertType} alert for location:`, locationData.location.name);
  
  // Generate new alert
  const prompt = generateAlertPrompt(locationData, alertType);
  const message = await callOpenAIForAlert(prompt, alertType);
  
  // Cache the result
  const cacheKey = generateAlertCacheKey(locationData, alertType);
  const keyString = createAlertCacheKeyString(cacheKey);
  
  try {
    await supabase
      .from('ai_alerts')
      .insert({
        cache_key: keyString,
        location_id: cacheKey.locationId,
        alert_type: cacheKey.alertType,
        message: message,
        weather_source: cacheKey.weatherSource,
        aqi_level: cacheKey.aqiLevel,
        pollen_level: cacheKey.pollenLevel,
        lightning_level: cacheKey.lightningLevel,
        cache_date: cacheKey.cacheDate
      });
    
    console.log(`Cached ${alertType} alert for future use`);
  } catch (error) {
    console.error('Error caching alert:', error);
    // Don't fail if caching fails
  }
  
  return message;
}

/**
 * Generate morning report alert
 */
export async function generateMorningAlert(locationData: LocationData): Promise<string> {
  return generateAlert(locationData, 'morning');
}

/**
 * Generate evening report alert
 */
export async function generateEveningAlert(locationData: LocationData): Promise<string> {
  return generateAlert(locationData, 'evening');
}

/**
 * Clear old alert cache entries
 */
export async function clearOldAlertCache(daysOld = 2): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const { error, count } = await supabase
      .from('ai_alerts')
      .delete()
      .lt('cache_date', cutoffDate.toISOString().split('T')[0])
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('Error clearing old alert cache:', error);
      return 0;
    }
    
    const cleared = count || 0;
    console.log(`Cleared ${cleared} old alert cache entries`);
    return cleared;
  } catch (error) {
    console.error('Error clearing old alert cache:', error);
    return 0;
  }
}