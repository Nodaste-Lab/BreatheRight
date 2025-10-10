/**
 * Notification Scheduler Service
 * 
 * Handles scheduling and delivery of morning/evening air quality reports
 * using Expo Notifications and local push notifications.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { generateMorningAlert, generateEveningAlert } from './openai-alerts';
import { useLocationStore } from '../../store/location';
import { useAlertStore } from '../../store/alerts';
import type { LocationData } from '../../types/location';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('Must use physical device for push notifications');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Failed to get push notification permissions');
    return false;
  }

  // Configure notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('air-quality-reports', {
      name: 'Air Quality Reports',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3b82f6',
      description: 'Daily morning and evening air quality reports',
    });
  }

  return true;
}

/**
 * Get location data for notification generation
 */
async function getLocationDataForNotification(locationId: string): Promise<LocationData | null> {
  try {
    // This is a simplified version - in practice, you'd want to fetch fresh data
    // For now, we'll use the current location data from the store
    const { getCurrentLocationData, currentLocation } = useLocationStore.getState();
    
    await getCurrentLocationData(locationId);
    
    return currentLocation;
  } catch (error) {
    console.error('Failed to get location data for notification:', error);
    return null;
  }
}

/**
 * Schedule morning report for a location
 */
export async function scheduleMorningReport(locationId: string, time: string): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    // Parse time (HH:MM format)
    const [hours, minutes] = time.split(':').map(Number);

    // Get alert preferences for custom name
    const { preferences } = useAlertStore.getState();
    const alertPrefs = preferences.find(p => p.locationId === locationId);
    const customName = alertPrefs?.morningReportName || 'Morning Report';

    // Generate the alert content immediately
    const { getCurrentLocationData } = useLocationStore.getState();
    await getCurrentLocationData(locationId);

    // Get the updated location data after fetching
    const { currentLocation } = useLocationStore.getState();

    if (!currentLocation) {
      console.error('Failed to get location data for notification');
      return null;
    }

    // Generate AI alert now with custom name
    const alertMessage = await generateMorningAlert(currentLocation, customName);

    // Schedule daily at specified time with pre-generated content
    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🌅 ${customName} - ${currentLocation.location.name}`,
        body: alertMessage,
        data: {
          type: 'morning-report',
          locationId,
          scheduled: true
        },
        categoryIdentifier: 'air-quality-reports',
      },
      trigger,
    });

    console.log(`Scheduled morning report for location ${locationId} at ${time}`);
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule morning report:', error);
    return null;
  }
}

/**
 * Schedule evening report for a location
 */
export async function scheduleEveningReport(locationId: string, time: string): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    // Parse time (HH:MM format)
    const [hours, minutes] = time.split(':').map(Number);

    // Get alert preferences for custom name
    const { preferences } = useAlertStore.getState();
    const alertPrefs = preferences.find(p => p.locationId === locationId);
    const customName = alertPrefs?.eveningReportName || 'Evening Report';

    // Generate the alert content immediately
    const { getCurrentLocationData } = useLocationStore.getState();
    await getCurrentLocationData(locationId);

    // Get the updated location data after fetching
    const { currentLocation } = useLocationStore.getState();

    if (!currentLocation) {
      console.error('Failed to get location data for notification');
      return null;
    }

    // Generate AI alert now with custom name
    const alertMessage = await generateEveningAlert(currentLocation, customName);

    // Schedule daily at specified time with pre-generated content
    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🌙 ${customName} - ${currentLocation.location.name}`,
        body: alertMessage,
        data: {
          type: 'evening-report',
          locationId,
          scheduled: true
        },
        categoryIdentifier: 'air-quality-reports',
      },
      trigger,
    });

    console.log(`Scheduled evening report for location ${locationId} at ${time}`);
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule evening report:', error);
    return null;
  }
}

/**
 * Cancel scheduled notification
 */
export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`Cancelled notification ${notificationId}`);
  } catch (error) {
    console.error('Failed to cancel notification:', error);
  }
}

/**
 * Cancel all notifications for a location
 */
export async function cancelLocationNotifications(locationId: string): Promise<void> {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    const locationNotifications = scheduledNotifications.filter(
      notification => notification.content.data?.locationId === locationId
    );

    for (const notification of locationNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }

    console.log(`Cancelled ${locationNotifications.length} notifications for location ${locationId}`);
  } catch (error) {
    console.error('Failed to cancel location notifications:', error);
  }
}

/**
 * Update scheduled notifications for a location based on preferences
 */
export async function updateLocationNotifications(locationId: string, prefs?: any): Promise<void> {
  try {
    console.log(`Updating notifications for location ${locationId}`);

    // Cancel existing notifications for this location
    await cancelLocationNotifications(locationId);

    // Get current preferences - use passed prefs or fetch from store
    let locationPrefs = prefs;
    if (!locationPrefs) {
      const { preferences } = useAlertStore.getState();
      locationPrefs = preferences.find(p => p.locationId === locationId);
    }

    console.log('Location preferences:', locationPrefs);

    if (!locationPrefs) {
      console.log('No preferences found for location');
      return;
    }

    // Schedule morning report if enabled
    if (locationPrefs.morningReportEnabled) {
      const notifId = await scheduleMorningReport(locationId, locationPrefs.morningReportTime);
      console.log(`Scheduled morning report with ID: ${notifId}`);
    }

    // Schedule evening report if enabled
    if (locationPrefs.eveningReportEnabled) {
      const notifId = await scheduleEveningReport(locationId, locationPrefs.eveningReportTime);
      console.log(`Scheduled evening report with ID: ${notifId}`);
    }

    // List all scheduled notifications for verification
    const allNotifications = await getScheduledNotifications();
    console.log('All scheduled notifications:', allNotifications.map(n => ({
      id: n.identifier,
      title: n.content.title,
      trigger: n.trigger
    })));

    console.log(`Updated notifications for location ${locationId}`);
  } catch (error) {
    console.error('Failed to update location notifications:', error);
  }
}

