import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';

import { handleNotificationOpenPayload } from './notificationNavigation';
import { hasOneSignalMobileConfig } from './oneSignal';
import { isApnsDeviceToken } from './pushToken';

/** Must match FCM `android.notification.channelId` on the server. */
export const DRAW_REMINDER_CHANNEL_ID = 'draw_reminders';

let setupDone = false;

/** Set by persistent registration listener (iOS). */
let cachedApnsDeviceToken: string | null = null;
const APNS_STORAGE_KEY = 'wuw_cached_apns_device_token';
let lastPushRegistrationError: string | null = null;
let iosRegistrationListenersInstalled = false;

function readPersistedApnsToken(): string | null {
  try {
    const stored = localStorage.getItem(APNS_STORAGE_KEY)?.trim() ?? '';
    return isApnsDeviceToken(stored) ? stored : null;
  } catch {
    return null;
  }
}

function persistApnsToken(value: string): void {
  try {
    localStorage.setItem(APNS_STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

export function getCachedApnsDeviceToken(): string | null {
  if (cachedApnsDeviceToken && isApnsDeviceToken(cachedApnsDeviceToken)) {
    return cachedApnsDeviceToken;
  }
  const persisted = readPersistedApnsToken();
  if (persisted) {
    cachedApnsDeviceToken = persisted;
  }
  return persisted;
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
      persistApnsToken(value);
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
 * iOS: cache APNs token from the first `registration` event (sent directly to backend).
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
    handleNotificationOpenPayload(action.notification.data);
  });

  try {
    await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      handleNotificationOpenPayload(action.notification.extra ?? action.notification);
    });
  } catch (error) {
    console.warn('[wuw-push] local notification tap listener failed', error);
  }

  if (Capacitor.getPlatform() === 'ios' && !hasOneSignalMobileConfig()) {
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
