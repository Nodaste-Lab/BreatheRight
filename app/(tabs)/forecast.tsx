import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useLocationStore } from '../../store/location';
import { fonts } from '../../lib/fonts';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors/theme';
import { GradientBackground } from '@/components/ui/GradientBackground';

export default function ForecastScreen() {
  const router = useRouter();
  const { locations, fetchUserLocations } = useLocationStore();
  
  useEffect(() => {
    const loadAndRedirect = async () => {
      // Ensure locations are loaded
      if (locations.length === 0) {
        await fetchUserLocations();
      }
      
      // Get the primary location or first location
      const primaryLocation = locations.find(loc => loc.show_in_home) || locations[0];
      
      if (primaryLocation) {
        // Redirect to the location detail page
        router.replace(`/location/${primaryLocation.id}`);
      }
    };
    
    loadAndRedirect();
  }, [locations]);

  // Show loading state while determining which location to show
  if (locations.length === 0) {
    return (
      <GradientBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Locations</Text>
            <Text style={styles.emptyText}>Add a location in the Places tab to see forecasts</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#491124" />
          <Text style={styles.loadingText}>Loading forecast...</Text>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    ...fonts.headline.h4,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    ...fonts.body.regular,
    fontWeight: "400", // Use a valid string literal for React Native
    color: '#6b7280',
    textAlign: 'center',
  },
});