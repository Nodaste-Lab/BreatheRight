import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Modal, FlatList, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../../../store/location';
import { Card } from '../../../components/ui/Card';
import { fonts } from '../../../lib/fonts';
import { colors } from '@/lib/colors/theme';
import { GradientBackground } from '@/components/ui/GradientBackground';
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

  const location = locations.find(loc => loc.id === id);

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

  const handleBack = () => {
    router.back();
  };

  if (!location || !locationData) {
    return (
      <GradientBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
          <Stack.Screen 
          options={{
            headerShown: true,
            title: 'Location Details',
            headerLeft: () => (
              <TouchableOpacity onPress={handleBack}>
                <Ionicons name="arrow-back" size={24} color="#111827" />
              </TouchableOpacity>
            ),
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

  // Create daily forecast from Microsoft data - this would need actual daily AQI forecast data
  // For now, we'll hide the daily forecast section if no data is available
  const dailyForecast = [];

  // Get current AQI and status
  const currentAQI = locationData.aqi?.aqi || 0;
  const currentLevel = currentAQI <= 50 ? 'Good' : currentAQI <= 100 ? 'Moderate' : 'Poor';
  const aqiColor = getAQIColorByValue(currentAQI);
  
  // Get Microsoft's air quality description
  const microsoftDescription = (locationData.aqi as any)?.description || 
    (locationData.microsoft?.currentAirQuality as any)?.description || 
    'Air quality information is currently being updated';

  return (
    <GradientBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.burgundy} />
            <Text style={styles.backText}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.locationSelector}
            onPress={() => setShowLocationPicker(true)}
          >
            <Text style={styles.locationName}>{location.address}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.burgundy} />
          </TouchableOpacity>
        </View>

        {/* Character Description */}
        <Card style={styles.characterCard}>
          <View style={styles.characterContainer}>
            <Image 
              source={require('../../../assets/kawaii/lungs-good.png')} 
              style={styles.characterImage} 
            />
            <View style={styles.characterText}>
              <Text style={styles.characterTitle}>Breathing Advisor</Text>
              <Text style={styles.characterDescription}>
                {microsoftDescription}
              </Text>
            </View>
          </View>
          
          <View style={styles.lastUpdate}>
            <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.lastUpdateText}>
              Last update {new Date(locationData.aqi.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </Card>

        {/* Main AQI Card */}
        <Card style={styles.mainCard}>
          <View style={styles.aqiHeader}>
            <View style={[styles.scoreIcon, { backgroundColor: getAQIColorSafe(currentAQI) }]}>
              <Image source={getAQIImage(currentAQI)} style={styles.scoreKawaiiImage} width={64} />
            </View>
            <View style={styles.aqiInfo}>
              <Text style={fonts.headline.h4}>Air Quality Index</Text>
            </View>
            <View style={[styles.aqiValueContainer, { backgroundColor: getAQIColorSafe(currentAQI) }]}>
              <Text style={styles.aqiValue}>{currentAQI}</Text>
              <Text style={styles.aqiLevel}>{currentLevel}</Text>
            </View>
          </View>

          {/* Alert Section - Only show if we have severe weather alerts */}
          {locationData.microsoft?.severeAlerts?.alerts && locationData.microsoft.severeAlerts.alerts.length > 0 && (
            <View style={styles.alertSection}>
              <Text style={styles.alertTitle}>Weather Alert!</Text>
              <Text style={styles.alertMessage}>
                {locationData.microsoft.severeAlerts.alerts[0].description}
              </Text>
              <View style={styles.alertThreshold}>
                <Text style={styles.thresholdValue}>{locationData.microsoft.severeAlerts.alerts[0].severity}</Text>
                <Text style={styles.thresholdLabel}>{locationData.microsoft.severeAlerts.alerts[0].area}</Text>
              </View>
            </View>
          )}

          {/* Histogram */}
          <AQIHistogram forecast={forecast} title="" showTimeLabels={true} />
        </Card>

        {/* Forecast Section - Only show if we have daily forecast data */}
        {dailyForecast.length > 0 && (
          <Card style={styles.forecastCard}>
            <Text style={styles.forecastTitle}>Forecast</Text>
            <Text style={styles.forecastSubtitle}>Daily Average</Text>
            
            <View style={styles.dailyForecast}>
              {dailyForecast.map((day, index) => (
                <View key={index} style={styles.forecastDay}>
                  <Text style={styles.dayLabel}>{day.day}</Text>
                  <View style={[styles.dayValue, { backgroundColor: getAQIColorByValue(day.aqi) }]}>
                    <Text style={styles.dayAqi}>{day.aqi}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

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
    fontFamily: fonts.body.regular.fontFamily,
    fontSize: fonts.body.regular.fontSize,
    color: colors.text.secondary,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontFamily: fonts.body.regular.fontFamily,
    fontSize: fonts.body.regular.fontSize,
    color: colors.burgundy,
    marginLeft: 4,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationName: {
    fontFamily: fonts.body.regular.fontFamily,
    fontSize: fonts.body.regular.fontSize,
    color: colors.burgundy,
    marginRight: 8,
  },
  characterCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  characterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  characterImage: {
    width: 80,
    height: 80,
    marginRight: 16,
    resizeMode: 'contain' as const,
  },
  characterText: {
    flex: 1,
  },
  characterTitle: {
    fontFamily: fonts.headline.h3.fontFamily,
    fontSize: fonts.headline.h3.fontSize,
    color: colors.burgundy,
    marginBottom: 8,
  },
  characterDescription: {
    fontFamily: fonts.body.regular.fontFamily,
    fontSize: fonts.body.regular.fontSize,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  lastUpdate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastUpdateText: {
    fontFamily: fonts.body.small.fontFamily,
    fontSize: fonts.body.small.fontSize,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  mainCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  aqiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreIcon: {
    width: 64,
    aspectRatio: 1, // Makes it a square based on the width
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    marginRight: 8,
    padding: 12,
  },
  scoreKawaiiImage: {
    width: '125%', // Takes 90% of the scoreIcon container width
    height: '125%', // Maintains aspect ratio within the square container
    resizeMode: 'contain',
  },
  aqiIcon: {
    width: 48,
    height: 48,
    resizeMode: 'contain' as const,
  },
  aqiInfo: {
    flex: 1,
  },
  aqiTitle: {
    fontFamily: fonts.body.regular.fontFamily,
    fontSize: fonts.body.regular.fontSize,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  aqiValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    // paddingVertical: 8,
    borderRadius: 12,
    // minWidth: 80,
    gap: 8,
  },
  aqiValue: {
    fontFamily: fonts.headline.h2.fontFamily,
    fontSize: fonts.headline.h2.fontSize,
    color: colors.burgundy,
  },
  aqiLevel: {
    fontFamily: fonts.body.small.fontFamily,
    fontSize: fonts.body.small.fontSize,
    color: colors.burgundy,
  },
  alertSection: {
    marginBottom: 20,
  },
  alertTitle: {
    fontFamily: fonts.headline.h4.fontFamily,
    fontSize: fonts.headline.h4.fontSize,
    color: colors.burgundy,
    marginBottom: 8,
  },
  alertMessage: {
    fontFamily: fonts.body.regular.fontFamily,
    fontSize: fonts.body.regular.fontSize,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  alertThreshold: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  thresholdValue: {
    fontFamily: fonts.headline.h4.fontFamily,
    fontSize: fonts.headline.h4.fontSize,
    color: colors.burgundy,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    fontWeight: 'bold' as const,
  },
  thresholdLabel: {
    fontFamily: fonts.body.regular.fontFamily,
    fontSize: fonts.body.regular.fontSize,
    color: colors.text.primary,
    marginRight: 8,
  },
  thresholdTime: {
    fontFamily: fonts.body.regular.fontFamily,
    fontSize: fonts.body.regular.fontSize,
    color: colors.text.secondary,
  },
  forecastCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  forecastTitle: {
    fontFamily: fonts.headline.h4.fontFamily,
    fontSize: fonts.headline.h4.fontSize,
    color: colors.burgundy,
    marginBottom: 4,
  },
  forecastSubtitle: {
    fontFamily: fonts.body.small.fontFamily,
    fontSize: fonts.body.small.fontSize,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  dailyForecast: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  forecastDay: {
    alignItems: 'center',
  },
  dayLabel: {
    fontFamily: fonts.body.small.fontFamily,
    fontSize: fonts.body.small.fontSize,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  dayValue: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dayAqi: {
    fontFamily: fonts.body.regular.fontFamily,
    fontSize: fonts.body.regular.fontSize,
    color: colors.burgundy,
    fontWeight: 'bold' as const,
  },
  allergenCard: {
    backgroundColor: '#FFF0F5',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  allergenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allergenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  allergenIcon: {
    width: 48,
    height: 48,
    marginRight: 16,
    resizeMode: 'contain' as const,
  },
  allergenTitle: {
    fontFamily: fonts.body.regular.fontFamily,
    fontSize: fonts.body.regular.fontSize,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  allergenValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  allergenValue: {
    fontFamily: fonts.headline.h2.fontFamily,
    fontSize: fonts.headline.h2.fontSize,
    color: '#E91E63',
    fontWeight: 'bold' as const,
    marginRight: 8,
  },
  allergenLevel: {
    fontFamily: fonts.body.regular.fontFamily,
    fontSize: fonts.body.regular.fontSize,
    color: '#E91E63',
    marginRight: 8,
  },
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
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
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: fonts.headline.h4.fontFamily,
    fontSize: fonts.headline.h4.fontSize,
    color: colors.text.primary,
  },
  locationItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedLocationItem: {
    backgroundColor: '#FFF0F5',
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
    fontFamily: fonts.body.regular.fontFamily,
    fontSize: fonts.body.regular.fontSize,
    fontWeight: '600' as const,
    color: colors.text.primary,
    marginBottom: 2,
  },
  selectedLocationItemName: {
    color: colors.burgundy,
  },
  locationItemAddress: {
    fontFamily: fonts.body.small.fontFamily,
    fontSize: fonts.body.small.fontSize,
    color: colors.text.secondary,
  },
});