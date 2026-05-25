import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

import { isApnsDeviceToken, isLikelyFcmRegistrationToken } from './fcmToken';
import { getStoredPushDeviceToken, setStoredPushDeviceToken } from './pushStorage';
import { registerPushTokenWithServer, unregisterPushTokenWithServer } from '../services/pushDeviceApi';

export type PushReceivePermission =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'prompt-with-rationale';

export type PushRegisterFailureReason =
  | 'not_native'
  | 'permission_denied'
  | 'no_fcm_token'
  | 'invalid_token_shape'
  | 'not_logged_in'
  | 'server_rejected';

export type PushRegisterResult =
  | { ok: true; tokenPrefix: string }
  | { ok: false; reason: PushRegisterFailureReason; detail?: string };

/** User-facing message when push registration fails after a draw-alert subscribe. */
export function pushRegisterFailureMessage(
  push: Extract<PushRegisterResult, { ok: false }>,
): string {
  if (push.reason === 'permission_denied') {
    return 'Reminder saved. Allow notifications for Winuwatch in your phone settings to receive the push.';
  }
  if (push.reason === 'no_fcm_token' || push.reason === 'invalid_token_shape') {
    return 'Reminder saved. Could not register this device for push — allow notifications and try Remind me again.';
  }
  if (push.reason === 'server_rejected') {
    return push.detail
      ? `Reminder saved. ${push.detail}`
      : 'Reminder saved. Server rejected push registration — try again in a moment.';
  }
  if (push.reason === 'not_logged_in') {
    return 'Reminder saved. Sign in again, then tap Remind me to register this device.';
  }
  return 'Reminder saved. Push notifications require the installed app on a real device.';
}

/** True when we should show the in-app soft-ask before calling the OS dialog. */
export function shouldShowPushPermissionPrompt(receive: PushReceivePermission | null): boolean {
  return receive === 'prompt' || receive === 'prompt-with-rationale';
}

export function isNativePushPlatform(): boolean {
  return Capacitor.isNativePlatform();
}

const PUSH_PERMISSION_EVENT = 'wuw-push-permission';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function notifyPushPermissionChanged(): void {
  try {
    window.dispatchEvent(new Event(PUSH_PERMISSION_EVENT));
  } catch {
    /* ignore */
  }
}

export function subscribePushPermissionChanged(listener: () => void): () => void {
  window.addEventListener(PUSH_PERMISSION_EVENT, listener);
  return () => window.removeEventListener(PUSH_PERMISSION_EVENT, listener);
}

/** Opens the OS screen where the user can allow notifications (after a prior deny). */
export function openNotificationSettings(): void {
  if (!isNativePushPlatform()) {
    return;
  }

  const platform = Capacitor.getPlatform();
  if (platform === 'ios') {
    window.location.href = 'app-settings:';
    return;
  }

  const pkg = 'com.winuwatch.wuwapp';
  window.location.href = `intent:#Intent;action=android.settings.APP_NOTIFICATION_SETTINGS;S:android.provider.extra.APP_PACKAGE,${pkg};end`;
}

function normalizeReceivePermission(value: string): PushReceivePermission {
  if (
    value === 'granted' ||
    value === 'denied' ||
    value === 'prompt' ||
    value === 'prompt-with-rationale'
  ) {
    return value;
  }
  return 'prompt';
}

export async function getPushReceivePermission(): Promise<PushReceivePermission | null> {
  if (!isNativePushPlatform()) {
    return null;
  }

  try {
    const perm = await PushNotifications.checkPermissions();
    return normalizeReceivePermission(perm.receive);
  } catch {
    return 'prompt';
  }
}

async function getFcmPlugin() {
  const { FCM } = await import('@capacitor-community/fcm');
  return FCM;
}

function acceptPushRegistrationValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  // On iOS, Capacitor `registration` is the APNs token — use @capacitor-community/fcm instead.
  if (Capacitor.getPlatform() === 'ios' && isApnsDeviceToken(trimmed)) {
    return false;
  }
  return isLikelyFcmRegistrationToken(trimmed);
}

/** Android often delivers the FCM token via `registration` before FCM.getToken() is ready. */
function listenForFcmRegistrationToken(timeoutMs: number): {
  promise: Promise<string | null>;
  cleanup: () => Promise<void>;
} {
  let handle: PluginListenerHandle | undefined;
  let settled = false;

  const promise = new Promise<string | null>((resolve) => {
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, timeoutMs);

    void PushNotifications.addListener('registration', (ev) => {
      const value = ev.value?.trim() ?? '';
      if (!acceptPushRegistrationValue(value) || settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timer);
      resolve(value);
    }).then((listener) => {
      handle = listener;
    });
  });

  return {
    promise,
    cleanup: async () => {
      await handle?.remove();
    },
  };
}

