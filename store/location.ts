import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';
import * as ExpoLocation from 'expo-location';
import type { Location, LocationData, AQIData, PollenData } from '../types/location';

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

      // For now, we'll create mock data since we need API keys for real services
      // In production, you'd call real APIs like OpenWeatherMap, IQAir, etc.
      const mockAQI: AQIData = {
        aqi: Math.floor(Math.random() * 150) + 1,
        level: 'Good',
        pollutants: {
          pm25: Math.floor(Math.random() * 50) + 1,
          pm10: Math.floor(Math.random() * 80) + 1,
          o3: Math.floor(Math.random() * 100) + 1,
          no2: Math.floor(Math.random() * 60) + 1,
          so2: Math.floor(Math.random() * 40) + 1,
          co: Math.floor(Math.random() * 30) + 1,
        },
        timestamp: new Date().toISOString(),
      };

      // Determine AQI level based on value
      if (mockAQI.aqi <= 50) mockAQI.level = 'Good';
      else if (mockAQI.aqi <= 100) mockAQI.level = 'Moderate';
      else if (mockAQI.aqi <= 150) mockAQI.level = 'Unhealthy for Sensitive Groups';
      else if (mockAQI.aqi <= 200) mockAQI.level = 'Unhealthy';
      else if (mockAQI.aqi <= 300) mockAQI.level = 'Very Unhealthy';
      else mockAQI.level = 'Hazardous';

      const mockPollen: PollenData = {
        overall: Math.floor(Math.random() * 10) + 1,
        tree: Math.floor(Math.random() * 10) + 1,
        grass: Math.floor(Math.random() * 10) + 1,
        weed: Math.floor(Math.random() * 10) + 1,
        level: 'Low',
        timestamp: new Date().toISOString(),
      };

      // Determine pollen level
      if (mockPollen.overall <= 2) mockPollen.level = 'Low';
      else if (mockPollen.overall <= 4) mockPollen.level = 'Low-Medium';
      else if (mockPollen.overall <= 6) mockPollen.level = 'Medium';
      else if (mockPollen.overall <= 8) mockPollen.level = 'Medium-High';
      else mockPollen.level = 'High';

      set({ 
        currentLocation: {
          location,
          aqi: mockAQI,
          pollen: mockPollen,
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