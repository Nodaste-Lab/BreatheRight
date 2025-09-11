/**
 * OpenAI Summary Generation Service
 * 
 * Generates personalized location summaries based on:
 * - AQI levels and pollutant data
 * - Pollen counts and allergen information  
 * - Lightning/storm probability
 * - Weather conditions and visibility
 * 
 * Uses Supabase for shared caching across all users
 */

import type { LocationData } from '../../types/location';
import { supabase } from '../supabase/client';

// Cache key structure for consistent lookups
interface SummaryCacheKey {
  locationId: string;
  weatherSource: string;
  aqiLevel: number;
  pollenLevel: number;
  lightningLevel: number;
  cacheDate: string; // YYYY-MM-DD format
}

interface CachedSummary {
  headline: string;
  description: string;
  cacheKey: SummaryCacheKey;
  generatedAt: string;
}

/**
 * Generate cache key for location summary
 * 
 * Rounds values to enable fuzzy matching:
 * - AQI: nearest 5 points (50, 55, 60, etc.)
 * - Pollen: nearest 2 points (2, 4, 6, etc.) 
 * - Lightning: nearest 10% (10%, 20%, 30%, etc.)
 * 
 * @param locationData - Location data to extract cache parameters from
 * @returns Cache key object for storage and lookup
 */
function generateCacheKey(locationData: LocationData): SummaryCacheKey {
  // Round values to create fuzzy matching (within ~5 points)
  const aqiLevel = Math.round(locationData.aqi.aqi / 5) * 5;
  const pollenLevel = locationData.pollen?.overall ? Math.round(locationData.pollen.overall / 2) * 2 : 0;
  const lightningLevel = locationData.lightning?.probability ? Math.round(locationData.lightning.probability / 10) * 10 : 0;
  
  return {
    locationId: locationData.location.id,
    weatherSource: locationData.weatherSource || 'microsoft',
    aqiLevel,
    pollenLevel, 
    lightningLevel,
    cacheDate: new Date().toISOString().split('T')[0], // Today's date
  };
}

/**
 * Create cache key string for Map storage
 */
function createCacheKeyString(cacheKey: SummaryCacheKey): string {
  return `${cacheKey.locationId}-${cacheKey.weatherSource}-${cacheKey.aqiLevel}-${cacheKey.pollenLevel}-${cacheKey.lightningLevel}-${cacheKey.cacheDate}`;
}

/**
 * Check if we have a cached summary for similar conditions in Supabase
 * 
 * Implementation:
 * 1. Try exact match first (same location, weather source, rounded conditions, date)
 * 2. If no exact match, perform fuzzy matching within 15 points total difference
 * 3. Updates access tracking for cache hit analytics
 * 
 * @param locationData - Location data to generate cache key from
 * @returns Cached summary if found, null otherwise
 */
