import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';
import * as ExpoLocation from 'expo-location';
import type { Location, LocationData, AQIData, PollenData, LightningData, MicrosoftWeatherData } from '../types/location';

interface LocationState {
  locations: Location[];
  currentLocation: LocationData | null;
  loading: boolean;
  error: string | null;
}

interface LocationActions {
  fetchUserLocations: () => Promise<void>;
  createLocation: (name: string, latitude: number, longitude: number, address: string) => Promise<Location>;
  deleteLocation: (id: string) => Promise<void>;
  setLocationAsPrimary: (id: string) => Promise<void>;
  getCurrentLocationData: (locationId: string) => Promise<void>;
  requestLocationPermission: () => Promise<boolean>;
  getUserCurrentLocation: () => Promise<{ latitude: number; longitude: number; address: string }>;
}

export type LocationStore = LocationState & LocationActions;

export const useLocationStore = create<LocationStore>((set, get) => ({
  locations: [],
  currentLocation: null,
  loading: false,
  error: null,

  fetchUserLocations: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the profile ID first
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('user_id', profile.id)
        .order('show_in_home', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ locations: data || [], loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch locations',
        loading: false 
      });
    }
  },

  createLocation: async (name: string, latitude: number, longitude: number, address: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the profile ID first
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Check if this is the first location (show it in home)
      const { data: existingLocations } = await supabase
        .from('locations')
        .select('id')
        .eq('user_id', profile.id);

      const show_in_home = !existingLocations || existingLocations.length === 0;

      const { data, error } = await supabase
        .from('locations')
        .insert({
          user_id: profile.id,
          name,
          latitude,
          longitude,
          address,
          show_in_home,
          notify_daily: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh the locations list
      await get().fetchUserLocations();
      
      set({ loading: false });
      return data;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create location',
        loading: false 
      });
      throw error;
    }
  },

  deleteLocation: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh the locations list
      await get().fetchUserLocations();
      
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete location',
        loading: false 
      });
    }
  },

  setLocationAsPrimary: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the profile ID first
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // First, set all locations to not show in home
      await supabase
        .from('locations')
        .update({ show_in_home: false })
        .eq('user_id', profile.id);

      // Then set the selected location to show in home
      const { error } = await supabase
        .from('locations')
        .update({ show_in_home: true })
        .eq('id', id);

      if (error) throw error;

      // Refresh the locations list
      await get().fetchUserLocations();
      
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to set primary location',
        loading: false 
      });
    }
  },

  getCurrentLocationData: async (locationId: string) => {
    try {
      set({ loading: true, error: null });
      
      // Get location details
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .select('*')
        .eq('id', locationId)
        .single();

      if (locationError) throw locationError;

      // Import unified API functions
      const { 
        fetchUnifiedAQIData,
        fetchUnifiedPollenData,
        fetchUnifiedStormData,
        fetchUnifiedBreathingData
      } = await import('../lib/api/unified-weather');

      // Fetch real data using the user's selected weather source
      const [aqiData, pollenData, lightningData, breathingData] = await Promise.allSettled([
        fetchUnifiedAQIData(location.latitude, location.longitude),
        fetchUnifiedPollenData(location.latitude, location.longitude),
        fetchUnifiedStormData(location.latitude, location.longitude),
        fetchUnifiedBreathingData(location.latitude, location.longitude),
      ]);

      // Handle AQI data (with fallback)
      let aqi: AQIData;
      if (aqiData.status === 'fulfilled') {
        aqi = aqiData.value;
      } else {
        console.warn('Failed to fetch AQI data, using fallback:', aqiData.reason);
        aqi = {
          aqi: 50,
          level: 'Good',
          pollutants: {
            pm25: 10,
            pm10: 20,
            o3: 60,
            no2: 15,
            so2: 5,
            co: 1,
          },
          timestamp: new Date().toISOString(),
        };
      }

      // Handle pollen data (with fallback)
      let pollen: PollenData;
      if (pollenData.status === 'fulfilled') {
        pollen = pollenData.value;
      } else {
        console.warn('Failed to fetch pollen data, using fallback:', pollenData.reason);
        pollen = {
          overall: 3,
          tree: 3,
          grass: 2,
          weed: 4,
          level: 'Low-Medium',
          timestamp: new Date().toISOString(),
        };
      }

      // Handle lightning data (with fallback)
      let lightning: LightningData;
      if (lightningData.status === 'fulfilled') {
        lightning = lightningData.value;
      } else {
        console.warn('Failed to fetch lightning data, using fallback:', lightningData.reason);
        lightning = {
          probability: 5,
          level: 'Low',
          timestamp: new Date().toISOString(),
        };
      }

      // Handle breathing data (includes Microsoft data when that source is selected)
      let microsoft: MicrosoftWeatherData | undefined;
      if (breathingData.status === 'fulfilled' && breathingData.value.source === 'microsoft') {
        const msData = breathingData.value;
        if (msData.currentAirQuality || msData.airQualityForecast || msData.dailyForecast) {
          microsoft = {
            currentAirQuality: msData.currentAirQuality,
            airQualityForecast: msData.airQualityForecast,
            severeAlerts: msData.severeAlerts,
            dailyIndices: msData.dailyIndices,
            // Extract pollen and UV data from daily forecast
            pollenForecast: msData.dailyForecast ? {
              forecasts: msData.dailyForecast.forecasts.map(forecast => ({
                date: forecast.date,
                pollen: {
                  grass: forecast.airAndPollen?.find(item => item.name === 'Grass') || { value: 0, category: 'Low' },
                  tree: forecast.airAndPollen?.find(item => item.name === 'Tree') || { value: 0, category: 'Low' },
                  weed: forecast.airAndPollen?.find(item => item.name === 'Weed') || { value: 0, category: 'Low' },
                  mold: forecast.airAndPollen?.find(item => item.name === 'Mold') || { value: 0, category: 'Low' },
                },
                uvIndex: forecast.airAndPollen?.find(item => item.name === 'UVIndex') || { value: 0, category: 'Low' },
              })),
              timestamp: msData.timestamp,
            } : undefined,
          };
        }
      } else if (breathingData.status === 'rejected') {
        console.warn('Failed to fetch breathing data:', breathingData.reason);
        // Breathing data is optional
      }

      // Generate realistic wildfire estimates based on current air quality data
      const { generateWildfireEstimate } = await import('../lib/utils/wildfire-estimation');
      const wildfire = generateWildfireEstimate(aqi);

      set({ 
        currentLocation: {
          location,
          aqi,
          pollen,
          lightning,
          wildfire,
          microsoft,
        },
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch location data',
        loading: false 
      });
    }
  },

  requestLocationPermission: async () => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  },

  getUserCurrentLocation: async () => {
    try {
      const hasPermission = await get().requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.High,
      });

      // Get address from coordinates
      const [address] = await ExpoLocation.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const formattedAddress = address 
        ? `${address.streetNumber || ''} ${address.street || ''}, ${address.city || ''}, ${address.region || ''}`.trim().replace(/^,\s*/, '').replace(/,\s*$/, '')
        : `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: formattedAddress,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get current location');
    }
  },
}));