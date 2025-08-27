import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../../store/location';
import { AQICard } from '../../components/air-quality/AQICard';
import { PollenCard } from '../../components/air-quality/PollenCard';
import { fonts } from '../../lib/fonts';
import type { LocationData, LightningData } from '../../types/location';

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

      // Fetch real data
      const { fetchGoogleAirQuality } = await import('../../lib/api/google-air-quality');
      const { fetchPollenData } = await import('../../lib/api/pollen');
      
      const [aqiResult, pollenResult] = await Promise.allSettled([
        fetchGoogleAirQuality(loc.latitude, loc.longitude),
        fetchPollenData(loc.latitude, loc.longitude),
      ]);

      const aqi = aqiResult.status === 'fulfilled' ? aqiResult.value : null;
      const pollen = pollenResult.status === 'fulfilled' ? pollenResult.value : null;

      // Mock lightning data
      const lightning: LightningData = {
        probability: Math.floor(Math.random() * 100),
        level: 'Low',
        timestamp: new Date().toISOString(),
      };

      setLocationData({
        location: loc,
        aqi,
        pollen,
        lightning,
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
                {locationData.aqi?.aqi || '--'}
              </Text>
              <Text style={styles.statLabel}>AQI</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {locationData.pollen ? `${locationData.pollen.overall * 10}` : '--'}
              </Text>
              <Text style={styles.statLabel}>Pollen</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {locationData.lightning ? `${locationData.lightning.probability}%` : '--'}
              </Text>
              <Text style={styles.statLabel}>Storm</Text>
            </View>
          </View>
        </View>

        {/* Detailed Cards */}
        <View style={styles.cardsContainer}>
          {locationData.aqi && <AQICard data={locationData.aqi} />}
          {locationData.pollen && <PollenCard data={locationData.pollen} />}
          
          {/* Lightning Card */}
          {locationData.lightning && (
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