async function pollFcmPluginForToken(): Promise<string | null> {
  const FCM = await getFcmPlugin();
  try {
    await FCM.setAutoInit({ enabled: true });
  } catch {
    /* optional on some builds */
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    if (attempt > 0) {
      await delay(600 * attempt);
    }

    try {
      const { token } = await FCM.getToken();
      if (token?.trim() && isLikelyFcmRegistrationToken(token)) {
        return token.trim();
      }
    } catch {
      /* retry */
    }

    try {
      const { token } = await FCM.refreshToken();
      if (token?.trim() && isLikelyFcmRegistrationToken(token)) {
        return token.trim();
      }
    } catch {
      /* retry */
    }
  }

  return null;
}

/**
 * Register with the OS, then read the FCM token (not the APNs token from `registration` on iOS).
 * Uses both Capacitor `registration` (reliable on Android) and @capacitor-community/fcm.
 */
async function registerForFcmToken(): Promise<string | null> {
  const { promise: registrationToken, cleanup } = listenForFcmRegistrationToken(12_000);

  try {
    await PushNotifications.register();
    const [fromRegistration, fromFcm] = await Promise.all([
      registrationToken,
      pollFcmPluginForToken(),
    ]);
    return fromRegistration ?? fromFcm;
  } catch {
    return null;
  } finally {
    await cleanup();
  }
}

async function persistTokenOnServer(token: string): Promise<PushRegisterResult> {
  if (!isLikelyFcmRegistrationToken(token)) {
    return { ok: false, reason: 'invalid_token_shape' };
  }

  const platform: 'android' | 'ios' = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
  setStoredPushDeviceToken(token);

  try {
    await registerPushTokenWithServer(token, platform);
    const prefix =
      token.length <= 16 ? token : `${token.slice(0, 8)}…${token.slice(-4)}`;
    return { ok: true, tokenPrefix: prefix };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: 'server_rejected', detail };
  }
}

/** Permission + FCM token + backend upsert (for draw alerts and tests). */
export async function ensurePushRegisteredForAlerts(): Promise<PushRegisterResult> {
  if (!isNativePushPlatform()) {
    return { ok: false, reason: 'not_native' };
  }

  let receive = await getPushReceivePermission();
  if (shouldShowPushPermissionPrompt(receive)) {
    const perm = await PushNotifications.requestPermissions();
    receive = normalizeReceivePermission(perm.receive);
  }

  if (receive !== 'granted') {
    return { ok: false, reason: 'permission_denied' };
  }

  const token = await registerForFcmToken();
  if (!token) {
    return { ok: false, reason: 'no_fcm_token' };
  }

  return persistTokenOnServer(token);
}

/** If notifications are already allowed, register the FCM token without prompting. */
export async function syncPushTokenIfPermitted(): Promise<PushRegisterResult> {
  if (!isNativePushPlatform()) {
    return { ok: false, reason: 'not_native' };
  }

  const receive = await getPushReceivePermission();
  if (receive !== 'granted') {
    return { ok: false, reason: 'permission_denied' };
  }

  const token = await registerForFcmToken();
  if (!token) {
    return { ok: false, reason: 'no_fcm_token' };
  }

  return persistTokenOnServer(token);
}

/**
 * Ask for notification permission (must run from a user gesture on Android) and register the token.
 */
export async function requestPushPermissionAndRegister(): Promise<PushRegisterResult> {
  return ensurePushRegisteredForAlerts();
}

/**
 * User-initiated enable: system prompt when possible, otherwise app notification settings.
 */
export async function enablePushNotifications(): Promise<boolean> {
  if (!isNativePushPlatform()) {
    return false;
  }

  const receive = await getPushReceivePermission();
  if (shouldShowPushPermissionPrompt(receive)) {
    const result = await ensurePushRegisteredForAlerts();
    if (result.ok) {
      notifyPushPermissionChanged();
    }
    return result.ok;
  }

  if (receive === 'denied') {
    openNotificationSettings();
    return false;
  }

  if (receive === 'granted') {
    const result = await syncPushTokenIfPermitted();
    notifyPushPermissionChanged();
    return result.ok;
  }

  return false;
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
