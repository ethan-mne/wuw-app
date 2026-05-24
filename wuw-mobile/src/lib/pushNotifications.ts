import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

import { getStoredPushDeviceToken, setStoredPushDeviceToken } from './pushStorage';
import { registerPushTokenWithServer, unregisterPushTokenWithServer } from '../services/pushDeviceApi';

export type PushReceivePermission = 'granted' | 'denied' | 'prompt';

export function isNativePushPlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export async function getPushReceivePermission(): Promise<PushReceivePermission | null> {
  if (!isNativePushPlatform()) {
    return null;
  }

  const perm = await PushNotifications.checkPermissions();
  if (perm.receive === 'granted' || perm.receive === 'denied' || perm.receive === 'prompt') {
    return perm.receive;
  }
  return 'prompt';
}

async function registerForFcmToken(): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
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
}

async function persistTokenOnServer(token: string): Promise<void> {
  const platform: 'android' | 'ios' = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
  setStoredPushDeviceToken(token);
  try {
    await registerPushTokenWithServer(token, platform);
  } catch {
    /* non-fatal; user can reopen app */
  }
}

/** If notifications are already allowed, register the FCM token without prompting. */
export async function syncPushTokenIfPermitted(): Promise<void> {
  if (!isNativePushPlatform()) {
    return;
  }

  const receive = await getPushReceivePermission();
  if (receive !== 'granted') {
    return;
  }

  const token = await registerForFcmToken();
  if (!token) {
    return;
  }

  await persistTokenOnServer(token);
}

/**
 * Ask for notification permission (must run from a user gesture on Android) and register the token.
 */
export async function requestPushPermissionAndRegister(): Promise<boolean> {
  if (!isNativePushPlatform()) {
    return false;
  }

  let receive = await getPushReceivePermission();
  if (receive !== 'granted') {
    const perm = await PushNotifications.requestPermissions();
    receive =
      perm.receive === 'granted' || perm.receive === 'denied' || perm.receive === 'prompt'
        ? perm.receive
        : 'denied';
  }

  if (receive !== 'granted') {
    return false;
  }

  const token = await registerForFcmToken();
  if (!token) {
    return false;
  }

  await persistTokenOnServer(token);
  return true;
}

/** @deprecated Prefer syncPushTokenIfPermitted + PushPermissionPrompt for new flows. */
export async function registerPushAfterLogin(): Promise<void> {
  await syncPushTokenIfPermitted();
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

  if (!isNativePushPlatform()) {
    return;
  }

  try {
    await PushNotifications.removeAllListeners();
  } catch {
    /* ignore */
  }
}