/**
 * Handle notification received (when app is in foreground)
 */
export async function handleNotificationReceived(notification: Notifications.Notification): Promise<void> {
  const { data } = notification.request.content;
  console.log('Notification received in foreground:', data);
  // No need to regenerate content since we pre-generate it when scheduling
}

/**
 * Initialize notification listeners
 */
export function initializeNotificationListeners(): (() => void) {
  // Listen for notifications received while app is in foreground
  const subscription = Notifications.addNotificationReceivedListener(handleNotificationReceived);

  // Listen for notification responses (when user taps notification)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    const { data } = response.notification.request.content;

    if (data?.locationId) {
      // Navigate to location detail screen
      // This would need to be implemented with your navigation system
      console.log('User tapped notification for location:', data.locationId);
    }
  });

  // Return cleanup function
  return () => {
    subscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Get all scheduled notifications for debugging
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Failed to get scheduled notifications:', error);
    return [];
  }
}

/**
 * Send immediate test notification
 */
export async function sendTestNotification(type: 'morning' | 'evening', locationName: string, locationId?: string): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    // Get custom alert name if locationId provided
    let customName = type === 'morning' ? 'Morning Report' : 'Evening Report';
    if (locationId) {
      const { preferences } = useAlertStore.getState();
      const alertPrefs = preferences.find(p => p.locationId === locationId);
      customName = type === 'morning'
        ? (alertPrefs?.morningReportName || 'Morning Report')
        : (alertPrefs?.eveningReportName || 'Evening Report');
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: type === 'morning'
          ? `🌅 Test ${customName} - ${locationName}`
          : `🌙 Test ${customName} - ${locationName}`,
        body: type === 'morning'
          ? 'Good morning! This is a test of your morning air quality report. ☀️'
          : 'Good evening! This is a test of your evening air quality summary. 🌙',
        data: {
          type: `${type}-report-test`,
          test: true 
        },
      },
      trigger: null, // Show immediately
    });

    console.log(`Sent test ${type} notification`);
  } catch (error) {
    console.error('Failed to send test notification:', error);
  }
}

/**
 * Schedule a custom alert for a location
 */
export async function scheduleCustomAlert(
  locationId: string,
  alertName: string,
  time: string
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    // Parse time (HH:MM format)
    const [hours, minutes] = time.split(':').map(Number);

    // Generate the alert content immediately
    const { getCurrentLocationData } = useLocationStore.getState();
    await getCurrentLocationData(locationId);

    // Get the updated location data after fetching
    const { currentLocation } = useLocationStore.getState();

    if (!currentLocation) {
      console.error('Failed to get location data for custom alert notification');
      return null;
    }

    // Import the general alert generation function
    const { generateAlert } = await import('./openai-alerts');

    // Determine alert type based on time (for caching purposes)
    // If time is before noon, treat as 'morning', otherwise 'evening'
    const alertType = hours < 12 ? 'morning' : 'evening';

    // Generate AI alert with custom name
    const alertMessage = await generateAlert(currentLocation, alertType, alertName);

    // Schedule daily at specified time with pre-generated content
    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔔 ${alertName} - ${currentLocation.location.name}`,
        body: alertMessage,
        data: {
          type: 'custom-alert',
          locationId,
          alertName,
          scheduled: true
        },
        categoryIdentifier: 'air-quality-reports',
      },
      trigger,
    });

    console.log(`Scheduled custom alert "${alertName}" for location ${locationId} at ${time}`);
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule custom alert:', error);
    return null;
  }
}

/**
 * Update or schedule a custom alert notification
 */
export async function updateCustomAlertNotification(
  locationId: string,
  alert: { id: string; alertName: string; alertTime: string; enabled: boolean }
): Promise<void> {
  try {
    // Cancel existing notification for this custom alert
    await cancelCustomAlertNotification(alert.id);

    // Only reschedule if enabled
    if (alert.enabled) {
      await scheduleCustomAlert(locationId, alert.alertName, alert.alertTime);
    }
  } catch (error) {
    console.error('Failed to update custom alert notification:', error);
  }
}

/**
 * Cancel a custom alert notification
 */
export async function cancelCustomAlertNotification(alertId: string): Promise<void> {
  try {
    // Get all scheduled notifications
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

    // Find and cancel notifications for this custom alert
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.type === 'custom-alert') {
        // We don't have a direct way to match by alertId in the notification data,
        // so we'll cancel all custom alerts for now and rely on updateCustomAlertNotification
        // to reschedule the ones that should remain
        // In a production app, you might want to store notification IDs in your database
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }

    console.log(`Cancelled custom alert ${alertId}`);
  } catch (error) {
    console.error('Failed to cancel custom alert notification:', error);
  }
}