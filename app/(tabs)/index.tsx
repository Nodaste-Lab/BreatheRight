import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, RefreshControl, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LocationFeedCard } from '../../components/location/LocationFeedCard';
import { AddLocationModal } from '../../components/location/AddLocationModal';
import { useLocationStore } from '../../store/location';
import { useAuthStore } from '../../store/auth';
import { fonts } from '../../lib/fonts';
import type { LocationData } from '../../types/location';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
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
    // When locations change, fetch data for each
    if (locations.length > 0) {
      fetchAllLocationData();
    }
  }, [locations]);

  const fetchAllLocationData = async () => {
    const dataPromises = locations.map(async (location) => {
      try {
        // Try to get real data first
        const { fetchGoogleAirQuality } = await import('../../lib/api/google-air-quality');
        const { fetchPollenData } = await import('../../lib/api/pollen');
        
        const [aqiResult, pollenResult] = await Promise.allSettled([
          fetchGoogleAirQuality(location.latitude, location.longitude),
          fetchPollenData(location.latitude, location.longitude),
        ]);

        const aqi = aqiResult.status === 'fulfilled' ? aqiResult.value : {
          aqi: Math.floor(Math.random() * 150) + 20,
          level: 'Moderate' as const,
          pollutants: { pm25: 25, pm10: 45, o3: 65, no2: 20, so2: 10, co: 5 },
          timestamp: new Date().toISOString(),
        };

        const pollen = pollenResult.status === 'fulfilled' ? pollenResult.value : {
          overall: Math.floor(Math.random() * 8) + 1,
          tree: 3,
          grass: 2,
          weed: 4,
          level: 'Medium' as const,
          timestamp: new Date().toISOString(),
        };

        // Mock lightning data for now
        const lightning = {
          probability: Math.floor(Math.random() * 100),
          level: 'Low' as const,
          timestamp: new Date().toISOString(),
        };

        return {
          location,
          aqi,
          pollen,
          lightning,
        } as LocationData;
      } catch (error) {
        // Fallback to mock data
        return {
          location,
          aqi: {
            aqi: Math.floor(Math.random() * 150) + 20,
            level: 'Moderate' as const,
            pollutants: { pm25: 25, pm10: 45, o3: 65, no2: 20, so2: 10, co: 5 },
            timestamp: new Date().toISOString(),
          },
          pollen: {
            overall: Math.floor(Math.random() * 8) + 1,
            tree: 3,
            grass: 2,
            weed: 4,
            level: 'Medium' as const,
            timestamp: new Date().toISOString(),
          },
          lightning: {
            probability: Math.floor(Math.random() * 100),
            level: 'Low' as const,
            timestamp: new Date().toISOString(),
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

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Please sign in to view your locations</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && locationDataList.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading your locations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Welcome back</Text>
              <Text style={styles.userName}>{profile?.name || 'User'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add-circle" size={44} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        {locationDataList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🌍</Text>
            <Text style={styles.emptyTitle}>No locations yet</Text>
            <Text style={styles.emptyText}>
              Add your first location to start tracking air quality
            </Text>
            <TouchableOpacity 
              style={styles.addFirstButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add-outline" size={20} color="white" />
              <Text style={styles.addFirstButtonText}>Add Location</Text>
            </TouchableOpacity>
          </View>
        ) : (
          locationDataList.map((data) => (
            <LocationFeedCard
              key={data.location.id}
              data={data}
              onPress={() => handleLocationPress(data.location.id)}
              onRemove={() => handleRemoveLocation(data.location.id)}
            />
          ))
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <AddLocationModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onLocationAdded={handleLocationAdded}
      />
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: 'white',
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
    backgroundColor: '#3b82f6',
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