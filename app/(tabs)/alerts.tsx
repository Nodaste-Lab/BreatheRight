import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, TouchableOpacity, Platform, Modal, TextInput } from 'react-native';
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
  const [showTimePicker, setShowTimePicker] = useState<{ locationId: string; type: 'morning' | 'evening' } | null>(null);
  const [editingName, setEditingName] = useState<{ locationId: string; type: 'morning' | 'evening'; name: string } | null>(null);

  // Format time to 12-hour format with am/pm
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
  };

  // Initialize temp time for picker
  const getCurrentTime = (locationId: string, type: 'morning' | 'evening') => {
    const prefs = getLocationPreferences(locationId);
    const currentTime = type === 'morning'
      ? (prefs?.morningReportTime || '08:00')
      : (prefs?.eveningReportTime || '18:00');
    const [hours, minutes] = currentTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return date;
  };

  const [tempTime, setTempTime] = useState<Date>(new Date());

  useEffect(() => {
    fetchUserLocations();
    fetchAlertPreferences();
  }, []);

  // Get preferences for a specific location
  const getLocationPreferences = (locationId: string): AlertPreferences | null => {
    return preferences.find(p => p.locationId === locationId) || null;
  };

  // Update time for a location
  const updateTime = async (locationId: string, type: 'morning' | 'evening', time: Date) => {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    const field = type === 'morning' ? 'morningReportTime' : 'eveningReportTime';

    try {
      const existing = getLocationPreferences(locationId);
      if (!existing) {
        const defaultPreferences = {
          morningReportEnabled: false,
          eveningReportEnabled: false,
          aqiThresholdEnabled: false,
          pollenAlertEnabled: false,
          stormAlertEnabled: false,
          morningReportTime: '08:00',
          eveningReportTime: '18:00',
          aqiThreshold: 100,
          [field]: timeString,
        };
        await updateLocationAlerts(locationId, defaultPreferences);
      } else {
        await updateLocationAlerts(locationId, { [field]: timeString });
      }
      setShowTimePicker(null);
    } catch (error) {
      console.error('Failed to update time:', error);
    }
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

  // Update alert name for a location
  const updateAlertName = async (locationId: string, type: 'morning' | 'evening', name: string) => {
    try {
      const field = type === 'morning' ? 'morningReportName' : 'eveningReportName';
      const existing = getLocationPreferences(locationId);

      if (!existing) {
        const defaultPreferences = {
          morningReportEnabled: false,
          eveningReportEnabled: false,
          aqiThresholdEnabled: false,
          pollenAlertEnabled: false,
          stormAlertEnabled: false,
          morningReportTime: '08:00',
          eveningReportTime: '18:00',
          morningReportName: 'Morning Report',
          eveningReportName: 'Evening Report',
          aqiThreshold: 100,
          [field]: name,
        };
        await updateLocationAlerts(locationId, defaultPreferences);
      } else {
        await updateLocationAlerts(locationId, { [field]: name });
      }

      // Refresh preferences after update
      await fetchAlertPreferences();
      setEditingName(null);
    } catch (error) {
      console.error('Failed to update alert name:', error);
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
                            <TouchableOpacity
                              onPress={() => setEditingName({
                                locationId: location.id,
                                type: 'morning',
                                name: prefs?.morningReportName || 'Morning Report'
                              })}
                            >
                              <View style={styles.editableNameContainer}>
                                <Text style={styles.alertName}>{prefs?.morningReportName || 'Morning Report'}</Text>
                                <Ionicons name="pencil-outline" size={14} color="#6b7280" style={styles.editIcon} />
                              </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => {
                                const time = getCurrentTime(location.id, 'morning');
                                setTempTime(time);
                                setShowTimePicker({ locationId: location.id, type: 'morning' });
                              }}
                              style={styles.timeButton}
                            >
                              <Text style={styles.alertDescription}>
                                Daily AI summary at {formatTime(prefs?.morningReportTime || '08:00')}
                              </Text>
                              <Ionicons name="time-outline" size={14} color="#3b82f6" />
                            </TouchableOpacity>
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
                            <TouchableOpacity
                              onPress={() => setEditingName({
                                locationId: location.id,
                                type: 'evening',
                                name: prefs?.eveningReportName || 'Evening Report'
                              })}
                            >
                              <View style={styles.editableNameContainer}>
                                <Text style={styles.alertName}>{prefs?.eveningReportName || 'Evening Report'}</Text>
                                <Ionicons name="pencil-outline" size={14} color="#6b7280" style={styles.editIcon} />
                              </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => {
                                const time = getCurrentTime(location.id, 'evening');
                                setTempTime(time);
                                setShowTimePicker({ locationId: location.id, type: 'evening' });
                              }}
                              style={styles.timeButton}
                            >
                              <Text style={styles.alertDescription}>
                                Daily summary at {formatTime(prefs?.eveningReportTime || '18:00')}
                              </Text>
                              <Ionicons name="time-outline" size={14} color="#3b82f6" />
                            </TouchableOpacity>
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

        {/* Time Picker Modal */}
        {showTimePicker && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={true}
            onRequestClose={() => setShowTimePicker(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => setShowTimePicker(null)}
                    style={styles.modalButton}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>
                    {showTimePicker.type === 'morning' ? 'Morning' : 'Evening'} Report Time
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      updateTime(showTimePicker.locationId, showTimePicker.type, tempTime);
                    }}
                    style={styles.modalButton}
                  >
                    <Text style={[styles.modalButtonText, styles.saveButton]}>Save</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.timePickerContainer}>
                  <Text style={styles.timeDisplay}>
                    {tempTime.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </Text>
                  <View style={styles.timeControls}>
                    <TouchableOpacity
                      style={styles.timeControlButton}
                      onPress={() => {
                        const newTime = new Date(tempTime);
                        newTime.setHours(newTime.getHours() - 1);
                        setTempTime(newTime);
                      }}
                    >
                      <Text style={styles.timeButtonText}>-1h</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.timeControlButton}
                      onPress={() => {
                        const newTime = new Date(tempTime);
                        newTime.setMinutes(newTime.getMinutes() - 15);
                        setTempTime(newTime);
                      }}
                    >
                      <Text style={styles.timeButtonText}>-15m</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.timeControlButton}
                      onPress={() => {
                        const newTime = new Date(tempTime);
                        newTime.setMinutes(newTime.getMinutes() + 15);
                        setTempTime(newTime);
                      }}
                    >
                      <Text style={styles.timeButtonText}>+15m</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.timeControlButton}
                      onPress={() => {
                        const newTime = new Date(tempTime);
                        newTime.setHours(newTime.getHours() + 1);
                        setTempTime(newTime);
                      }}
                    >
                      <Text style={styles.timeButtonText}>+1h</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Edit Alert Name Modal */}
        {editingName && (
          <Modal
            transparent
            visible={!!editingName}
            animationType="fade"
            onRequestClose={() => setEditingName(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.editNameModal}>
                <Text style={styles.editNameTitle}>Edit Alert Name</Text>
                <TextInput
                  style={styles.nameInput}
                  value={editingName.name}
                  onChangeText={(text) => setEditingName({ ...editingName, name: text })}
                  placeholder={editingName.type === 'morning' ? 'Morning Report' : 'Evening Report'}
                  placeholderTextColor="#9ca3af"
                  autoFocus
                  maxLength={50}
                />
                <View style={styles.editNameButtons}>
                  <TouchableOpacity
                    style={[styles.editNameButton, styles.cancelButton]}
                    onPress={() => setEditingName(null)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editNameButton, styles.saveButton]}
                    onPress={() => updateAlertName(editingName.locationId, editingName.type, editingName.name)}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
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
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 350,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  saveButton: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  timePickerContainer: {
    alignItems: 'center',
    padding: 20,
  },
  timeDisplay: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  timeControls: {
    flexDirection: 'row',
    gap: 12,
  },
  timeControlButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
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
  editableNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editIcon: {
    marginLeft: 4,
  },
  editNameModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  editNameTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    marginBottom: 20,
  },
  editNameButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editNameButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});