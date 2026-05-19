import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

import { getStoredPushDeviceToken, setStoredPushDeviceToken } from './pushStorage';
import { registerPushTokenWithServer, unregisterPushTokenWithServer } from '../services/pushDeviceApi';

export async function registerPushAfterLogin(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  let perm = await PushNotifications.checkPermissions();
  if (perm.receive !== 'granted') {
    perm = await PushNotifications.requestPermissions();
  }
  if (perm.receive !== 'granted') {
    return;
  }

  const token = await new Promise<string | null>((resolve) => {
    let settled = false;
    const finish = (value: string | null) => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timer);
      resolve(value);
    };

    const timer = window.setTimeout(() => finish(null), 15_000);

    void (async () => {
      try {
        await PushNotifications.addListener('registration', (event) => {
          finish(event.value);
        });
        await PushNotifications.addListener('registrationError', () => {
          finish(null);
        });
        await PushNotifications.register().catch(() => finish(null));
      } catch {
        finish(null);
      }
    })();
  });

  if (!token) {
    return;
  }

  const platform: 'android' | 'ios' = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
  setStoredPushDeviceToken(token);
  try {
    await registerPushTokenWithServer(token, platform);
  } catch {
    /* non-fatal; user can reopen app */
  }
}

export async function unregisterPushDeviceIfAny(): Promise<void> {
  const token = getStoredPushDeviceToken();
  if (token) {
    try {
      await unregisterPushTokenWithServer(token);
    } catch {
      /* best-effort */
    }
    setStoredPushDeviceToken(null);
  }

  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await PushNotifications.removeAllListeners();
  } catch {
    /* ignore */
  }
}
