import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../../store/location';
import { AQICard } from '../../components/air-quality/AQICard';
import { PollenCard } from '../../components/air-quality/PollenCard';
import { fonts } from '../../lib/fonts';
import type { LocationData, LightningData, WildFireData } from '../../types/location';

export default function LocationDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { locations, getCurrentLocationData, currentLocation, loading } = useLocationStore();
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const location = locations.find(loc => loc.id === id);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadLocationData(id);
    }
  }, [id]);

  const loadLocationData = async (locationId: string) => {
    setRefreshing(true);
    try {
      // Get the location details
      const loc = locations.find(l => l.id === locationId);
      if (!loc) return;

      // Fetch real data from combined sources
      const { fetchCombinedAirQuality } = await import('../../lib/api/combined-air-quality');
      const { fetchPollenData } = await import('../../lib/api/pollen');
      const { fetchQuickStormStatus } = await import('../../lib/api/weather');
      const { fetchWildFireData } = await import('../../lib/api/airnow');
      
      const [aqiResult, pollenResult, stormResult, wildfireResult] = await Promise.allSettled([
        fetchCombinedAirQuality(loc.latitude, loc.longitude),
        fetchPollenData(loc.latitude, loc.longitude),
        fetchQuickStormStatus(loc.latitude, loc.longitude),
        fetchWildFireData(loc.latitude, loc.longitude),
      ]);

      const aqi = aqiResult.status === 'fulfilled' ? aqiResult.value : {
        aqi: -1,
        level: 'Unknown' as const,
        pollutants: { pm25: -1, pm10: -1, o3: -1, no2: -1, so2: -1, co: -1 },
        timestamp: new Date().toISOString(),
        error: 'Failed to fetch air quality data'
      };
      
      const pollen = pollenResult.status === 'fulfilled' ? pollenResult.value : {
        overall: -1,
        tree: -1,
        grass: -1,
        weed: -1,
        level: 'Unknown' as const,
        timestamp: new Date().toISOString(),
        error: 'Failed to fetch pollen data'
      };

      // Use real storm data from OpenWeatherMap
      const lightning = stormResult.status === 'fulfilled' ? stormResult.value : {
        probability: -1,
        level: 'Unknown' as const,
        timestamp: new Date().toISOString(),
        error: 'Failed to fetch storm data'
      };

      // Use real wildfire data from AirNow
      const wildfire = wildfireResult.status === 'fulfilled' ? wildfireResult.value : {
        smokeRisk: {
          level: 'Unknown' as const,
          pm25: -1,
          visibility: -1
        },
        dustRisk: {
          level: 'Unknown' as const,
          pm10: -1,
          visibility: -1
        },
        fireActivity: {
          nearbyFires: -1,
          closestFireDistance: -1,
          largestFireSize: -1
        },
        outlook: {
          next24Hours: 'Unknown' as const,
          confidence: 'Low' as const,
          details: 'Failed to fetch wildfire data'
        },
        timestamp: new Date().toISOString(),
        error: 'Failed to fetch wildfire data'
      };

      setLocationData({
        location: loc,
        aqi,
        pollen,
        lightning,
        wildfire,
      });
    } catch (error) {
      console.error('Error loading location data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (!location || !locationData) {
    return (
      <SafeAreaView style={styles.container}>
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
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: location.name,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Location Header */}
        <View style={styles.header}>
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={24} color="#3b82f6" />
            <View style={styles.locationText}>
              <Text style={styles.locationName}>{location.name}</Text>
              <Text style={styles.locationAddress}>{location.address}</Text>
            </View>
          </View>
          
          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {locationData.aqi && locationData.aqi.aqi >= 0 ? locationData.aqi.aqi : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>AQI</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {locationData.pollen && locationData.pollen.overall >= 0 ? `${locationData.pollen.overall * 10}` : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Pollen</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {locationData.lightning && locationData.lightning.probability >= 0 ? `${locationData.lightning.probability}%` : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Storm</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {locationData.wildfire?.smokeRisk?.pm25 && locationData.wildfire.smokeRisk.pm25 >= 0 ? locationData.wildfire.smokeRisk.pm25 : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Smoke</Text>
            </View>
          </View>
        </View>

        {/* Detailed Cards */}
        <View style={styles.cardsContainer}>
          {locationData.aqi && locationData.aqi.aqi >= 0 && <AQICard data={locationData.aqi} />}
          {locationData.pollen && locationData.pollen.overall >= 0 && <PollenCard data={locationData.pollen} />}
          
          {/* Lightning Card */}
          {locationData.lightning && locationData.lightning.probability >= 0 && (
            <View style={styles.lightningCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Lightning Risk</Text>
                <Text style={styles.cardTimestamp}>
                  Updated {new Date(locationData.lightning.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              
              <View style={styles.lightningContent}>
                <View style={styles.lightningIcon}>
                  <Text style={styles.lightningEmoji}>⛈️</Text>
                </View>
                <View style={styles.lightningInfo}>
                  <Text style={styles.lightningProbability}>
                    {locationData.lightning.probability}% Chance
                  </Text>
                  <Text style={styles.lightningLevel}>
                    {locationData.lightning.level} Risk Level
                  </Text>
                </View>
              </View>
              
              <View style={styles.lightningBar}>
                <View 
                  style={[
                    styles.lightningProgress, 
                    { 
                      width: `${locationData.lightning.probability}%`,
                      backgroundColor: locationData.lightning.probability > 60 ? '#ef4444' : 
                                       locationData.lightning.probability > 30 ? '#eab308' : '#10b981'
                    }
                  ]} 
                />
              </View>
            </View>
          )}

          {/* Wildfire Card */}
          {locationData.wildfire && (locationData.wildfire.smokeRisk?.pm25 >= 0 || locationData.wildfire.dustRisk?.pm10 >= 0) && (
            <View style={styles.wildfireCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Wildfire & Smoke</Text>
                <Text style={styles.cardTimestamp}>
                  Updated {new Date(locationData.wildfire.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              
              {/* Smoke Risk */}
              {locationData.wildfire.smokeRisk && locationData.wildfire.smokeRisk.pm25 >= 0 && (
                <View style={styles.wildfireSection}>
                  <View style={styles.wildfireContent}>
                    <View style={styles.wildfireIcon}>
                      <Text style={styles.wildfireEmoji}>🔥</Text>
                    </View>
                    <View style={styles.wildfireInfo}>
                      <Text style={styles.wildfireValue}>
                        {locationData.wildfire.smokeRisk.level} Smoke Risk
                      </Text>
                      <Text style={styles.wildfireDetail}>
                        PM2.5: {locationData.wildfire.smokeRisk.pm25} μg/m³
                      </Text>
                      {locationData.wildfire.smokeRisk.visibility > 0 && (
                        <Text style={styles.wildfireDetail}>
                          Visibility: {locationData.wildfire.smokeRisk.visibility} miles
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* Dust Risk */}
              {locationData.wildfire.dustRisk && locationData.wildfire.dustRisk.pm10 >= 0 && (
                <View style={styles.wildfireSection}>
                  <View style={styles.wildfireContent}>
                    <View style={[styles.wildfireIcon, { backgroundColor: '#f3e8ff' }]}>
                      <Text style={styles.wildfireEmoji}>🌪️</Text>
                    </View>
                    <View style={styles.wildfireInfo}>
                      <Text style={styles.wildfireValue}>
                        {locationData.wildfire.dustRisk.level} Dust Risk
                      </Text>
                      <Text style={styles.wildfireDetail}>
                        PM10: {locationData.wildfire.dustRisk.pm10} μg/m³
                      </Text>
                      {locationData.wildfire.dustRisk.visibility > 0 && (
                        <Text style={styles.wildfireDetail}>
                          Visibility: {locationData.wildfire.dustRisk.visibility} miles
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* Outlook */}
              {locationData.wildfire.outlook && locationData.wildfire.outlook.next24Hours !== 'Unknown' && (
                <View style={styles.outlookSection}>
                  <Text style={styles.outlookTitle}>24-Hour Outlook</Text>
                  <View style={styles.outlookContent}>
                    <View style={styles.outlookTrend}>
                      <Text style={[
                        styles.outlookStatus,
                        {
                          color: locationData.wildfire.outlook.next24Hours === 'Improving' ? '#10b981' :
                                 locationData.wildfire.outlook.next24Hours === 'Worsening' ? '#ef4444' : '#6b7280'
                        }
                      ]}>
                        {locationData.wildfire.outlook.next24Hours}
                      </Text>
                      <Text style={styles.outlookConfidence}>
                        {locationData.wildfire.outlook.confidence} Confidence
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.outlookDetails}>
                    {locationData.wildfire.outlook.details}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Recommendations */}
          <View style={styles.recommendationsCard}>
            <Text style={styles.cardTitle}>Today's Recommendations</Text>
            <View style={styles.recommendations}>
              <View style={styles.recommendation}>
                <Ionicons name="walk-outline" size={20} color="#10b981" />
                <Text style={styles.recommendationText}>
                  {locationData.aqi && locationData.aqi.aqi < 100 
                    ? 'Good conditions for outdoor activities'
                    : 'Consider limiting outdoor exposure'}
                </Text>
              </View>
              <View style={styles.recommendation}>
                <Ionicons name="home-outline" size={20} color="#3b82f6" />
                <Text style={styles.recommendationText}>
                  {locationData.pollen && locationData.pollen.overall < 5
                    ? 'Keep windows open for fresh air'
                    : 'Keep windows closed to reduce allergens'}
                </Text>
              </View>
              <View style={styles.recommendation}>
                <Ionicons name="warning-outline" size={20} color="#eab308" />
                <Text style={styles.recommendationText}>
                  {locationData.lightning && locationData.lightning.probability > 50
                    ? 'Stay indoors during storms'
                    : 'No weather warnings'}
                </Text>
              </View>
              
              {/* Wildfire-specific recommendation */}
              {locationData.wildfire?.smokeRisk && locationData.wildfire.smokeRisk.level !== 'Unknown' && locationData.wildfire.smokeRisk.level !== 'Low' && (
                <View style={styles.recommendation}>
                  <Ionicons name="flame-outline" size={20} color="#ef4444" />
                  <Text style={styles.recommendationText}>
                    {locationData.wildfire.smokeRisk.level === 'Hazardous' || locationData.wildfire.smokeRisk.level === 'Very Unhealthy'
                      ? 'Avoid all outdoor activities due to smoke'
                      : locationData.wildfire.smokeRisk.level === 'Unhealthy' || locationData.wildfire.smokeRisk.level === 'High'
                      ? 'Limit outdoor activities and consider wearing N95 mask'
                      : 'Monitor air quality and limit time outdoors'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    ...fonts.body.regular,
    color: '#6b7280',
    marginTop: 12,
  },
  backButton: {
    padding: 4,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  locationText: {
    marginLeft: 12,
    flex: 1,
  },
  locationName: {
    ...fonts.headline.h3,
    color: '#111827',
    marginBottom: 4,
  },
  locationAddress: {
    ...fonts.body.regular,
    color: '#6b7280',
    lineHeight: 20,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statValue: {
    ...fonts.headline.h4,
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    ...fonts.body.tiny,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardsContainer: {
    padding: 16,
  },
  lightningCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    ...fonts.headline.h5,
    color: '#111827',
  },
  cardTimestamp: {
    ...fonts.body.small,
    color: '#6b7280',
  },
  lightningContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  lightningIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#fef3c7',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  lightningEmoji: {
    fontSize: 32,
  },
  lightningInfo: {
    flex: 1,
  },
  lightningProbability: {
    ...fonts.headline.h4,
    color: '#111827',
    marginBottom: 4,
  },
  lightningLevel: {
    ...fonts.body.regular,
    color: '#6b7280',
  },
  lightningBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  lightningProgress: {
    height: '100%',
    borderRadius: 4,
  },
  wildfireCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  wildfireSection: {
    marginBottom: 20,
  },
  wildfireContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wildfireIcon: {
    width: 56,
    height: 56,
    backgroundColor: '#fef3c7',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  wildfireEmoji: {
    fontSize: 24,
  },
  wildfireInfo: {
    flex: 1,
  },
  wildfireValue: {
    ...fonts.headline.h5,
    color: '#111827',
    marginBottom: 4,
  },
  wildfireDetail: {
    ...fonts.body.small,
    color: '#6b7280',
    marginBottom: 2,
  },
  outlookSection: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  outlookTitle: {
    ...fonts.body.small,
    fontFamily: fonts.weight.semibold,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  outlookContent: {
    marginBottom: 12,
  },
  outlookTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  outlookStatus: {
    ...fonts.headline.h6,
    fontFamily: fonts.weight.semibold,
  },
  outlookConfidence: {
    ...fonts.body.small,
    color: '#6b7280',
  },
  outlookDetails: {
    ...fonts.body.regular,
    color: '#4b5563',
    lineHeight: 20,
  },
  recommendationsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  recommendations: {
    marginTop: 16,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationText: {
    ...fonts.body.regular,
    color: '#4b5563',
    marginLeft: 12,
    flex: 1,
  },
  bottomPadding: {
    height: 40,
  },
});