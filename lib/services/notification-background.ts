/**
 * Background Notification Service
 *
 * Handles pre-generating notification content at scheduled times
 * to ensure alerts work even when app is closed
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { generateMorningAlert, generateEveningAlert } from './openai-alerts';
import { useLocationStore } from '../../store/location';
import { useAlertStore } from '../../store/alerts';

const BACKGROUND_NOTIFICATION_TASK = 'background-notification-task';

/**
 * Register background task for notification generation
 */
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    console.log(`Background task running at ${currentTime}`);

    // Get all alert preferences
    const { preferences } = useAlertStore.getState();

    for (const pref of preferences) {
      // Check if it's time for morning report
      if (pref.morningReportEnabled && isTimeToSend(pref.morningReportTime, currentTime)) {
        await generateAndSendNotification(pref.locationId, 'morning');
      }

      // Check if it's time for evening report
      if (pref.eveningReportEnabled && isTimeToSend(pref.eveningReportTime, currentTime)) {
        await generateAndSendNotification(pref.locationId, 'evening');
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background notification task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Check if current time matches scheduled time (within 5-minute window)
 */
function isTimeToSend(scheduledTime: string, currentTime: string): boolean {
  const [schedHour, schedMin] = scheduledTime.split(':').map(Number);
  const [currHour, currMin] = currentTime.split(':').map(Number);

  // Convert to minutes for easier comparison
  const schedMinutes = schedHour * 60 + schedMin;
  const currMinutes = currHour * 60 + currMin;

  // Check if within 5-minute window
  return Math.abs(schedMinutes - currMinutes) <= 5;
}

/**
 * Generate and send notification with fresh data
 */
async function generateAndSendNotification(locationId: string, type: 'morning' | 'evening'): Promise<void> {
  try {
    // Get fresh location data
    const { getCurrentLocationData, currentLocation } = useLocationStore.getState();
    await getCurrentLocationData(locationId);

    if (!currentLocation) {
      console.error('Failed to get location data for background notification');
      return;
    }

    // Generate AI alert
    const alertMessage = type === 'morning'
      ? await generateMorningAlert(currentLocation)
      : await generateEveningAlert(currentLocation);

    // Send notification immediately
    await Notifications.scheduleNotificationAsync({
      content: {
        title: type === 'morning'
          ? `🌅 ${currentLocation.location.name}`
          : `🌙 ${currentLocation.location.name}`,
        body: alertMessage,
        data: {
          type: `${type}-report`,
          locationId,
          generated: true
        },
        categoryIdentifier: 'air-quality-reports',
      },
      trigger: null, // Show immediately
    });

    console.log(`Sent ${type} notification for ${currentLocation.location.name}`);
  } catch (error) {
    console.error(`Failed to generate ${type} notification:`, error);
  }
}

/**
 * Register background fetch task
 */
export async function registerBackgroundNotificationTask(): Promise<void> {
  try {
    // Register the task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('Background notification task registered');
  } catch (error) {
    console.error('Failed to register background notification task:', error);
  }
}

/**
 * Unregister background fetch task
 */
export async function unregisterBackgroundNotificationTask(): Promise<void> {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    console.log('Background notification task unregistered');
  } catch (error) {
    console.error('Failed to unregister background notification task:', error);
  }
}

/**
 * Check if background task is registered
 */
export async function isBackgroundNotificationTaskRegistered(): Promise<boolean> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
  return isRegistered;
}