async function getCachedSummary(locationData: LocationData): Promise<CachedSummary | null> {
  try {
    const cacheKey = generateCacheKey(locationData);
    const keyString = createCacheKeyString(cacheKey);
    
    // First try exact match
    const { data: exactMatch } = await supabase
      .from('ai_summaries')
      .select('headline, description, created_at')
      .eq('cache_key', keyString)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (exactMatch) {
      // Update access tracking (fire and forget - don't wait for this)
      supabase
        .from('ai_summaries')
        .update({ 
          last_accessed_at: new Date().toISOString()
        })
        .eq('cache_key', keyString)
        .then(() => {}, (err: any) => console.log('Cache tracking update failed:', err));
      
      return {
        headline: exactMatch.headline,
        description: exactMatch.description,
        cacheKey,
        generatedAt: exactMatch.created_at
      };
    }
    
    // If no exact match, try fuzzy matching (similar conditions)
    const { data: fuzzyMatches } = await supabase
      .from('ai_summaries')
      .select('headline, description, created_at, aqi_level, pollen_level, lightning_level')
      .eq('location_id', cacheKey.locationId)
      .eq('weather_source', cacheKey.weatherSource)
      .eq('cache_date', cacheKey.cacheDate)
      .gt('expires_at', new Date().toISOString())
      .limit(5);
    
    if (fuzzyMatches && fuzzyMatches.length > 0) {
      // Find the closest match based on environmental conditions
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
      
      // Only use fuzzy match if conditions are reasonably similar (within 15 points total difference)
      const totalDiff = Math.abs(bestMatch.aqi_level - cacheKey.aqiLevel) +
                       Math.abs(bestMatch.pollen_level - cacheKey.pollenLevel) +
                       Math.abs(bestMatch.lightning_level - cacheKey.lightningLevel);
      
      if (totalDiff <= 15) {
        return {
          headline: bestMatch.headline,
          description: bestMatch.description,
          cacheKey,
          generatedAt: bestMatch.created_at
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error checking cached summary:', error);
    return null;
  }
}

/**
 * Generate prompt for OpenAI based on location data
 */
function generatePrompt(locationData: LocationData): string {
  const { location, aqi, pollen, lightning, wildfire } = locationData;
  
  // Build context about current conditions
  const conditions = [];
  
  // AQI information
  conditions.push(`Air Quality Index: ${aqi.aqi} (${aqi.level})`);
  if (aqi.pollutants.pm25 > 0) conditions.push(`PM2.5: ${aqi.pollutants.pm25}`);
  if (aqi.pollutants.pm10 > 0) conditions.push(`PM10: ${aqi.pollutants.pm10}`);
  
  // Pollen information
  if (pollen) {
    conditions.push(`Pollen level: ${pollen.level} (${pollen.overall})`);
    if (pollen.tree > 0) conditions.push(`Tree pollen: ${pollen.tree}`);
    if (pollen.grass > 0) conditions.push(`Grass pollen: ${pollen.grass}`);
    if (pollen.weed > 0) conditions.push(`Weed pollen: ${pollen.weed}`);
  }
  
  // Lightning/storm information
  if (lightning) {
    conditions.push(`Storm probability: ${lightning.probability}% (${lightning.level} risk)`);
  }
  
  // Wildfire information (if available)
  if (wildfire) {
    conditions.push(`Smoke risk: ${wildfire.smokeRisk.level}`);
    if (wildfire.dustRisk.level !== 'Low') {
      conditions.push(`Dust risk: ${wildfire.dustRisk.level}`);
    }
  }
  
  return `Generate a friendly, personalized air quality summary for ${location.name}. 

Current conditions:
${conditions.join('\n')}

Please provide:
1. A silly and fun headline (2-4 words), that describes the current air quality or pollen levels or lightning risk or the overall conditions.
2. A brief description (under 200 characters) that's encouraging, actionable, and fun but also informative for those with allergies or asthma.

Focus on:
- How safe it is to go outside
- Any precautions needed
- Overall air quality assessment
- Keep it positive and helpful

Tone:
- Kawaii Voice: playful, youthful and sweet, designed to evoke feelings of innocence, charm, and adorableness (like emojis + character voice)
- Silly
- Fun
- Friendly
- Approachable
- Encouraging

Response format:
Headline: [Your headline]
Description: [Your description]

Do not include any unnecessary quotes

Examples:
Headline: Allergy Alert 🌸
Description: The air is clean, but pollen is tickling your lungs — you might feel itchy eyes or a sneezy chest

Headline: Sneezy Skies
Description: Breathing feels easy, but high allergens could make your lungs feel scratchy or tight.

Headline: Stormy Tingles ⚡
Description: A touch of storm activity mixed with pollen may leave your lungs feeling twitchy or wheezy.
`;
}

/**
 * Call OpenAI API to generate summary
 */
async function callOpenAI(prompt: string): Promise<{ headline: string; description: string }> {
  const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not found, using fallback summary');
    return {
      headline: "Air Quality Update",
      description: "Check current conditions and plan your outdoor activities accordingly."
    };
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
            content: 'You are an air quality expert who creates friendly, helpful summaries for people checking local environmental conditions. Keep responses concise and encouraging.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Parse the response
    const headlineMatch = content.match(/Headline:\s*(.+)/i);
    const descriptionMatch = content.match(/Description:\s*(.+)/i);
    
    return {
      headline: headlineMatch?.[1]?.trim() || "Air Quality Update",
      description: descriptionMatch?.[1]?.trim() || "Check current conditions for your area."
    };
    
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    // Fallback to static content on API error
    return {
      headline: "Air Quality Update", 
      description: "Current environmental conditions for your area."
    };
  }
}

/**
 * Generate or retrieve cached location summary
 * 
 * Uses smart caching with exact and fuzzy matching:
 * 1. Checks for exact cache match (same location, conditions, date)
 * 2. Falls back to fuzzy matching (similar conditions within 15 points)
 * 3. Generates new summary via OpenAI if no cache hit
 * 4. Stores result in Supabase for shared caching across users
 * 
 * @param locationData - Complete location data with AQI, pollen, lightning info
 * @returns Promise resolving to headline and description object
 */
export async function generateLocationSummary(locationData: LocationData): Promise<{ headline: string; description: string }> {
  // Check cache first
  const cached = await getCachedSummary(locationData);
  if (cached) {
    console.log('Using cached summary for location:', locationData.location.name);
    return {
      headline: cached.headline,
      description: cached.description
    };
  }

  console.log('Generating new summary for location:', locationData.location.name);
  
  // Generate new summary
  const prompt = generatePrompt(locationData);
  const summary = await callOpenAI(prompt);
  
  // Cache the result in Supabase
  const cacheKey = generateCacheKey(locationData);
  const keyString = createCacheKeyString(cacheKey);
  
  try {
    await supabase
      .from('ai_summaries')
      .insert({
        cache_key: keyString,
        location_id: cacheKey.locationId,
        headline: summary.headline,
        description: summary.description,
        weather_source: cacheKey.weatherSource,
        aqi_level: cacheKey.aqiLevel,
        pollen_level: cacheKey.pollenLevel,
        lightning_level: cacheKey.lightningLevel,
        cache_date: cacheKey.cacheDate
      });
    
    console.log('Cached summary for future use');
  } catch (error) {
    console.error('Error caching summary:', error);
    // Don't fail if caching fails - just log the error
  }
  
  return summary;
}

/**
 * Clear old cache entries from Supabase (call periodically)
 */
export async function clearOldCache(daysOld = 1): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const { data, error, count } = await supabase
      .from('ai_summaries')
      .delete()
      .lt('cache_date', cutoffDate.toISOString().split('T')[0])
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('Error clearing old cache:', error);
      return 0;
    }
    
    const cleared = count || 0;
    console.log(`Cleared ${cleared} old cache entries`);
    return cleared;
  } catch (error) {
    console.error('Error clearing old cache:', error);
    return 0;
  }
}

/**
 * Get cache statistics from Supabase
 */
export async function getCacheStats() {
  try {
    const { data: totalCount } = await supabase
      .from('ai_summaries')
      .select('id', { count: 'exact', head: true });
    
    const { data: recentEntries } = await supabase
      .from('ai_summaries')
      .select('location_id, cache_date, created_at, access_count')
      .order('created_at', { ascending: false })
      .limit(10);
    
    return {
      totalEntries: totalCount?.length || 0,
      recentEntries: recentEntries?.map(entry => ({
        location: entry.location_id,
        date: entry.cache_date,
        generated: entry.created_at,
        accessCount: entry.access_count
      })) || []
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      totalEntries: 0,
      recentEntries: []
    };
  }
}