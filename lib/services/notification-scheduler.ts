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
    
    // Schedule daily at specified time
    const trigger: Notifications.DailyTriggerInput = {
      hour: hours,
      minute: minutes,
      repeats: true,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌅 Morning Air Quality Report',
        body: 'Generating your personalized air quality summary...',
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
    
    // Schedule daily at specified time
    const trigger: Notifications.DailyTriggerInput = {
      hour: hours,
      minute: minutes,
      repeats: true,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌙 Evening Air Quality Summary',
        body: 'Your daily air quality report is ready...',
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

  // Only process notifications that are scheduled and not already generated
  if ((data?.type === 'morning-report' || data?.type === 'evening-report') &&
      data?.scheduled === true &&
      data?.generated !== true) {
    const locationId = data.locationId as string;

    try {
      // Get fresh location data
      const locationData = await getLocationDataForNotification(locationId);
      if (!locationData) return;

      // Generate AI alert
      const alertMessage = data.type === 'morning-report'
        ? await generateMorningAlert(locationData)
        : await generateEveningAlert(locationData);

      // Update the notification with AI-generated content
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.type === 'morning-report'
            ? `🌅 ${locationData.location.name}`
            : `🌙 ${locationData.location.name}`,
          body: alertMessage,
          data: {
            type: data.type,
            locationId,
            generated: true  // Mark as generated to prevent loops
          },
        },
        trigger: null, // Show immediately
      });

    } catch (error) {
      console.error('Failed to generate AI alert for notification:', error);
      // Keep the default notification if AI generation fails
    }
  }
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
export async function sendTestNotification(type: 'morning' | 'evening', locationName: string): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: type === 'morning' 
          ? `🌅 Test Morning Report - ${locationName}`
          : `🌙 Test Evening Report - ${locationName}`,
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