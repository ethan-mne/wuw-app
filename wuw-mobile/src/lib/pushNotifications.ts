import { FCM } from '@capacitor-community/fcm';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

import { isLikelyFcmRegistrationToken } from './fcmToken';
import { getStoredPushDeviceToken, setStoredPushDeviceToken } from './pushStorage';
import { registerPushTokenWithServer, unregisterPushTokenWithServer } from '../services/pushDeviceApi';

export type PushReceivePermission =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'prompt-with-rationale';

/** True when we should show the in-app soft-ask before calling the OS dialog. */
export function shouldShowPushPermissionPrompt(receive: PushReceivePermission | null): boolean {
  return receive === 'prompt' || receive === 'prompt-with-rationale';
}

export function isNativePushPlatform(): boolean {
  return Capacitor.isNativePlatform();
}

const PUSH_PERMISSION_EVENT = 'wuw-push-permission';

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
  // iOS notDetermined / unknown — treat as prompt so the soft-ask can run.
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

/**
 * Register with the OS, then read the FCM token (not the APNs token from `registration` on iOS).
 */
async function registerForFcmToken(): Promise<string | null> {
  try {
    await PushNotifications.register();
    const { token } = await FCM.getToken();
    if (!token?.trim() || !isLikelyFcmRegistrationToken(token)) {
      return null;
    }
    return token.trim();
  } catch {
    return null;
  }
}

async function persistTokenOnServer(token: string): Promise<void> {
  if (!isLikelyFcmRegistrationToken(token)) {
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
  if (shouldShowPushPermissionPrompt(receive)) {
    const perm = await PushNotifications.requestPermissions();
    receive = normalizeReceivePermission(perm.receive);
  }

  if (receive !== 'granted') {
    return false;
  }

  const token = await registerForFcmToken();
  if (!token) {
    return false;
  }

  await persistTokenOnServer(token);
  notifyPushPermissionChanged();
  return true;
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
    return requestPushPermissionAndRegister();
  }

  if (receive === 'denied') {
    openNotificationSettings();
    return false;
  }

  if (receive === 'granted') {
    await syncPushTokenIfPermitted();
    notifyPushPermissionChanged();
    return true;
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
