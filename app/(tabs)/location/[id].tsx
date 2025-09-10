import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Modal, FlatList, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../../../store/location';
import { Card, CardFooter } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Accordion, AccordionItem } from '../../../components/ui/Accordion';
import { Dropdown } from '../../../components/ui/Dropdown';
import { HourlyChart } from '../../../components/ui/Chart';
import { colors, typography, spacing, getAQIColor, getAQILevel, radius, shadows } from '../../../lib/constants';
import { GradientBackground } from '../../../components/ui/GradientBackground';
import { getAQIColorByValue } from '../../../lib/colors/aqi-colors';
import type { LocationData, WildFireData } from '../../../types/location';
import { 
  getPollenColor,
  getPollenTextColor,
  getLightningColor,
  getLightningTextColor,
  UNAVAILABLE_COLOR 
} from '../../../lib/colors/environmental-colors';
import { generateLocationSummary } from '../../../lib/services/openai-summary';

/**
 * Location Details Screen
 * 
 * Key Features Added:
 * - Lightning accordion with storm probability and daily forecast
 * - Weather Effects section (AirNow users only) showing:
 *   - Wildfire & smoke risk with PM2.5 and visibility data
 *   - Dust risk with PM10 and visibility data  
 *   - 24-hour outlook with improvement/worsening status
 * - Unified weather service integration for multiple data sources
 * - Dynamic color coding for all environmental indicators
 * 
 * Weather Sources Supported:
 * - Microsoft Azure (comprehensive data)
 * - AirNow (EPA data + Weather Effects)
 * - Google, WAQI, PurpleAir (fallback providers)
 */
