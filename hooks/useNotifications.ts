import { useEffect } from 'react';
import { 
  initializeNotificationListeners, 
  requestNotificationPermissions,
  sendTestNotification 
} from '../lib/services/notification-scheduler';

export const useNotifications = () => {
  useEffect(() => {
    // Initialize notification permissions and listeners
    const setup = async () => {
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        console.log('✅ Notification permissions granted');
        // Initialize listeners
        const cleanup = initializeNotificationListeners();
        return cleanup;
      } else {
        console.warn('❌ Notification permissions denied');
      }
    };

    const cleanup = setup();
    
    // Cleanup function
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
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