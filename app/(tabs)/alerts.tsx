import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { fonts } from '../../lib/fonts';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { useLocationStore } from '../../store/location';
import { useAlertStore } from '../../store/alerts';
import type { AlertPreferences } from '../../store/alerts';

export default function AlertsScreen() {
  const { locations, fetchUserLocations } = useLocationStore();
  const { preferences, fetchAlertPreferences, updateLocationAlerts, createDefaultPreferences } = useAlertStore();
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);

  useEffect(() => {
    fetchUserLocations();
    fetchAlertPreferences();
  }, []);

  // Get preferences for a specific location
  const getLocationPreferences = (locationId: string): AlertPreferences | null => {
    return preferences.find(p => p.locationId === locationId) || null;
  };

  // Toggle alert setting for a location
  const toggleAlert = async (locationId: string, setting: keyof AlertPreferences, value: boolean) => {
    try {
      console.log(`Toggling ${setting} to ${value} for location ${locationId}`);
      
      const existing = getLocationPreferences(locationId);
      if (!existing) {
        // Create minimal preferences with only the toggled setting enabled
        const defaultPreferences = {
          morningReportEnabled: false,
          eveningReportEnabled: false,
          aqiThresholdEnabled: false,
          pollenAlertEnabled: false,
          stormAlertEnabled: false,
          morningReportTime: '08:00',
          eveningReportTime: '18:00',
          aqiThreshold: 100,
          [setting]: value, // Only set the specific toggle to the desired value
        };
        await updateLocationAlerts(locationId, defaultPreferences);
      } else {
        // Update only the specific setting
        await updateLocationAlerts(locationId, { [setting]: value });
      }
      
      console.log('Toggle completed successfully');
    } catch (error) {
      console.error('Failed to toggle alert:', error);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Alerts</Text>
          <Text style={styles.subtitle}>Manage your air quality notifications</Text>
        </View>

        <View style={styles.content}>
          {/* Location-based Alert Settings */}
          {locations.length > 0 ? (
            locations.map((location) => {
              const prefs = getLocationPreferences(location.id);
              const isExpanded = expandedLocation === location.id;
              
              return (
                <Card key={location.id}>
                  <TouchableOpacity 
                    style={styles.locationHeader}
                    onPress={() => setExpandedLocation(isExpanded ? null : location.id)}
                  >
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationName}>{location.name}</Text>
                      <Text style={styles.locationAddress}>{location.address}</Text>
                    </View>
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#6b7280" 
                    />
                  </TouchableOpacity>
                  
                  {isExpanded && (
                    <View style={styles.alertSettings}>
                      {/* Morning Report */}
                      <View style={styles.alertItem}>
                        <View style={styles.alertItemLeft}>
                          <Ionicons name="sunny-outline" size={20} color="#f59e0b" />
                          <View style={styles.alertText}>
                            <Text style={styles.alertName}>Morning Report</Text>
                            <Text style={styles.alertDescription}>Daily AI summary at 8:00 AM</Text>
                          </View>
                        </View>
                        <Switch
                          value={prefs?.morningReportEnabled || false}
                          onValueChange={(value) => toggleAlert(location.id, 'morningReportEnabled', value)}
                          trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                          thumbColor={prefs?.morningReportEnabled ? '#ffffff' : '#f3f4f6'}
                        />
                      </View>
                      
                      {/* Evening Report */}
                      <View style={styles.alertItem}>
                        <View style={styles.alertItemLeft}>
                          <Ionicons name="moon-outline" size={20} color="#6366f1" />
                          <View style={styles.alertText}>
                            <Text style={styles.alertName}>Evening Report</Text>
                            <Text style={styles.alertDescription}>Daily summary at 6:00 PM</Text>
                          </View>
                        </View>
                        <Switch
                          value={prefs?.eveningReportEnabled || false}
                          onValueChange={(value) => toggleAlert(location.id, 'eveningReportEnabled', value)}
                          trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                          thumbColor={prefs?.eveningReportEnabled ? '#ffffff' : '#f3f4f6'}
                        />
                      </View>
                      
                    </View>
                  )}
                </Card>
              );
            })
          ) : (
            <Card>
              <View style={styles.emptyState}>
                <Ionicons name="location-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyTitle}>No Locations Added</Text>
                <Text style={styles.emptyText}>
                  Add locations from the home screen to set up personalized air quality alerts
                </Text>
              </View>
            </Card>
          )}

          {/* Info Card */}
          <Card>
            <View style={styles.infoSection}>
              <Ionicons name="information-circle-outline" size={24} color="#3b82f6" />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>About AI Reports</Text>
                <Text style={styles.infoDescription}>
                  Morning and Evening Reports are generated using AI to provide personalized, actionable insights about air quality conditions in your area.
                </Text>
              </View>
            </View>
          </Card>

        </View>
        </ScrollView>
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
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    ...fonts.headline.h2,
    color: '#491124',
    marginBottom: 4,
  },
  subtitle: {
    ...fonts.body.regular,
    color: '#6b7280',
  },
  content: {
    padding: 16,
  },
  emptyState: {
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
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    ...fonts.headline.h4,
    color: '#111827',
    marginBottom: 2,
  },
  locationAddress: {
    ...fonts.body.small,
    color: '#6b7280',
  },
  alertSettings: {
    paddingTop: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  alertItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertText: {
    marginLeft: 12,
    flex: 1,
  },
  alertName: {
    fontFamily: 'NunitoSans-SemiBold',
    fontSize: 14,
    color: '#111827',
    marginBottom: 2,
  },
  alertDescription: {
    ...fonts.body.small,
    color: '#6b7280',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    ...fonts.headline.h5,
    color: '#111827',
    marginBottom: 6,
  },
  infoDescription: {
    fontFamily: 'NunitoSans-Regular',
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});