export default function LocationDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { locations } = useLocationStore();
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocationValue, setSelectedLocationValue] = useState<string>('');
  
  // AI-generated summary state
  const [aiSummary, setAiSummary] = useState<{ headline: string; description: string } | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const location = locations.find(loc => loc.id === id);

  // Convert locations to dropdown items
  const locationItems = locations.map(loc => ({
    label: loc.name,
    value: loc.id,
    sublabel: loc.address
  }));

  useEffect(() => {
    if (location) {
      setSelectedLocationValue(location.id);
    }
  }, [location]);

  // Display full address but truncate at 20 characters
  const getDisplayAddress = (address: string) => {
    if (!address) return '';
    return address.length > 25 ? address.substring(0, 25) + '...' : address;
  };

  // Get AQI color (with fallback for N/A values)
  const getAQIColorSafe = (value: number | null | undefined) => {
    if (!value || value < 0) return UNAVAILABLE_COLOR;
    return getAQIColorByValue(value);
  };

  // Get appropriate kawaii image based on score
  const getAQIImage = (score: number | null | undefined) => {
    if (!score || score < 0) return require('../../../assets/kawaii/aqi-good.png');
    if (score <= 100) return require('../../../assets/kawaii/aqi-good.png');
    if (score <= 200) return require('../../../assets/kawaii/aqi-moderate.png');
    return require('../../../assets/kawaii/aqi-unhealthy.png');
  };
  
  const getPollenImage = (level: string | undefined) => {
    if (!level) return require('../../../assets/kawaii/pollen-good.png');
    console.log('getPollenImage called with:', level, typeof level);
    const lowerLevel = level.toLowerCase();
    if (lowerLevel === 'low') return require('../../../assets/kawaii/pollen-good.png');
    if (lowerLevel === 'medium' || lowerLevel === 'moderate') return require('../../../assets/kawaii/pollen-moderate.png');
    if (lowerLevel === 'high') return require('../../../assets/kawaii/pollen-unhealthy.png');
    return require('../../../assets/kawaii/pollen-unhealthy.png');
  };

  const getLightningImage = (probability: number | null | undefined) => {
    if (!probability || probability < 0) return require('../../../assets/kawaii/storm-good.png');
    if (probability <= 100) return require('../../../assets/kawaii/storm-good.png');
    if (probability <= 200) return require('../../../assets/kawaii/storm-moderate.png');
    return require('../../../assets/kawaii/storm-unhealthy.png');
  };

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadLocationData(id);
    }
  }, [id]);

  const loadLocationData = async (locationId: string) => {
    try {
      // Get the location details
      const loc = locations.find(l => l.id === locationId);
      if (!loc) return;

      // Fetch data using unified weather service (respects user's selected source)
      const { 
        fetchUnifiedAQIData,
        fetchUnifiedBreathingData 
      } = await import('../../../lib/api/unified-weather');
      
      // Use unified weather service
      const { fetchUnifiedPollenData, fetchUnifiedStormData, getWeatherSource } = await import('../../../lib/api/unified-weather');
      
      /**
       * Mock wildfire data for Weather Effects section
       * TODO: Replace with actual AirNow wildfire API integration
       * Currently matches the UI design requirements from screenshot
       */
      const mockWildfire = (): WildFireData => ({
        smokeRisk: {
          level: 'Moderate' as const,
          pm25: 63,
          visibility: 16
        },
        dustRisk: {
          level: 'Low' as const,
          pm10: 41,
          visibility: 41  
        },
        fireActivity: {
          nearbyFires: 2,
          closestFireDistance: 15,
          largestFireSize: 500
        },
        outlook: {
          next24Hours: 'Improving' as const,
          confidence: 'Moderate' as const,
          details: 'Air quality expected to improve. PM2.5 levels should decrease.'
        },
        timestamp: new Date().toISOString()
      });
      
      const [aqiResult, breathingResult, pollenResult, lightningResult] = await Promise.allSettled([
        fetchUnifiedAQIData(loc.latitude, loc.longitude),
        fetchUnifiedBreathingData(loc.latitude, loc.longitude),
        fetchUnifiedPollenData(loc.latitude, loc.longitude),
        fetchUnifiedStormData(loc.latitude, loc.longitude),
      ]);

      const aqi = aqiResult.status === 'fulfilled' ? aqiResult.value : {
        aqi: -1,
        level: 'Unknown' as const,
        pollutants: { pm25: -1, pm10: -1, o3: -1, no2: -1, so2: -1, co: -1 },
        timestamp: new Date().toISOString(),
        error: 'Failed to fetch air quality data'
      };

      // Process breathing data (includes Microsoft data when that source is selected)
      const microsoft = breathingResult.status === 'fulfilled' && breathingResult.value.source === 'microsoft' ? {
        currentAirQuality: breathingResult.value.currentAirQuality || undefined,
        airQualityForecast: breathingResult.value.airQualityForecast || undefined,
        severeAlerts: breathingResult.value.severeAlerts && breathingResult.value.severeAlerts.alerts ? {
          alerts: breathingResult.value.severeAlerts.alerts.map(alert => ({
            id: alert.alertId,
            category: alert.category,
            priority: alert.priority,
            description: alert.description?.english || alert.description?.localized || 'Alert',
            severity: alert.alertAreas?.[0]?.severity || 'Unknown',
            startTime: alert.validFromUtc,
            endTime: alert.validUntilUtc,
            area: alert.alertAreas?.[0]?.name || 'Unknown',
            source: alert.source,
          })),
          timestamp: breathingResult.value.severeAlerts.timestamp,
        } : undefined,
        dailyIndices: breathingResult.value.dailyIndices && breathingResult.value.dailyIndices.indices ? {
          indices: breathingResult.value.dailyIndices.indices.flatMap(dailyResult =>
            dailyResult.indices && Array.isArray(dailyResult.indices) ? dailyResult.indices.map(index => ({
              name: index.name,
              value: index.value,
              category: index.category,
              description: index.description,
              date: dailyResult.dateTime,
            })) : []
          ),
          timestamp: breathingResult.value.dailyIndices.timestamp,
        } : undefined,
        pollenForecast: breathingResult.value.dailyForecast && breathingResult.value.dailyForecast.forecasts ? {
          forecasts: breathingResult.value.dailyForecast.forecasts.map(forecast => ({
            date: forecast.date,
            pollen: {
              grass: forecast.airAndPollen?.find(item => item.name === 'Grass') || { value: 0, category: 'Low' },
              tree: forecast.airAndPollen?.find(item => item.name === 'Tree') || { value: 0, category: 'Low' },
              weed: forecast.airAndPollen?.find(item => item.name === 'Weed') || { value: 0, category: 'Low' },
              mold: forecast.airAndPollen?.find(item => item.name === 'Mold') || { value: 0, category: 'Low' },
            },
            uvIndex: forecast.airAndPollen?.find(item => item.name === 'UVIndex') || { value: 0, category: 'Low' },
          })),
          timestamp: breathingResult.value.timestamp,
        } : undefined,
      } : undefined;

      // Process unified pollen data
      const pollen = pollenResult.status === 'fulfilled' ? pollenResult.value : {
        overall: -1,
        tree: -1,
        grass: -1,
        weed: -1,
        level: 'Unknown' as const,
        timestamp: new Date().toISOString(),
        error: pollenResult.status === 'rejected' ? pollenResult.reason?.message || 'Failed to fetch pollen data' : undefined
      };

      // Process lightning data
      const lightning = lightningResult.status === 'fulfilled' ? lightningResult.value : {
        probability: -1,
        level: 'Unknown' as const,
        timestamp: new Date().toISOString(),
        error: lightningResult.status === 'rejected' ? lightningResult.reason?.message || 'Failed to fetch lightning data' : undefined
      };

      // Add wildfire data (mock data matching screenshot)
      const wildfire = mockWildfire();
      
      // Check if user has AirNow selected
      const currentWeatherSource = getWeatherSource();

      const newLocationData = {
        location: loc,
        aqi,
        pollen,
        lightning,
        wildfire,
        weatherSource: currentWeatherSource,
        microsoft,
      };
      
      setLocationData(newLocationData);
      
      // Generate AI summary for the location
      setIsLoadingSummary(true);
      try {
        const summary = await generateLocationSummary(newLocationData);
        setAiSummary(summary);
      } catch (summaryError) {
        console.error('Error generating AI summary:', summaryError);
        // Fallback to static content
        setAiSummary({
          headline: "Air Quality Update",
          description: "Check current conditions for your area."
        });
      } finally {
        setIsLoadingSummary(false);
      }
    } catch (error) {
      console.error('Error loading location data:', error);
    }
  };


  if (!location || !locationData) {
    return (
      <GradientBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
          <Stack.Screen 
          options={{
            headerShown: false,
          }}
        />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading location data...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  // Use Microsoft forecast data only
  const forecast = locationData.microsoft?.airQualityForecast || [];

  // Get current AQI and status
  const currentAQI = locationData.aqi?.aqi || 85;
  const currentLevel = getAQILevel(currentAQI);
  
  // Generate hourly data for chart (24 hours)
  const currentHour = new Date().getHours();
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = (currentHour + i) % 24;
    let aqi;
    
    // Create realistic pattern with min around 25 and max around 67
    if (i === 0) {
      aqi = 40; // Current hour
    } else if (hour >= 0 && hour < 6) {
      aqi = 25 + Math.random() * 10; // Night: 25-35
    } else if (hour >= 6 && hour < 10) {
      aqi = 35 + Math.random() * 15; // Morning: 35-50
    } else if (hour >= 10 && hour < 14) {
      aqi = 55 + Math.random() * 12; // Midday peak: 55-67
    } else if (hour >= 14 && hour < 18) {
      aqi = 45 + Math.random() * 15; // Afternoon: 45-60
    } else {
      aqi = 30 + Math.random() * 15; // Evening: 30-45
    }
    
    return {
      hour,
      aqi: Math.round(aqi)
    };
  });

  // Create daily forecast (5 days)
  const dailyForecast = Array.from({ length: 5 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    const dayNames = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue'];
    const dailyAqi = [78, 40, 62, 80, 68][i];
    
    return {
      day: dayNames[i],
      aqi: dailyAqi
    };
  });

  // Find the maximum AQI for the next 24 hours
  const maxAQI = Math.max(...hourlyData.map(h => h.aqi));
  const maxAQILevel = getAQILevel(maxAQI);
  
  // Determine if we should show a warning
  const hasAlert = maxAQI > 100;

  // Format alert time
  const formatAlertTime = (hour: number) => {
    if (hour === 0) return '12 am';
    if (hour === 12) return '12 pm';
    return hour < 12 ? `${hour} am` : `${hour - 12} pm`;
  };

  // Handle location selection from dropdown
  const handleLocationSelect = (value: string | number) => {
    const locationId = value.toString();
    if (locationId !== location?.id) {
      router.replace(`/location/${locationId}`);
    }
  };
  
  // Get character description based on conditions
  const getCharacterDescription = () => {
    if (currentAQI > 100) {
      return "A touch of storm activity mixed with pollen may leave your lungs feeling twitchy or wheezy";
    }
    return "Air quality looks good today! Perfect conditions for outdoor activities.";
  };

  const getCharacterTitle = () => {
    if (currentAQI > 100) return "Stormy Tingles";
    if (currentAQI > 50) return "Slightly Breezy";
    return "Fresh & Clear";
  };

  return (
    <GradientBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Dropdown */}
        <View style={styles.header}>
          <Dropdown
            items={locationItems}
            selectedValue={selectedLocationValue}
            onSelect={handleLocationSelect}
            leftIcon={<Ionicons name="navigate" size={24} color={colors.text.primary} />}
            style={styles.locationDropdown}
          />
        </View>

        {/* Summary Card with Kawaii Character */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <Image 
              source={require('../../../assets/kawaii/lungs-good.png')} 
              style={styles.kawaiiImage} 
            />
            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle}>
                {isLoadingSummary ? "Generating..." : (aiSummary?.headline || getCharacterTitle())}
              </Text>
              <Text style={styles.summaryDescription}>
                {isLoadingSummary ? "Creating personalized summary..." : (aiSummary?.description || getCharacterDescription())}
              </Text>
            </View>
          </View>
          
          <CardFooter>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="create-outline" size={20} color={colors.text.primary} />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            <View style={styles.lastUpdateContainer}>
              <Ionicons name="time-outline" size={20} color={colors.text.primary} />
              <Text style={styles.lastUpdateText}>Last update Just now</Text>
            </View>
          </CardFooter>
        </Card>

        {/* AQI Accordion */}
        <Accordion style={styles.accordionContainer}>
          <AccordionItem
            title="Air Quality Index"
            leftIcon={
              <View style={[styles.aqiIconContainer, { backgroundColor: getAQIColor(currentAQI) }]}>
                <Image source={getAQIImage(currentAQI)} style={styles.aqiKawaiiIcon} />
              </View>
            }
            rightContent={
              <Badge variant="aqi" level={currentAQI <= 50 ? 'good' : currentAQI <= 100 ? 'moderate' : 'unhealthy'}>
                <Text style={styles.badgeValue}>{currentAQI}</Text>
                <Text style={styles.badgeLevel}> {currentLevel}</Text>
              </Badge>
            }
          >
            {/* Alert Section */}
            {hasAlert ? (
              <View style={styles.alertSection}>
                <Text style={styles.alertTitle}>Heads up!</Text>
                <View style={styles.alertContent}>
                  <Text style={styles.alertText}>
                    The AQI is expected to reach
                  </Text>
                  <Badge 
                    style={styles.comfortBadge}
                    variant="aqi" 
                    level={maxAQI <= 50 ? 'good' : maxAQI <= 100 ? 'moderate' : 'unhealthy'}
                  >
                    <Text style={styles.badgeValue}>{maxAQI}</Text>
                    <Text style={styles.badgeLevel}> {maxAQILevel}</Text>
                  </Badge>
                  <Text style={styles.alertText}>
                    in the next 24 hours
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.alertSection}>
                <Text style={styles.alertTitle}>All good!</Text>
                <View style={styles.alertContent}>
                  <Text style={styles.alertText}>
                    AQI is expected to stay below
                  </Text>
                  <Badge 
                    style={styles.comfortBadge}
                    variant="aqi" 
                    level={maxAQI <= 50 ? 'good' : maxAQI <= 100 ? 'moderate' : 'unhealthy'}
                  >
                    <Text style={styles.badgeValue}>{maxAQI}</Text>
                    <Text style={styles.badgeLevel}> {maxAQILevel}</Text>
                  </Badge>
                  <Text style={styles.alertText}>for the next 24 hours</Text>
                </View>
              </View>
            )}

            {/* Hourly Chart */}
            <View style={styles.chartContainer}>
              <HourlyChart hourlyData={hourlyData} style={styles.hourlyChart} />
              
              {/* Min/Max indicators */}
              <View style={styles.minMaxContainer}>
                <View style={styles.minMaxItem}>
                  <Text style={styles.minMaxLabel}>Min</Text>
                  <Badge variant="aqi" level="good" size="sm">
                    <Text style={styles.minMaxValue}>{Math.min(...hourlyData.map(h => h.aqi))}</Text>
                  </Badge>
                </View>
                <View style={styles.minMaxItem}>
                  <Text style={styles.minMaxLabel}>Max</Text>
                  <Badge variant="aqi" level="moderate" size="sm">
                    <Text style={styles.minMaxValue}>{Math.max(...hourlyData.map(h => h.aqi))}</Text>
                  </Badge>
                </View>
              </View>
              
              {/* Forecast Section */}
              <View style={styles.forecastSection}>
                <View style={styles.forecastHeader}>
                  <Text style={styles.forecastTitle}>Forecast</Text>
                  <Text style={styles.forecastSubtitle}>Daily Average</Text>
                </View>
                
                <View style={styles.dailyForecastContainer}>
                  {dailyForecast.map((day, index) => (
                    <View key={index} style={styles.forecastDayItem}>
                      <Text style={styles.forecastDayLabel}>{day.day}</Text>
                      <Badge 
                        variant="aqi" 
                        level={day.aqi <= 50 ? 'good' : day.aqi <= 100 ? 'moderate' : 'unhealthy'}
                        size="lg"
                      >
                        <Text style={styles.forecastDayValue}>{day.aqi}</Text>
                      </Badge>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </AccordionItem>
          
          {/* Allergen Accordion */}
          {locationData && (
          <AccordionItem
            title="Allergen"
            leftIcon={
              <View style={[
                styles.aqiIconContainer, 
                { backgroundColor: getPollenColor(locationData.pollen?.overall || 3) }
              ]}>
                <Image 
                  source={getPollenImage(locationData.pollen?.level || 'Low')} 
                  style={styles.aqiKawaiiIcon} 
                />
              </View>
            }
            rightContent={
              <Badge 
                variant="pollen" 
                pollenLevel={(() => {
                  const overallValue = locationData.pollen?.overall || 3;
                  console.log('Unified pollen overall value:', overallValue);
                  
                  // Map unified pollen scale to badge levels (same as home screen logic)
                  if (overallValue <= 3) return 'low';
                  if (overallValue <= 6) return 'medium';
                  return 'high';
                })() as 'low' | 'medium' | 'high' | 'veryHigh'}
              >
                <Text style={styles.badgeValue}>
                  {locationData.pollen && locationData.pollen.overall >= 0 ? `${locationData.pollen.overall * 10}` : 'N/A'}
                </Text>
                <Text style={styles.badgeLevel}> 
                  {locationData.pollen?.level || 'Unknown'}
                </Text>
              </Badge>
            }
          >
            <View style={styles.allergenContent}>
              <Text style={styles.allergenDescription}>
                Current pollen level: {locationData.pollen?.level || 'Unknown'}
              </Text>
              {/* <Text style={styles.allergenAdvice}>
                Based on your health concerns, consider limiting outdoor activities during high pollen periods.
              </Text> */}
              
              {/* Raw Pollen Data Grid - Using both unified and Microsoft data */}
              <View style={styles.pollenGrid}>
                {/* Unified Pollen Data */}
                {locationData.pollen && (
                  <>
                    <View style={styles.pollenItem}>
                      <Text style={styles.pollenType}>Grass</Text>
                      <Badge variant="pollen" 
                        pollenLevel={locationData.pollen.grass <= 3 ? 'low' : locationData.pollen.grass <= 6 ? 'medium' : 'high'} 
                        size="sm">
                        <Text style={styles.pollenValue}>
                          {locationData.pollen.grass >= 0 ? `${locationData.pollen.grass * 10}` : 'N/A'}
                        </Text>
                      </Badge>
                    </View>
                    <View style={styles.pollenItem}>
                      <Text style={styles.pollenType}>Tree</Text>
                      <Badge variant="pollen" 
                        pollenLevel={locationData.pollen.tree <= 3 ? 'low' : locationData.pollen.tree <= 6 ? 'medium' : 'high'} 
                        size="sm">
                        <Text style={styles.pollenValue}>
                          {locationData.pollen.tree >= 0 ? `${locationData.pollen.tree * 10}` : 'N/A'}
                        </Text>
                      </Badge>
                    </View>
                    <View style={styles.pollenItem}>
                      <Text style={styles.pollenType}>Weed</Text>
                      <Badge variant="pollen" 
                        pollenLevel={locationData.pollen.weed <= 3 ? 'low' : locationData.pollen.weed <= 6 ? 'medium' : 'high'} 
                        size="sm">
                        <Text style={styles.pollenValue}>
                          {locationData.pollen.weed >= 0 ? `${locationData.pollen.weed * 10}` : 'N/A'}
                        </Text>
                      </Badge>
                    </View>
                    <View style={styles.pollenItem}>
                      <Text style={styles.pollenType}>Overall</Text>
                      <Badge variant="pollen" 
                        pollenLevel={locationData.pollen.overall <= 3 ? 'low' : locationData.pollen.overall <= 6 ? 'medium' : 'high'} 
                        size="sm">
                        <Text style={styles.pollenValue}>
                          {locationData.pollen.overall >= 0 ? `${locationData.pollen.overall * 10}` : 'N/A'}
                        </Text>
                      </Badge>
                    </View>
                  </>
                )}

                {/* Microsoft Raw Values (if available) */}
                {locationData.microsoft?.pollenForecast?.forecasts?.[0] && (
                  <>
                    <View style={styles.pollenItem}>
                      <Text style={styles.pollenType}>MS Grass</Text>
                      <Badge variant="pollen" 
                        pollenLevel={(() => {
                          const category = locationData.microsoft.pollenForecast.forecasts[0].pollen.grass.category?.toLowerCase();
                          if (category === 'low') return 'low';
                          if (category === 'medium' || category === 'moderate') return 'medium';
                          if (category === 'high') return 'high';
                          return 'low';
                        })()}
                        size="sm">
                        <Text style={styles.pollenValue}>
                          {locationData.microsoft.pollenForecast.forecasts[0].pollen.grass.value}
                        </Text>
                      </Badge>
                    </View>
                    <View style={styles.pollenItem}>
                      <Text style={styles.pollenType}>MS Tree</Text>
                      <Badge variant="pollen" 
                        pollenLevel={(() => {
                          const category = locationData.microsoft.pollenForecast.forecasts[0].pollen.tree.category?.toLowerCase();
                          if (category === 'low') return 'low';
                          if (category === 'medium' || category === 'moderate') return 'medium';
                          if (category === 'high') return 'high';
                          return 'low';
                        })()}
                        size="sm">
                        <Text style={styles.pollenValue}>
                          {locationData.microsoft.pollenForecast.forecasts[0].pollen.tree.value}
                        </Text>
                      </Badge>
                    </View>
                  </>
                )}
              </View>
            </View>
          </AccordionItem>
          )}

          {/* Lightning Accordion */}
          {locationData && (
          <AccordionItem
            title="Lightning"
            leftIcon={
              <View style={[
                styles.aqiIconContainer, 
                { backgroundColor: getLightningColor(locationData.lightning?.probability || 0) }
              ]}>
                <Image 
                  source={getLightningImage(locationData.lightning?.probability || 0)} 
                  style={styles.aqiKawaiiIcon} 
                />
              </View>
            }
            rightContent={
              <Badge 
                variant="lightning" 
                lightningLevel={(() => {
                  const probability = locationData.lightning?.probability || 0;
                  if (probability <= 30) return 'none';
                  if (probability <= 60) return 'low';
                  if (probability <= 80) return 'medium';
                  return 'high';
                })() as 'none' | 'low' | 'medium' | 'high'}
              >
                <Text style={styles.badgeValue}>
                  {locationData.lightning && locationData.lightning.probability >= 0 ? `${locationData.lightning.probability}%` : 'N/A'}
                </Text>
                <Text style={styles.badgeLevel}> 
                  {locationData.lightning?.level || 'Unknown'}
                </Text>
              </Badge>
            }
          >
            <View style={styles.allergenContent}>
              <Text style={styles.allergenDescription}>
                Current storm probability: {locationData.lightning && locationData.lightning.probability >= 0 ? `${locationData.lightning.probability}%` : 'Unknown'}
              </Text>
              
              {/* Daily Lightning Forecast */}
              <Text style={styles.pollenType}>Daily Storm Forecast</Text>
              <View style={styles.pollenGrid}>
                <View style={styles.pollenItem}>
                  <Text style={styles.pollenType}>Today</Text>
                  <Badge variant="lightning" 
                    lightningLevel={(() => {
                      const probability = locationData.lightning?.probability || 0;
                      if (probability <= 30) return 'none';
                      if (probability <= 60) return 'low';
                      if (probability <= 80) return 'medium';
                      return 'high';
                    })()} 
                    size="sm">
                    <Text style={styles.pollenValue}>
                      {locationData.lightning && locationData.lightning.probability >= 0 ? `${locationData.lightning.probability}%` : 'N/A'}
                    </Text>
                  </Badge>
                </View>
                <View style={styles.pollenItem}>
                  <Text style={styles.pollenType}>Tomorrow</Text>
                  <Badge variant="lightning" lightningLevel="low" size="sm">
                    <Text style={styles.pollenValue}>25%</Text>
                  </Badge>
                </View>
                <View style={styles.pollenItem}>
                  <Text style={styles.pollenType}>Day 3</Text>
                  <Badge variant="lightning" lightningLevel="none" size="sm">
                    <Text style={styles.pollenValue}>15%</Text>
                  </Badge>
                </View>
                <View style={styles.pollenItem}>
                  <Text style={styles.pollenType}>Day 4</Text>
                  <Badge variant="lightning" lightningLevel="medium" size="sm">
                    <Text style={styles.pollenValue}>65%</Text>
                  </Badge>
                </View>
              </View>

              {/* Weather Effects Section - AirNow Exclusive Feature */}
              {/* Displays wildfire smoke & dust data when AirNow is selected as weather source */}
              {locationData.weatherSource === 'airnow' && locationData.wildfire && (
                <>
                  <Text style={[styles.pollenType, { marginTop: spacing.md }]}>Weather Effects</Text>
                  
                  {/* Wildfire & Smoke */}
                  <View style={styles.weatherEffectItem}>
                    <View style={styles.weatherEffectHeader}>
                      <View style={[styles.weatherEffectIcon, { backgroundColor: '#FFE4CE' }]}>
                        <Text style={{ fontSize: 24 }}>🔥</Text>
                      </View>
                      <View style={styles.weatherEffectContent}>
                        <Text style={styles.weatherEffectTitle}>
                          {locationData.wildfire.smokeRisk.level} Smoke Risk
                        </Text>
                        <Text style={styles.weatherEffectDetails}>
                          PM2.5: {locationData.wildfire.smokeRisk.pm25} μg/m³
                        </Text>
                        <Text style={styles.weatherEffectDetails}>
                          Visibility: {locationData.wildfire.smokeRisk.visibility} miles
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Dust Risk */}
                  <View style={styles.weatherEffectItem}>
                    <View style={styles.weatherEffectHeader}>
                      <View style={[styles.weatherEffectIcon, { backgroundColor: '#C5B4DF' }]}>
                        <Text style={{ fontSize: 24 }}>🌪️</Text>
                      </View>
                      <View style={styles.weatherEffectContent}>
                        <Text style={styles.weatherEffectTitle}>
                          {locationData.wildfire.dustRisk.level} Dust Risk
                        </Text>
                        <Text style={styles.weatherEffectDetails}>
                          PM10: {locationData.wildfire.dustRisk.pm10} μg/m³
                        </Text>
                        <Text style={styles.weatherEffectDetails}>
                          Visibility: {locationData.wildfire.dustRisk.visibility} miles
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* 24-Hour Outlook */}
                  <View style={[styles.weatherEffectItem, { marginTop: spacing.md }]}>
                    <Text style={styles.weatherEffectSectionTitle}>24-HOUR OUTLOOK</Text>
                    <View style={styles.outlookContainer}>
                      <Text style={[styles.outlookStatus, { 
                        color: locationData.wildfire.outlook.next24Hours === 'Improving' ? '#10B981' : 
                               locationData.wildfire.outlook.next24Hours === 'Worsening' ? '#EF4444' : '#F59E0B'
                      }]}>
                        {locationData.wildfire.outlook.next24Hours}
                      </Text>
                      <Text style={styles.outlookConfidence}>
                        {locationData.wildfire.outlook.confidence} Confidence
                      </Text>
                    </View>
                    <Text style={styles.outlookDetails}>
                      {locationData.wildfire.outlook.details}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </AccordionItem>
          )}
        </Accordion>

        {/* Remove old Allergen Section - if it exists */}
        {locationData.microsoft?.pollenForecast?.forecasts?.[0] && (
          <Card style={styles.allergenCard}>
            <View style={styles.allergenHeader}>
              <View style={styles.allergenInfo}>
                <Image 
                  source={require('../../../assets/kawaii/pollen-moderate.png')} 
                  style={styles.allergenIcon} 
                />
                <View>
                  <Text style={styles.allergenTitle}>Pollen</Text>
                  <View style={styles.allergenValueContainer}>
                    <Text style={styles.allergenValue}>
                      {locationData.microsoft.pollenForecast.forecasts[0].pollen.grass.value}
                    </Text>
                    <Text style={styles.allergenLevel}>
                      {locationData.microsoft.pollenForecast.forecasts[0].pollen.grass.category}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.text.secondary} />
                  </View>
                </View>
              </View>
              <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
            </View>
          </Card>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={locations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.locationItem,
                    item.id === location.id && styles.selectedLocationItem
                  ]}
                  onPress={() => {
                    router.replace(`/location/${item.id}`);
                    setShowLocationPicker(false);
                  }}
                >
                  <View style={styles.locationItemContent}>
                    <Ionicons 
                      name={item.show_in_home ? "star" : "location-outline"} 
                      size={20} 
                      color={item.id === location.id ? "#491124" : "#6b7280"} 
                    />
                    <View style={styles.locationItemText}>
                      <Text style={[
                        styles.locationItemName,
                        item.id === location.id && styles.selectedLocationItemName
                      ]}>
                        {item.name}
                      </Text>
                      <Text style={styles.locationItemAddress}>
                        {item.address}
                      </Text>
                    </View>
                    {item.id === location.id && (
                      <Ionicons name="checkmark" size={20} color="#491124" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: 12,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  locationDropdown: {
    backgroundColor: colors.neutral.white,
    borderRadius: radius.full,
    ...shadows.sm,
  },
  locationSelector: {
    flexDirection: 'row',
    // alignItems: 'center',
    // justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  locationText: {
    marginLeft: 8,
    flex: 1,
  },
  locationName: {
    ...typography.h2,
    color: colors.primary,
  },
  locationAddress: {
    ...typography.label,
    color: colors.primary,
    textAlign: 'right',
  },
  // Summary Card Styles
  summaryCard: {
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginBottom: spacing.base,
  },
  kawaiiImage: {
    width: 122,
    height: 122,
    resizeMode: 'contain' as const,
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  summaryDescription: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editText: {
    ...typography.label,
    color: colors.text.primary,
    textDecorationLine: 'underline',
  },
  lastUpdateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  lastUpdateText: {
    ...typography.label,
    color: colors.text.primary,
    textDecorationLine: 'underline',
  },
  // Old styles - removed since we're using new components
  // Accordion Styles
  accordionContainer: {
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
  },
  aqiIconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  aqiKawaiiIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain' as const,
  },
  badgeValue: {
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    fontFamily: typography.badge.fontFamily,
    color: colors.contrastText.primary,
    lineHeight: 32,
  },
  badgeLevel: {
    fontSize: typography.badgeLabel.fontSize,
    fontWeight: typography.badgeLabel.fontWeight,
    fontFamily: typography.badgeLabel.fontFamily,
    color: colors.contrastText.primary,
    lineHeight: typography.badgeLabel.fontSize,
    marginLeft: 2,
  },
  alertSection: {
    marginBottom: spacing.lg,
  },
  alertTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  alertContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  alertText: {
    ...typography.body,
    color: colors.text.primary,
  },
  alertTime: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  comfortBadge: {
    marginHorizontal: spacing.xs,
  },
  chartContainer: {
    backgroundColor: colors.neutral.whiteAlpha20,
    borderRadius: radius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  hourlyChart: {
    marginBottom: -10,
  },
  minMaxContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  minMaxItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  minMaxLabel: {
    ...typography.body,
    color: colors.text.primary,
  },
  minMaxValue: {
    ...typography.caption,
    color: colors.contrastText.primary,
    fontWeight: '600',
  },
  // Old AQI styles - removed since we're using accordion component
  // Forecast Styles
  forecastSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.whiteAlpha20,
  },
  forecastHeader: {
    marginBottom: spacing.md,
  },
  forecastTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  forecastSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  dailyForecastContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.md,
  },
  forecastDayItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  forecastDayLabel: {
    ...typography.labelBold,
    color: colors.text.primary,
  },
  forecastDayValue: {
    ...typography.chartValue,
    color: colors.contrastText.primary,
  },
  // Old forecast styles - removed since we're using new card components
  // Old allergen styles - removed since not used in new design
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray300,
  },
  // Modal styles - updated to use new typography
  modalTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  locationItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray300,
  },
  selectedLocationItem: {
    backgroundColor: colors.ui.activeBackground,
  },
  locationItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationItemText: {
    flex: 1,
    marginLeft: 12,
  },
  locationItemName: {
    ...typography.bodyBold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  selectedLocationItemName: {
    color: colors.primary,
  },
  locationItemAddress: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  // Allergen styles
  allergenCard: {
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
  },
  allergenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
  },
  allergenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  allergenIcon: {
    width: 48,
    height: 48,
    resizeMode: 'contain' as const,
  },
  allergenTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  allergenValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  allergenValue: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  allergenLevel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  // Allergen accordion content styles
  allergenContent: {
    paddingVertical: spacing.sm,
  },
  allergenDescription: {
    ...typography.body,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  allergenAdvice: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  pollenGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  pollenItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  pollenType: {
    ...typography.labelBold,
    color: colors.text.primary,
  },
  pollenValue: {
    ...typography.caption,
    color: colors.contrastText.primary,
    fontWeight: '600',
  },
  
  // Weather Effects styles
  weatherEffectItem: {
    marginBottom: spacing.md,
  },
  weatherEffectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  weatherEffectIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherEffectContent: {
    flex: 1,
  },
  weatherEffectTitle: {
    ...typography.labelBold,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  weatherEffectDetails: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  weatherEffectSectionTitle: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  outlookContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  outlookStatus: {
    ...typography.labelBold,
    fontSize: 14,
    fontWeight: '600',
  },
  outlookConfidence: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  outlookDetails: {
    ...typography.caption,
    color: colors.text.primary,
    lineHeight: 18,
  },
});