import { Capacitor } from '@capacitor/core';
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

/**
 * iOS only — native FCMPlugin is in CapApp-SPM (Package.swift + FCMPlugin).
 * Android: community FCM native bridge is not available (Capacitor → "FCM.then() not implemented").
 * Web: FCMWeb throws "Not implemented on web" — never call there.
 */
async function getFcmPlugin() {
  if (Capacitor.getPlatform() !== 'ios') {
    return null;
  }
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

/**
 * Android: FCM registration token from PushNotifications `registration` (native FCM).
 * iOS: may also fire here but often returns APNs — still listen before register().
 */
async function createRegistrationTokenWaiter(timeoutMs: number): Promise<{
  promise: Promise<string | null>;
  cleanup: () => Promise<void>;
}> {
  let settled = false;
  let timer = 0;
  let resolveToken: (value: string | null) => void = () => {};

  const promise = new Promise<string | null>((resolve) => {
    resolveToken = resolve;
    timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, timeoutMs);
  });

  const finish = (value: string | null) => {
    if (settled) {
      return;
    }
    settled = true;
    window.clearTimeout(timer);
    resolveToken(value);
  };

  const handle = await PushNotifications.addListener('registration', (ev) => {
    const value = ev.value?.trim() ?? '';
    if (!acceptPushRegistrationValue(value)) {
      return;
    }
    finish(value);
  });

  const errorHandle = await PushNotifications.addListener('registrationError', (err) => {
    console.warn('[wuw-push] PushNotifications registrationError', err);
    finish(null);
  });

  return {
    promise,
    cleanup: async () => {
      await Promise.all([handle.remove(), errorHandle.remove()]);
    },
  };
}

/** iOS debug: capture raw APNs device token from Capacitor registration (not valid for FCM HTTP v1). */
async function createApnsTokenWaiter(timeoutMs: number): Promise<{
  promise: Promise<string | null>;
  cleanup: () => Promise<void>;
}> {
  let settled = false;
  let timer = 0;
  let resolveToken: (value: string | null) => void = () => {};

  const promise = new Promise<string | null>((resolve) => {
    resolveToken = resolve;
    timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, timeoutMs);
  });

  const finish = (value: string | null) => {
    if (settled) {
      return;
    }
    settled = true;
    window.clearTimeout(timer);
    resolveToken(value);
  };

  const handle = await PushNotifications.addListener('registration', (ev) => {
    const value = ev.value?.trim() ?? '';
    if (isApnsDeviceToken(value)) {
      finish(value);
    }
  });

  return {
    promise,
    cleanup: async () => {
      await handle.remove();
    },
  };
}

async function pollFcmPluginForToken(): Promise<string | null> {
  const FCM = await getFcmPlugin();
  if (!FCM) {
    return null;
  }

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
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('not implemented')) {
        console.warn('[wuw-push] iOS FCM plugin unavailable:', msg);
        return null;
      }
      /* retry */
    }

    try {
      const { token } = await FCM.refreshToken();
      if (token?.trim() && isLikelyFcmRegistrationToken(token)) {
        return token.trim();
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('not implemented')) {
        return null;
      }
      /* retry */
    }
  }

  return null;
}

/**
 * Register with the OS, then read the FCM token.
 * Android: PushNotifications `registration` only (FCM plugin not available).
 * iOS: @capacitor-community/fcm + registration fallback.
 */
async function registerForFcmToken(): Promise<string | null> {
  const { promise: registrationToken, cleanup } = await createRegistrationTokenWaiter(12_000);
  const platform = Capacitor.getPlatform();

  try {
    await PushNotifications.register();

    if (platform === 'android') {
      const token = await registrationToken;
      if (!token) {
        console.warn('[wuw-push] Android: no token from PushNotifications registration event');
      }
      return token;
    }

    const [fromRegistration, fromFcm] = await Promise.all([
      registrationToken,
      pollFcmPluginForToken(),
    ]);
    return fromRegistration ?? fromFcm;
  } catch (error) {
    console.warn('[wuw-push] registerForFcmToken failed', error);
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
    console.warn('[wuw-push] server rejected token:', detail);
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
    console.warn('[wuw-push] permission not granted:', receive);
    return { ok: false, reason: 'permission_denied' };
  }

  const token = await registerForFcmToken();
  if (!token) {
    console.warn('[wuw-push] no FCM token after register()');
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
    console.warn('[wuw-push] notifications not granted:', receive);
    return { ok: false, reason: 'permission_denied' };
  }

  const token = await registerForFcmToken();
  if (!token) {
    console.warn('[wuw-push] no FCM token (sync)');
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
 * Returns true once the user has allowed notifications (token registration may still run in the background).
 */
export async function enablePushNotifications(): Promise<boolean> {
  if (!isNativePushPlatform()) {
    return false;
  }

  const receive = await getPushReceivePermission();
  if (shouldShowPushPermissionPrompt(receive)) {
    const perm = await PushNotifications.requestPermissions();
    const after = normalizeReceivePermission(perm.receive);
    if (after !== 'granted') {
      return false;
    }
    notifyPushPermissionChanged();
    void syncPushTokenIfPermitted();
    return true;
  }

  if (receive === 'denied') {
    openNotificationSettings();
    return false;
  }

  if (receive === 'granted') {
    notifyPushPermissionChanged();
    void syncPushTokenIfPermitted();
    return true;
  }

  return false;
}

/** @deprecated Prefer syncPushTokenIfPermitted + PushPermissionPrompt for new flows. */
export async function registerPushAfterLogin(): Promise<void> {
  await syncPushTokenIfPermitted();
}

/** Debug UI: read FCM + APNs tokens without persisting to the server. */
export async function readLocalPushTokensForDebug(): Promise<{
  fcm: string | null;
  apns: string | null;
  fcmError: string | null;
}> {
  if (!isNativePushPlatform()) {
    return { fcm: null, apns: null, fcmError: 'Not a native app (web preview)' };
  }

  const receive = await getPushReceivePermission();
  if (receive !== 'granted') {
    return {
      fcm: null,
      apns: null,
      fcmError: `Notifications not granted (${receive ?? 'unknown'})`,
    };
  }

  const platform = Capacitor.getPlatform();
  const { promise: registrationToken, cleanup: cleanupRegistration } =
    await createRegistrationTokenWaiter(12_000);
  const apnsWaiter =
    platform === 'ios' ? await createApnsTokenWaiter(12_000) : null;

  try {
    await PushNotifications.register();

    if (platform === 'android') {
      const fcm = await registrationToken;
      return {
        fcm,
        apns: null,
        fcmError: fcm ? null : 'No FCM token from PushNotifications registration',
      };
    }

    const [fromRegistration, fromFcm, apns] = await Promise.all([
      registrationToken,
      pollFcmPluginForToken(),
      apnsWaiter?.promise ?? Promise.resolve(null),
    ]);
    const fcm = fromRegistration ?? fromFcm;
    let fcmError: string | null = null;
    if (!fcm) {
      fcmError =
        'No FCM token — check GoogleService-Info.plist in ios/App/App/ and npm run ios:sync';
    } else if (isApnsDeviceToken(fcm)) {
      fcmError = 'Registration returned APNs hex token instead of FCM';
    }
    return { fcm, apns, fcmError };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { fcm: null, apns: null, fcmError: msg };
  } finally {
    await cleanupRegistration();
    if (apnsWaiter) {
      await apnsWaiter.cleanup();
    }
  }
}

/** Debug UI: permission + FCM + POST push-token (same as draw-alert flow). */
export function registerPushForDebug(): Promise<PushRegisterResult> {
  return ensurePushRegisteredForAlerts();
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
