import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch, Alert, Modal, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { fonts } from '../../lib/fonts';
import { useAuthStore } from '../../store/auth';
import { colors } from '@/lib/colors/theme';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { useLocationStore } from '../../store/location';
import { getScheduledNotifications, sendTestNotification } from '../../lib/services/notification-scheduler';
import { useSubscriptionStore } from '../../store/subscription';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile, signOut, updateProfile } = useAuthStore();
  const { fetchUserLocations, locations } = useLocationStore();
  const { hasActiveSubscription, hasPremiumAccess, currentSubscription, restorePurchases } = useSubscriptionStore();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [weatherSourceModalVisible, setWeatherSourceModalVisible] = React.useState(false);
  const [isUpdatingSource, setIsUpdatingSource] = React.useState(false);
  const [scheduledNotifications, setScheduledNotifications] = React.useState<any[]>([]);
  
  // Type for weather sources - matches the Profile interface
  type WeatherSourceType = 'openweather' | 'microsoft' | 'google' | 'waqi' | 'purpleair' | 'airnow';
  
  const [selectedWeatherSource, setSelectedWeatherSource] = React.useState<WeatherSourceType>(
    profile?.weather_source || 'microsoft'
  );

  // Update selected source when profile changes
  React.useEffect(() => {
    if (profile?.weather_source) {
      setSelectedWeatherSource(profile.weather_source);
    }
  }, [profile?.weather_source]);

  // Load scheduled notifications on mount
  React.useEffect(() => {
    loadScheduledNotifications();
  }, []);

  const loadScheduledNotifications = async () => {
    const notifications = await getScheduledNotifications();
    setScheduledNotifications(notifications);
  };

  // Weather source configuration
  // Order by most comprehensive to least comprehensive data coverage
  const weatherSourceOptions = [
    { value: 'microsoft', label: 'Microsoft Azure', icon: 'cloud-outline' },      // Most comprehensive
    { value: 'google', label: 'Google', icon: 'logo-google' },                    // Good AQI + health
    { value: 'waqi', label: 'World AQI', icon: 'globe-outline' },                 // Global AQI coverage
    { value: 'purpleair', label: 'PurpleAir', icon: 'analytics-outline' },        // Hyperlocal sensors
    { value: 'airnow', label: 'AirNow (EPA)', icon: 'flag-outline' },            // US EPA official
    { value: 'openweather', label: 'OpenWeather', icon: 'partly-sunny-outline' }, // Weather-focused
  ];

  const handleWeatherSourceChange = async (source: WeatherSourceType) => {
    try {
      setIsUpdatingSource(true);
      setSelectedWeatherSource(source);
      
      // Update the profile with new weather source
      await updateProfile({ weather_source: source });
      
      // Close the modal immediately for better UX
      setWeatherSourceModalVisible(false);
      
      // Trigger a refresh of all location data with new source
      // This will cause the home screen to re-fetch data using the new source
      await fetchUserLocations();
      
      // Navigate to home tab to show refreshed data
      router.replace('/(tabs)/');
      
      Alert.alert('Success', 'Weather source updated and data refreshed');
    } catch (error) {
      Alert.alert('Error', 'Failed to update weather source');
      console.error('Error updating weather source:', error);
    } finally {
      setIsUpdatingSource(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/sign-in');
          },
        },
      ]
    );
  };

  const handleAboutPress = async () => {
    const url = 'https://www.nodaste.com';
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Unable to open link');
    }
  };

  const handleTermsPress = async () => {
    const url = 'https://www.nodaste.com/aqbuddy/terms-of-service';
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Unable to open link');
    }
  };

  const handlePrivacyPress = async () => {
    const url = 'https://www.nodaste.com/aqbuddy/privacy-policy';
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Unable to open link');
    }
  };

  const handleSupportPress = async () => {
    const email = 'mailto:support@nodaste.com?subject=AQBuddy Support Request';
    const canOpen = await Linking.canOpenURL(email);
    if (canOpen) {
      await Linking.openURL(email);
    } else {
      Alert.alert('Error', 'Unable to open email client');
    }
  };

  const handleManageSubscription = async () => {
    const url = 'https://apps.apple.com/account/subscriptions';
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Unable to open subscription management');
    }
  };

  const handleRestorePurchases = async () => {
    try {
      await restorePurchases();
      Alert.alert('Success', 'Purchases restored successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases');
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.content}>
          {/* Profile Section */}
          <Card>
            <Text style={styles.sectionTitle}>Profile</Text>
            <View style={styles.profileInfo}>
              <View style={styles.profileIcon}>
                <Ionicons name="person-circle-outline" size={48} color="#491124" />
              </View>
              <View style={styles.profileText}>
                <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
              </View>
            </View>
          </Card>

          {/* Preferences */}
          <Card>
            <Text style={styles.sectionTitle}>Preferences</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={20} color="#491124" />
                <Text style={styles.settingLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#d1d5db', true: '#49112466' }}
                thumbColor={notificationsEnabled ? '#491124' : '#f3f4f6'}
              />
            </View>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setWeatherSourceModalVisible(true)}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="cloud-outline" size={20} color="#491124" />
                <Text style={styles.settingLabel}>Weather Source</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>
                  {weatherSourceOptions.find(opt => opt.value === selectedWeatherSource)?.label || 'Microsoft Azure'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </View>
            </TouchableOpacity>

          </Card>

          {/* Subscription */}
          <Card>
            <Text style={styles.sectionTitle}>Subscription</Text>

            <View style={styles.subscriptionInfo}>
              <View style={styles.subscriptionStatus}>
                <View style={styles.subscriptionStatusLeft}>
                  <Ionicons
                    name={hasActiveSubscription || hasPremiumAccess ? "checkmark-circle" : "close-circle"}
                    size={24}
                    color={hasActiveSubscription || hasPremiumAccess ? "#10b981" : "#ef4444"}
                  />
                  <View style={styles.subscriptionStatusText}>
                    <Text style={styles.subscriptionStatusTitle}>
                      {hasActiveSubscription || hasPremiumAccess ? "Active" : "Inactive"}
                    </Text>
                    {hasPremiumAccess && (
                      <Text style={styles.subscriptionStatusSubtitle}>Premium Access</Text>
                    )}
                    {hasActiveSubscription && currentSubscription && (
                      <Text style={styles.subscriptionStatusSubtitle}>
                        {currentSubscription.product_id === 'AQ_Buddy_Monthly_Subscription' ? 'Monthly Plan' : 'Annual Plan'}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {currentSubscription?.expiresAt && (
                <View style={styles.subscriptionDetail}>
                  <Text style={styles.subscriptionDetailLabel}>Expires</Text>
                  <Text style={styles.subscriptionDetailValue}>
                    {new Date(currentSubscription.expiresAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>

            {(hasActiveSubscription || hasPremiumAccess) && (
              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleManageSubscription}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="settings-outline" size={20} color="#491124" />
                  <Text style={styles.settingLabel}>Manage Subscription</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleRestorePurchases}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="refresh-outline" size={20} color="#491124" />
                <Text style={styles.settingLabel}>Restore Purchases</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </Card>

          {/* About */}
          <Card>
            <Text style={styles.sectionTitle}>About</Text>
            
            <TouchableOpacity style={styles.linkItem} onPress={handleAboutPress}>
              <Ionicons name="information-circle-outline" size={20} color="#491124" />
              <Text style={styles.linkText}>About AQBuddy &amp; Nodaste</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkItem} onPress={handleTermsPress}>
              <Ionicons name="document-text-outline" size={20} color="#491124" />
              <Text style={styles.linkText}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkItem} onPress={handlePrivacyPress}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#491124" />
              <Text style={styles.linkText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkItem} onPress={handleSupportPress}>
              <Ionicons name="help-circle-outline" size={20} color="#491124" />
              <Text style={styles.linkText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </Card>


          {/* Account Actions */}
          <Card>
            <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.dangerButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </Card>

          {/* Version Info */}
          <View style={styles.versionInfo}>
            <Text style={styles.versionText}>AQBuddy v1.0.0</Text>
            <Text style={styles.versionSubtext}>Made with ❤️ by Nodaste</Text>
          </View>
        </View>
        </ScrollView>

        {/* Weather Source Selection Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={weatherSourceModalVisible}
          onRequestClose={() => setWeatherSourceModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Weather Source</Text>
                <TouchableOpacity
                  onPress={() => setWeatherSourceModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                {isUpdatingSource ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#491124" />
                    <Text style={styles.loadingText}>Updating weather source...</Text>
                  </View>
                ) : (
                  weatherSourceOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.weatherOption,
                        selectedWeatherSource === option.value && styles.weatherOptionSelected
                      ]}
                      onPress={() => handleWeatherSourceChange(option.value as WeatherSourceType)}
                      disabled={isUpdatingSource}
                    >
                      <View style={styles.weatherOptionLeft}>
                        <Ionicons 
                          name={option.icon as any} 
                          size={24} 
                          color={selectedWeatherSource === option.value ? '#491124' : '#6b7280'} 
                        />
                        <Text style={[
                          styles.weatherOptionText,
                          selectedWeatherSource === option.value && styles.weatherOptionTextSelected
                        ]}>
                          {option.label}
                        </Text>
                      </View>
                      {selectedWeatherSource === option.value && (
                        <Ionicons name="checkmark-circle" size={24} color="#491124" />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </View>
              
              <View style={styles.modalFooter}>
                <Text style={styles.modalFooterText}>
                  Choose your preferred weather data provider. This will affect all weather-related information in the app.
                </Text>
              </View>
            </View>
          </View>
        </Modal>
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
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    ...fonts.headline.h5,
    color: '#111827',
    marginBottom: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    marginRight: 16,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    ...fonts.headline.h5,
    color: '#111827',
    marginBottom: 2,
  },
  profileEmail: {
    ...fonts.body.small,
    color: '#6b7280',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    ...fonts.body.regular,
    color: '#111827',
    marginLeft: 12,
  },
  settingValue: {
    ...fonts.body.regular,
    color: '#6b7280',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  linkText: {
    ...fonts.body.regular,
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  dangerButtonText: {
    ...fonts.body.regular,
    fontFamily: fonts.weight.semibold,
    color: '#ef4444',
    marginLeft: 8,
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  versionText: {
    ...fonts.body.small,
    color: '#9ca3af',
    marginBottom: 4,
  },
  versionSubtext: {
    ...fonts.body.tiny,
    color: '#9ca3af',
    paddingBottom: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    ...fonts.headline.h4,
    color: '#111827',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  weatherOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
  },
  weatherOptionSelected: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#491124',
  },
  weatherOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weatherOptionText: {
    ...fonts.body.regular,
    color: '#374151',
  },
  weatherOptionTextSelected: {
    color: '#491124',
    fontFamily: fonts.weight.semibold,
  },
  modalFooter: {
    paddingHorizontal: 20,
  },
  modalFooterText: {
    ...fonts.body.small,
    color: '#6b7280',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...fonts.body.regular,
    color: '#6b7280',
    marginTop: 12,
  },
  notificationList: {
    paddingLeft: 32,
    paddingTop: 8,
    paddingBottom: 8,
  },
  notificationListTitle: {
    ...fonts.body.small,
    color: '#6b7280',
    marginBottom: 4,
  },
  notificationItem: {
    ...fonts.body.tiny,
    color: '#9ca3af',
    marginLeft: 8,
    marginVertical: 2,
  },
  subscriptionInfo: {
    marginBottom: 16,
  },
  subscriptionStatus: {
    paddingVertical:4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  subscriptionStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subscriptionStatusText: {
    flex: 1,
  },
  subscriptionStatusTitle: {
    fontSize: fonts.headline.h5.fontSize,
    fontFamily: fonts.headline.h5.fontFamily,
    fontWeight: fonts.headline.h5.fontWeight as any,
    lineHeight: 22,
    color: '#111827',
  },
  subscriptionStatusSubtitle: {
    fontSize: fonts.body.small.fontSize,
    fontFamily: fonts.body.small.fontFamily,
    lineHeight: 16,
    color: '#6b7280',
  },
  subscriptionDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  subscriptionDetailLabel: {
    fontSize: fonts.body.regular.fontSize,
    fontFamily: fonts.body.regular.fontFamily,
    fontWeight: fonts.body.regular.fontWeight as any,
    lineHeight: fonts.body.regular.lineHeight,
    color: '#6b7280',
  },
  subscriptionDetailValue: {
    fontSize: fonts.body.regular.fontSize,
    fontWeight: fonts.body.regular.fontWeight as any,
    lineHeight: fonts.body.regular.lineHeight,
    color: '#111827',
    fontFamily: fonts.weight.semibold,
  },
});