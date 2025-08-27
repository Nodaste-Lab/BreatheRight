import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth';
import { useLocationStore } from '../../store/location';
import { LocationCard } from '../../components/location/LocationCard';
import { AddLocationModal } from '../../components/location/AddLocationModal';
import { AQICard } from '../../components/air-quality/AQICard';
import { PollenCard } from '../../components/air-quality/PollenCard';
import { Button } from '../../components/ui/Button';

export default function HomeScreen() {
  const { user, profile } = useAuthStore();
  const { 
    locations, 
    currentLocation, 
    loading, 
    error, 
    fetchUserLocations, 
    getCurrentLocationData 
  } = useLocationStore();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserLocations();
    }
  }, [user]);

  // Load data for primary location
  useEffect(() => {
    const primaryLocation = locations.find(loc => loc.show_in_home);
    if (primaryLocation && !currentLocation) {
      getCurrentLocationData(primaryLocation.id);
    }
  }, [locations]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUserLocations();
      const primaryLocation = locations.find(loc => loc.show_in_home);
      if (primaryLocation) {
        await getCurrentLocationData(primaryLocation.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLocationPress = async (locationId: string) => {
    try {
      await getCurrentLocationData(locationId);
    } catch (error) {
      Alert.alert('Error', 'Failed to load location data');
    }
  };

  const handleLocationAdded = () => {
    fetchUserLocations();
  };

  if (!user) {
    return (
      <View style={styles.signInContainer}>
        <Text style={styles.signInText}>Please sign in to view your locations</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Welcome back, {profile?.name || 'User'}!
          </Text>
          <Text style={styles.headerSubtitle}>
            Check your air quality and pollen levels
          </Text>
        </View>

        <View style={styles.content}>
          {/* Current Location Data */}
          {currentLocation && (
            <View style={styles.currentLocationContainer}>
              <View style={styles.locationHeader}>
                <Ionicons name="location" size={20} color="#2563EB" />
                <Text style={styles.locationTitle}>
                  {currentLocation.location.name}
                </Text>
              </View>
              
              {currentLocation.aqi && <AQICard data={currentLocation.aqi} />}
              {currentLocation.pollen && <PollenCard data={currentLocation.pollen} />}
            </View>
          )}

          {/* Locations List */}
          <View style={styles.locationsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Locations</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                style={styles.addButton}
              >
                <Ionicons name="add-circle" size={24} color="#2563EB" />
              </TouchableOpacity>
            </View>

            {loading && locations.length === 0 ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading locations...</Text>
              </View>
            ) : locations.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="location-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateTitle}>
                  No locations yet
                </Text>
                <Text style={styles.emptyStateDescription}>
                  Add your first location to start tracking air quality and pollen levels
                </Text>
                <Button
                  title="Add Location"
                  onPress={() => setShowAddModal(true)}
                />
              </View>
            ) : (
              locations.map((location) => (
                <LocationCard
                  key={location.id}
                  location={location}
                  onPress={() => handleLocationPress(location.id)}
                  onDelete={handleLocationAdded}
                />
              ))
            )}
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <AddLocationModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onLocationAdded={handleLocationAdded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  signInText: {
    fontSize: 18,
    color: '#6B7280',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#6B7280',
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
  currentLocationContainer: {
    marginBottom: 24,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  locationsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    padding: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    color: '#6B7280',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#991B1B',
  },
});
