import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';
import { updateLocationNotifications } from '../lib/services/notification-scheduler';

// Alert preference types
export interface AlertPreferences {
  id: string;
  locationId: string;
  morningReportEnabled: boolean;
  morningReportTime: string; // HH:MM format
  eveningReportEnabled: boolean;
  eveningReportTime: string; // HH:MM format
  aqiThresholdEnabled: boolean;
  aqiThreshold: number;
  pollenAlertEnabled: boolean;
  stormAlertEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AlertState {
  preferences: AlertPreferences[];
  loading: boolean;
  error: string | null;
}

interface AlertActions {
  fetchAlertPreferences: () => Promise<void>;
  updateLocationAlerts: (locationId: string, updates: Partial<AlertPreferences>) => Promise<void>;
  createDefaultPreferences: (locationId: string) => Promise<void>;
  deleteLocationAlerts: (locationId: string) => Promise<void>;
}

export type AlertStore = AlertState & AlertActions;

export const useAlertStore = create<AlertStore>((set, get) => ({
  preferences: [],
  loading: false,
  error: null,

  fetchAlertPreferences: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's locations first
      const { data: locations } = await supabase
        .from('locations')
        .select('id')
        .eq('user_id', user.id);

      if (!locations || locations.length === 0) {
        set({ preferences: [], loading: false });
        return;
      }

      const locationIds = locations.map(loc => loc.id);

      // Fetch alert preferences for all user locations
      const { data, error } = await supabase
        .from('alert_preferences')
        .select('*')
        .in('location_id', locationIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match our interface
      const preferences: AlertPreferences[] = (data || []).map(pref => ({
        id: pref.id,
        locationId: pref.location_id,
        morningReportEnabled: pref.morning_report_enabled,
        morningReportTime: pref.morning_report_time,
        eveningReportEnabled: pref.evening_report_enabled,
        eveningReportTime: pref.evening_report_time,
        aqiThresholdEnabled: pref.aqi_threshold_enabled,
        aqiThreshold: pref.aqi_threshold,
        pollenAlertEnabled: pref.pollen_alert_enabled,
        stormAlertEnabled: pref.storm_alert_enabled,
        createdAt: pref.created_at,
        updatedAt: pref.updated_at,
      }));

      set({ preferences, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch alert preferences',
        loading: false 
      });
    }
  },

  updateLocationAlerts: async (locationId: string, updates: Partial<AlertPreferences>) => {
    try {
      set({ loading: true, error: null });

      // Convert camelCase to snake_case for database
      const dbUpdates: any = {};
      if (updates.morningReportEnabled !== undefined) dbUpdates.morning_report_enabled = updates.morningReportEnabled;
      if (updates.morningReportTime !== undefined) dbUpdates.morning_report_time = updates.morningReportTime;
      if (updates.eveningReportEnabled !== undefined) dbUpdates.evening_report_enabled = updates.eveningReportEnabled;
      if (updates.eveningReportTime !== undefined) dbUpdates.evening_report_time = updates.eveningReportTime;
      if (updates.aqiThresholdEnabled !== undefined) dbUpdates.aqi_threshold_enabled = updates.aqiThresholdEnabled;
      if (updates.aqiThreshold !== undefined) dbUpdates.aqi_threshold = updates.aqiThreshold;
      if (updates.pollenAlertEnabled !== undefined) dbUpdates.pollen_alert_enabled = updates.pollenAlertEnabled;
      if (updates.stormAlertEnabled !== undefined) dbUpdates.storm_alert_enabled = updates.stormAlertEnabled;

      const { error } = await supabase
        .from('alert_preferences')
        .upsert({
          location_id: locationId,
          ...dbUpdates,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Update local state
      const currentPreferences = get().preferences;
      const existingIndex = currentPreferences.findIndex(p => p.locationId === locationId);
      
      if (existingIndex >= 0) {
        // Update existing preference
        const updatedPreferences = [...currentPreferences];
        updatedPreferences[existingIndex] = {
          ...updatedPreferences[existingIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        set({ preferences: updatedPreferences, loading: false });
      } else {
        // Refresh from database if this is a new preference
        await get().fetchAlertPreferences();
      }

      // Update notification scheduling
      try {
        await updateLocationNotifications(locationId);
      } catch (notificationError) {
        console.error('Failed to update notifications:', notificationError);
        // Don't fail the main operation if notification scheduling fails
      }

      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update alert preferences',
        loading: false 
      });
    }
  },

  createDefaultPreferences: async (locationId: string) => {
    try {
      const defaultPreferences = {
        location_id: locationId,
        morning_report_enabled: false,
        morning_report_time: '08:00',
        evening_report_enabled: false,
        evening_report_time: '18:00',
        aqi_threshold_enabled: false,
        aqi_threshold: 100,
        pollen_alert_enabled: false,
        storm_alert_enabled: false,
      };

      const { error } = await supabase
        .from('alert_preferences')
        .insert(defaultPreferences);

      if (error) throw error;

      // Refresh preferences
      await get().fetchAlertPreferences();
      
      // Set up notifications for the new preferences (none initially)
      try {
        await updateLocationNotifications(locationId);
      } catch (notificationError) {
        console.error('Failed to set up initial notifications:', notificationError);
      }
    } catch (error) {
      console.error('Failed to create default alert preferences:', error);
    }
  },

  deleteLocationAlerts: async (locationId: string) => {
    try {
      const { error } = await supabase
        .from('alert_preferences')
        .delete()
        .eq('location_id', locationId);

      if (error) throw error;

      // Update local state
      const currentPreferences = get().preferences;
      const filteredPreferences = currentPreferences.filter(p => p.locationId !== locationId);
      set({ preferences: filteredPreferences });
      
      // Cancel notifications for this location
      try {
        await updateLocationNotifications(locationId);
      } catch (notificationError) {
        console.error('Failed to cancel notifications:', notificationError);
      }
    } catch (error) {
      console.error('Failed to delete location alert preferences:', error);
    }
  },
}));