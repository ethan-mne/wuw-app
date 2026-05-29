import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

import { isApnsDeviceToken } from './fcmToken';

/** Must match FCM `android.notification.channelId` on the server. */
export const DRAW_REMINDER_CHANNEL_ID = 'draw_reminders';

let setupDone = false;

/** Set by persistent registration listener (iOS). */
let cachedApnsDeviceToken: string | null = null;
let lastPushRegistrationError: string | null = null;
let iosRegistrationListenersInstalled = false;

export function getCachedApnsDeviceToken(): string | null {
  return cachedApnsDeviceToken;
}

export function getLastPushRegistrationError(): string | null {
  return lastPushRegistrationError;
}

async function installIosRegistrationListeners(): Promise<void> {
  if (iosRegistrationListenersInstalled || Capacitor.getPlatform() !== 'ios') {
    return;
  }
  iosRegistrationListenersInstalled = true;

  await PushNotifications.addListener('registration', (ev) => {
    const value = ev.value?.trim() ?? '';
    if (isApnsDeviceToken(value)) {
      cachedApnsDeviceToken = value;
      lastPushRegistrationError = null;
      console.info('[wuw-push] cached APNs device token');
    }
  });

  await PushNotifications.addListener('registrationError', (err) => {
    const msg =
      typeof err === 'object' && err !== null && 'error' in err
        ? String((err as { error?: string }).error)
        : String(err);
    lastPushRegistrationError = msg || 'registrationError';
    console.warn('[wuw-push] registrationError', lastPushRegistrationError);
  });
}

/**
 * Android 8+ notification channel + listeners so FCM messages surface in the tray
 * (including MIUI / foreground handling via Capacitor).
 * iOS: cache APNs token from the first `registration` event (needed for FCM + debug).
 */
export async function setupPushNotificationHandlers(): Promise<void> {
  if (!Capacitor.isNativePlatform() || setupDone) {
    return;
  }
  setupDone = true;

  await installIosRegistrationListeners();

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

  if (Capacitor.getPlatform() === 'ios') {
    try {
      const perm = await PushNotifications.checkPermissions();
      if (perm.receive === 'granted') {
        void PushNotifications.register();
      }
    } catch (error) {
      console.warn('[wuw-push] early iOS register failed', error);
    }
  }
}
