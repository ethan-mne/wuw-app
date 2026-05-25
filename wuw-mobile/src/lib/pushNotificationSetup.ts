import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

/** Must match FCM `android.notification.channelId` on the server. */
export const DRAW_REMINDER_CHANNEL_ID = 'draw_reminders';

let setupDone = false;

/**
 * Android 8+ notification channel + listeners so FCM messages surface in the tray
 * (including MIUI / foreground handling via Capacitor).
 */
export async function setupPushNotificationHandlers(): Promise<void> {
  if (!Capacitor.isNativePlatform() || setupDone) {
    return;
  }
  setupDone = true;

  if (Capacitor.getPlatform() === 'android') {
    try {
      await PushNotifications.createChannel({
        id: DRAW_REMINDER_CHANNEL_ID,
        name: 'Draw reminders',
        description: 'Alerts about 10 minutes before live draws',
        importance: 5,
        visibility: 1,
        sound: 'default',
        vibration: true,
        lights: true,
      });
    } catch (error) {
      console.warn('[wuw-push] createChannel failed', error);
    }
  }

  await PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.info('[wuw-push] received (foreground/background)', notification.title, notification.body);
  });

  await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.info('[wuw-push] notification tapped', action.notification.title);
  });
}
