import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';

// Alert preference types
export interface AlertPreferences {
  id: string;
  locationId: string;
  morningReportEnabled: boolean;
  morningReportTime: string; // HH:MM format
  morningReportName: string; // Custom name for morning report
  eveningReportEnabled: boolean;
  eveningReportTime: string; // HH:MM format
  eveningReportName: string; // Custom name for evening report
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
        morningReportName: pref.morning_report_name || 'Morning Report',
        eveningReportEnabled: pref.evening_report_enabled,
        eveningReportTime: pref.evening_report_time,
        eveningReportName: pref.evening_report_name || 'Evening Report',
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
      if (updates.morningReportName !== undefined) dbUpdates.morning_report_name = updates.morningReportName;
      if (updates.eveningReportEnabled !== undefined) dbUpdates.evening_report_enabled = updates.eveningReportEnabled;
      if (updates.eveningReportTime !== undefined) dbUpdates.evening_report_time = updates.eveningReportTime;
      if (updates.eveningReportName !== undefined) dbUpdates.evening_report_name = updates.eveningReportName;
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

      let mergedPreferences;

      if (existingIndex >= 0) {
        // Update existing preference
        const updatedPreferences = [...currentPreferences];
        mergedPreferences = {
          ...updatedPreferences[existingIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        updatedPreferences[existingIndex] = mergedPreferences;
        set({ preferences: updatedPreferences, loading: false });
      } else {
        // Create new preference with defaults
        mergedPreferences = {
          id: '', // Will be set by database
          locationId,
          morningReportEnabled: false,
          morningReportTime: '08:00',
          morningReportName: 'Morning Report',
          eveningReportEnabled: false,
          eveningReportTime: '18:00',
          eveningReportName: 'Evening Report',
          aqiThresholdEnabled: false,
          aqiThreshold: 100,
          pollenAlertEnabled: false,
          stormAlertEnabled: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...updates,
        };
        // Refresh from database if this is a new preference
        await get().fetchAlertPreferences();
      }

      // Only update notification scheduling for morning/evening report changes
      if (updates.morningReportEnabled !== undefined ||
          updates.eveningReportEnabled !== undefined ||
          updates.morningReportTime !== undefined ||
          updates.eveningReportTime !== undefined) {
        try {
          console.log('Updating notifications for report settings:', mergedPreferences);
          // Dynamically import to avoid circular dependency
          const { updateLocationNotifications } = await import('../lib/services/notification-scheduler');
          await updateLocationNotifications(locationId, mergedPreferences);
        } catch (notificationError) {
          console.error('Failed to update notifications:', notificationError);
          // Don't fail the main operation if notification scheduling fails
        }
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
        const { updateLocationNotifications } = await import('../lib/services/notification-scheduler');
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
        const { cancelLocationNotifications } = await import('../lib/services/notification-scheduler');
        await cancelLocationNotifications(locationId);
      } catch (notificationError) {
        console.error('Failed to cancel notifications:', notificationError);
      }
    } catch (error) {
      console.error('Failed to delete location alert preferences:', error);
    }
  },
}));