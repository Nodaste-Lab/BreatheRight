import { useEffect } from 'react';
import {
  initializeNotificationListeners,
  requestNotificationPermissions,
  sendTestNotification
} from '../lib/services/notification-scheduler';
import {
  registerBackgroundNotificationTask
} from '../lib/services/notification-background';

export const useNotifications = () => {
  useEffect(() => {
    // Initialize notification permissions and listeners
    const setup = async () => {
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        console.log('✅ Notification permissions granted');

        // Register background task for notification generation
        await registerBackgroundNotificationTask();

        // Enable notification listeners for production build
        const cleanup = initializeNotificationListeners();
        return cleanup;
      } else {
        console.warn('❌ Notification permissions denied');
      }
    };

    setup().then(cleanupFn => {
      // Store cleanup function if returned
      if (cleanupFn && typeof cleanupFn === 'function') {
        return () => cleanupFn();
      }
    });

    // Return empty cleanup by default
    return () => {};
  }, []);

  // Function to send test notifications
  const testMorningReport = async (locationName: string) => {
    await sendTestNotification('morning', locationName);
  };

  const testEveningReport = async (locationName: string) => {
    await sendTestNotification('evening', locationName);
  };

  return {
    testMorningReport,
    testEveningReport,
  };
};