import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Modal, FlatList, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../../../store/location';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Accordion, AccordionItem } from '../../../components/ui/Accordion';
import { Dropdown } from '../../../components/ui/Dropdown';
import { HourlyChart } from '../../../components/ui/Chart';
import { colors, typography, spacing, getAQIColor, getAQILevel, radius, borders, shadows } from '../../../lib/constants';
import { fonts } from '../../../lib/fonts';
import { GradientBackground } from '../../../components/ui/GradientBackground';
import { AQIHistogram } from '../../../components/forecast/AQIHistogram';
import { getAQIColorByValue } from '../../../lib/colors/aqi-colors';
import type { LocationData } from '../../../types/location';
import { 
  getPollenColor, 
  getPollenTextColor,
  getLightningColor, 
  getLightningTextColor,
  getWildfireColor,
  getWildfireTextColor,
  UNAVAILABLE_COLOR 
} from '../../../lib/colors/environmental-colors';

export default function LocationDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { locations } = useLocationStore();
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocationValue, setSelectedLocationValue] = useState<string>('');

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

  const getPollenImage = (score: number | null | undefined) => {
    if (!score || score < 0) return require('../../../assets/kawaii/pollen-good.png');
    const scaledScore = score * 10; // Convert to 0-100 scale
    if (scaledScore <= 100) return require('../../../assets/kawaii/pollen-good.png');
    if (scaledScore <= 200) return require('../../../assets/kawaii/pollen-moderate.png');
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

      // Fetch Microsoft data only
      const { fetchCombinedAirQuality } = await import('../../../lib/api/combined-air-quality');
      const { fetchMicrosoftBreathingData } = await import('../../../lib/api/microsoft-weather');
      
      // Use only Microsoft data
      const [aqiResult, microsoftResult] = await Promise.allSettled([
        fetchCombinedAirQuality(loc.latitude, loc.longitude),
        fetchMicrosoftBreathingData(loc.latitude, loc.longitude),
      ]);

      const aqi = aqiResult.status === 'fulfilled' ? aqiResult.value : {
        aqi: -1,
        level: 'Unknown' as const,
        pollutants: { pm25: -1, pm10: -1, o3: -1, no2: -1, so2: -1, co: -1 },
        timestamp: new Date().toISOString(),
        error: 'Failed to fetch air quality data'
      };

      // Process Microsoft breathing data
      const microsoft = microsoftResult.status === 'fulfilled' ? {
        currentAirQuality: microsoftResult.value.currentAirQuality || undefined,
        airQualityForecast: microsoftResult.value.airQualityForecast || undefined,
        severeAlerts: microsoftResult.value.severeAlerts && microsoftResult.value.severeAlerts.alerts ? {
          alerts: microsoftResult.value.severeAlerts.alerts.map(alert => ({
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
          timestamp: microsoftResult.value.severeAlerts.timestamp,
        } : undefined,
        dailyIndices: microsoftResult.value.dailyIndices && microsoftResult.value.dailyIndices.indices ? {
          indices: microsoftResult.value.dailyIndices.indices.flatMap(dailyResult =>
            dailyResult.indices && Array.isArray(dailyResult.indices) ? dailyResult.indices.map(index => ({
              name: index.name,
              value: index.value,
              category: index.category,
              description: index.description,
              date: dailyResult.dateTime,
            })) : []
          ),
          timestamp: microsoftResult.value.dailyIndices.timestamp,
        } : undefined,
        pollenForecast: microsoftResult.value.dailyForecast && microsoftResult.value.dailyForecast.forecasts ? {
          forecasts: microsoftResult.value.dailyForecast.forecasts.map(forecast => ({
            date: forecast.date,
            pollen: {
              grass: forecast.airAndPollen?.find(item => item.name === 'Grass') || { value: 0, category: 'Low' },
              tree: forecast.airAndPollen?.find(item => item.name === 'Tree') || { value: 0, category: 'Low' },
              weed: forecast.airAndPollen?.find(item => item.name === 'Weed') || { value: 0, category: 'Low' },
              mold: forecast.airAndPollen?.find(item => item.name === 'Mold') || { value: 0, category: 'Low' },
            },
            uvIndex: forecast.airAndPollen?.find(item => item.name === 'UVIndex') || { value: 0, category: 'Low' },
          })),
          timestamp: microsoftResult.value.timestamp,
        } : undefined,
      } : undefined;

      setLocationData({
        location: loc,
        aqi,
        microsoft,
      });
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
    
    // Create realistic pattern with current AQI as baseline
    if (i === 0) {
      aqi = currentAQI; // Current hour
    } else if (hour >= 0 && hour < 6) {
      aqi = Math.max(25, currentAQI - 20 + Math.random() * 15);
    } else if (hour >= 6 && hour < 10) {
      aqi = currentAQI - 10 + Math.random() * 25;
    } else if (hour >= 10 && hour < 18) {
      aqi = currentAQI + Math.random() * 40 - 10;
    } else {
      aqi = currentAQI - 5 + Math.random() * 20;
    }
    
    return {
      hour,
      aqi: Math.max(25, Math.min(150, Math.round(aqi)))
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

  // Find when AQI will rise above comfort level (100)
  const comfortLevel = 100;
  const alertHourIndex = hourlyData.findIndex(data => data.aqi > comfortLevel);
  const hasAlert = alertHourIndex !== -1;
  const alertTime = hasAlert ? {
    hour: hourlyData[alertHourIndex].hour,
    aqi: hourlyData[alertHourIndex].aqi
  } : null;

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
              <Text style={styles.summaryTitle}>{getCharacterTitle()}</Text>
              <Text style={styles.summaryDescription}>
                {getCharacterDescription()}
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
                <Text style={styles.badgeLevel}>{currentLevel}</Text>
              </Badge>
            }
          >
            {/* Alert Section */}
            {hasAlert ? (
              <View style={styles.alertSection}>
                <Text style={styles.alertTitle}>Heads up!</Text>
                <View style={styles.alertContent}>
                  <Text style={styles.alertText}>
                    The AQI is expected to rise above your comfort level of
                  </Text>
                  <Badge 
                    style={styles.comfortBadge}
                    variant="aqi" 
                    level={comfortLevel <= 50 ? 'good' : comfortLevel <= 100 ? 'moderate' : 'unhealthy'}
                  >
                    <Text style={styles.badgeValue}>{comfortLevel}</Text>
                    <Text style={styles.badgeLevel}>{getAQILevel(comfortLevel)}</Text>
                  </Badge>
                  <Text style={styles.alertText}>
                    starting at <Text style={styles.alertTime}>{alertTime ? formatAlertTime(alertTime.hour) : '12 pm'}</Text>
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.alertSection}>
                <Text style={styles.alertTitle}>All good!</Text>
                <View style={styles.alertContent}>
                  <Text style={styles.alertText}>
                    AQI is expected to stay below your comfort level of
                  </Text>
                  <Badge 
                    style={styles.comfortBadge}
                    variant="aqi" 
                    level={comfortLevel <= 50 ? 'good' : comfortLevel <= 100 ? 'moderate' : 'unhealthy'}
                  >
                    <Text style={styles.badgeValue}>{comfortLevel}</Text>
                    <Text style={styles.badgeLevel}>{getAQILevel(comfortLevel)}</Text>
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
                  <Badge variant="aqi" level="good">
                    <Text style={styles.minMaxValue}>{Math.min(...hourlyData.map(h => h.aqi))}</Text>
                  </Badge>
                </View>
                <View style={styles.minMaxItem}>
                  <Text style={styles.minMaxLabel}>Max</Text>
                  <Badge variant="aqi" level="unhealthy">
                    <Text style={styles.minMaxValue}>{Math.max(...hourlyData.map(h => h.aqi))}</Text>
                  </Badge>
                </View>
              </View>
            </View>
          </AccordionItem>
        </Accordion>

        {/* Forecast Section */}
        <Card style={styles.forecastCard}>
          <CardHeader>
            <View style={styles.forecastHeader}>
              <View>
                <CardTitle>Forecast</CardTitle>
                <Text style={styles.forecastSubtitle}>Daily Average</Text>
              </View>
            </View>
          </CardHeader>
          
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Allergen Section - Only show if pollen data is available */}
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
    borderWidth: borders.thick,
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
    ...typography.badge,
    color: colors.contrastText.primary,
  },
  badgeLevel: {
    ...typography.badgeLabel,
    color: colors.contrastText.primary,
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
    marginBottom: spacing.md,
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
    ...typography.badge,
    color: colors.contrastText.primary,
  },
  // Old AQI styles - removed since we're using accordion component
  // Forecast Styles
  forecastCard: {
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
});