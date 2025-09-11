import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, RefreshControl, SafeAreaView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LocationFeedCard } from '../../components/location/LocationFeedCard';
import { AddLocationModal } from '../../components/location/AddLocationModal';
import { useLocationStore } from '../../store/location';
import { useAuthStore } from '../../store/auth';
import { fonts } from '../../lib/fonts';
import { colors } from '../../lib/colors/theme';
import { GradientBackground } from '../../components/ui/GradientBackground';
import type { LocationData } from '../../types/location';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui';

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuthStore();
  const { locations, fetchUserLocations, deleteLocation, loading } = useLocationStore();
  const [locationDataList, setLocationDataList] = useState<LocationData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadLocations();
    }
  }, [user]);

  const loadLocations = async () => {
    await fetchUserLocations();
  };

  useEffect(() => {
    // When locations or weather source changes, fetch data for each
    if (locations.length > 0) {
      fetchAllLocationData();
    }
  }, [locations, profile?.weather_source]);

  const fetchAllLocationData = async () => {
    const dataPromises = locations.map(async (location) => {
      try {
        // Try to get real data using unified weather service
        const { 
          fetchUnifiedAQIData,
          fetchUnifiedPollenData,
          fetchUnifiedStormData 
        } = await import('../../lib/api/unified-weather');
        
        // Note: Wildfire data is currently only available from AirNow
        // In the future, this should also be part of the unified service
        const [aqiResult, pollenResult, stormResult] = await Promise.allSettled([
          fetchUnifiedAQIData(location.latitude, location.longitude),
          fetchUnifiedPollenData(location.latitude, location.longitude),
          fetchUnifiedStormData(location.latitude, location.longitude),
        ]);

        // Use N/A values when API fails
        const aqi = aqiResult.status === 'fulfilled' ? aqiResult.value : {
          aqi: -1, // Use -1 to indicate N/A
          level: 'Unknown' as const,
          pollutants: { pm25: -1, pm10: -1, o3: -1, no2: -1, so2: -1, co: -1 },
          timestamp: new Date().toISOString(),
          error: aqiResult.status === 'rejected' ? aqiResult.reason?.message || 'Failed to fetch AQI data' : undefined
        };

        const pollen = pollenResult.status === 'fulfilled' ? pollenResult.value : {
          overall: -1, // Use -1 to indicate N/A
          tree: -1,
          grass: -1,
          weed: -1,
          level: 'Unknown' as const,
          timestamp: new Date().toISOString(),
          error: pollenResult.status === 'rejected' ? pollenResult.reason?.message || 'Failed to fetch pollen data' : undefined
        };

        // Use real storm data from OpenWeatherMap
        const lightning = stormResult.status === 'fulfilled' ? stormResult.value : {
          probability: -1,
          level: 'Unknown' as const,
          timestamp: new Date().toISOString(),
          error: stormResult.status === 'rejected' ? stormResult.reason?.message || 'Failed to fetch storm data' : undefined
        };

        // Generate realistic wildfire estimates using shared utility
        const { generateWildfireEstimate } = await import('../../lib/utils/wildfire-estimation');
        const wildfire = generateWildfireEstimate(aqi);

        // Log errors for debugging
        if (aqiResult.status === 'rejected') {
          console.error('AQI API failed for', location.name, ':', aqiResult.reason);
        }
        if (pollenResult.status === 'rejected') {
          console.error('Pollen API failed for', location.name, ':', pollenResult.reason);
        }
        if (stormResult.status === 'rejected') {
          console.error('Storm API failed for', location.name, ':', stormResult.reason);
        }

        return {
          location,
          aqi,
          pollen,
          lightning,
          wildfire,
        } as LocationData;
      } catch (error) {
        console.error('Error fetching location data for', location.name, ':', error);
        // Return N/A data on complete failure
        return {
          location,
          aqi: {
            aqi: -1,
            level: 'Unknown' as const,
            pollutants: { pm25: -1, pm10: -1, o3: -1, no2: -1, so2: -1, co: -1 },
            timestamp: new Date().toISOString(),
            error: 'Failed to fetch data'
          },
          pollen: {
            overall: -1,
            tree: -1,
            grass: -1,
            weed: -1,
            level: 'Unknown' as const,
            timestamp: new Date().toISOString(),
            error: 'Failed to fetch data'
          },
          lightning: {
            probability: -1,
            level: 'Unknown' as const,
            timestamp: new Date().toISOString(),
            error: 'Lightning data not available'
          },
          wildfire: {
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
              details: 'Wildfire data not available'
            },
            timestamp: new Date().toISOString(),
            error: 'Failed to fetch wildfire data'
          },
        } as LocationData;
      }
    });
    
    const data = await Promise.all(dataPromises);
    setLocationDataList(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLocations();
    await fetchAllLocationData();
    setRefreshing(false);
  };

  const handleLocationPress = (locationId: string) => {
    // Navigate to location details screen
    router.push(`/location/${locationId}`);
  };

  const handleRemoveLocation = async (locationId: string) => {
    await deleteLocation(locationId);
    await loadLocations();
  };

  const handleLocationAdded = () => {
    loadLocations();
  };

  const handleSignOut = async () => {
    // For web, use window.confirm instead of Alert
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) {
        try {
          await signOut();
          router.replace('/(auth)/sign-in');
        } catch (error) {
          console.error('Sign out error:', error);
          alert('Failed to sign out. Please try again.');
        }
      }
    } else {
      // For mobile, use Alert
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              try {
                await signOut();
                router.replace('/(auth)/sign-in');
              } catch (error) {
                console.error('Sign out error:', error);
                Alert.alert('Error', 'Failed to sign out. Please try again.');
              }
            }
          }
        ]
      );
    }
  };

  if (!user) {
    return (
      <GradientBackground>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Please sign in to view your locations</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (loading && locationDataList.length === 0) {
    return (
      <GradientBackground>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading your locations...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={{ flexGrow: 1, backgroundColor: 'transparent' }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >

        {locationDataList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🌍</Text>
            <Text style={styles.emptyTitle}>No locations yet</Text>
            <Text style={styles.emptyText}>
              Add your first location to start tracking air quality
            </Text>
            <Button
              title="Add Location"
              variant="secondary"
              size='sm'
              style={{ margin: 20 }}
              onPress={() => setShowAddModal(true)}
            />
          </View>
        ) : (
          <>
            {locationDataList.map((data) => (
              <LocationFeedCard
                key={data.location.id}
                data={data}
                onPress={() => handleLocationPress(data.location.id)}
                onRemove={() => handleRemoveLocation(data.location.id)}
              />
            ))}
            <Button
              title="Add Location"
              variant="secondary"
              size='sm'
              style={{ margin: 20 }}
              onPress={() => setShowAddModal(true)}
            />
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <AddLocationModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onLocationAdded={handleLocationAdded}
      />
      
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    ...fonts.body.small,
    color: '#6b7280',
    marginBottom: 4,
  },
  userName: {
    ...fonts.headline.h3,
    color: '#111827',
  },
  addButton: {
    padding: 4,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signOutButton: {
    padding: 8,
  },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  signInText: {
    ...fonts.body.regular,
    color: '#6b7280',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    ...fonts.headline.h4,
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    ...fonts.body.regular,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    ...fonts.body.regular,
    fontFamily: fonts.weight.semibold,
    color: 'white',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 100,
  },
});