import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

import { isApnsDeviceToken, isLikelyFcmRegistrationToken } from './fcmToken';
import { getMobileSessionToken } from './mobileSessionToken';
import { getStoredPushDeviceToken, setStoredPushDeviceToken } from './pushStorage';
import {
  getCachedApnsDeviceToken,
  getLastPushRegistrationError,
} from './pushNotificationSetup';
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

export type ObtainPushTokenResult =
  | { ok: true; token: string; platform: 'ios' | 'android' }
  | { ok: false; reason: PushRegisterFailureReason; detail?: string };

/** User-facing message when push registration fails after a draw-alert subscribe. */
export function pushRegisterFailureMessage(
  push: Extract<PushRegisterResult | ObtainPushTokenResult, { ok: false }>,
): string {
  if (push.reason === 'permission_denied') {
    return push.detail
      ? push.detail
      : 'Allow notifications for Winuwatch in your phone settings to receive the push.';
  }
  if (push.reason === 'no_fcm_token' || push.reason === 'invalid_token_shape') {
    return push.detail
      ? push.detail
      : 'Could not register this device for push — allow notifications and try Remind me again.';
  }
  if (push.reason === 'server_rejected') {
    return push.detail
      ? push.detail
      : 'Server rejected push registration — try again in a moment.';
  }
  if (push.reason === 'not_logged_in') {
    return 'Sign in again, then tap Remind me to register this device.';
  }
  return 'Push notifications require the installed app on a real device.';
}

/** True when we should show the in-app soft-ask before calling the OS dialog. */
export function shouldShowPushPermissionPrompt(receive: PushReceivePermission | null): boolean {
  return receive === 'prompt' || receive === 'prompt-with-rationale';
}

export function isNativePushPlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function getNativePushPlatform(): 'ios' | 'android' | null {
  if (!isNativePushPlatform()) {
    return null;
  }
  return Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
}

const PUSH_PERMISSION_EVENT = 'wuw-push-permission';
const REGISTER_FCM_TIMEOUT_MS_ANDROID = 20_000;
/** iOS: APNs registration + FCM polling can exceed 20s on first launch. */
const REGISTER_FCM_TIMEOUT_MS_IOS = 45_000;
const APNS_WAIT_MS = 15_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise, delay(ms).then(() => fallback)]);
}

/** Second call to register() on iOS can hang if already registered — never block indefinitely. */
async function safePushRegister(): Promise<void> {
  try {
    await Promise.race([PushNotifications.register(), delay(6_000)]);
  } catch (error) {
    console.warn('[wuw-push] PushNotifications.register failed', error);
  }
}

async function safeRequestPushPermissions(): Promise<PushReceivePermission> {
  try {
    const perm = await withTimeout(
      PushNotifications.requestPermissions(),
      60_000,
      { receive: 'prompt' },
    );
    return normalizeReceivePermission(perm.receive);
  } catch (error) {
    console.warn('[wuw-push] requestPermissions failed', error);
    return 'prompt';
  }
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
  if (Capacitor.getPlatform() === 'ios' && isApnsDeviceToken(trimmed)) {
    return false;
  }
  return isLikelyFcmRegistrationToken(trimmed);
}

/** Android: FCM token from PushNotifications `registration` event. */
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

/** iOS debug: capture raw APNs device token (not valid for FCM HTTP v1). */
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

type FcmPlugin = NonNullable<Awaited<ReturnType<typeof getFcmPlugin>>>;

async function fcmPluginGetToken(FCM: FcmPlugin, timeoutMs: number): Promise<string | null> {
  try {
    const { token } = await withTimeout(
      FCM.getToken(),
      timeoutMs,
      { token: undefined as string | undefined },
    );
    if (token?.trim() && isLikelyFcmRegistrationToken(token)) {
      return token.trim();
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('not implemented')) {
      return null;
    }
    console.warn('[wuw-push] FCM.getToken failed', msg);
  }
  return null;
}

async function fcmPluginRefreshToken(FCM: FcmPlugin, timeoutMs: number): Promise<string | null> {
  try {
    const { token } = await withTimeout(
      FCM.refreshToken(),
      timeoutMs,
      { token: undefined as string | undefined },
    );
    if (token?.trim() && isLikelyFcmRegistrationToken(token)) {
      return token.trim();
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('not implemented')) {
      return null;
    }
    console.warn('[wuw-push] FCM.refreshToken failed', msg);
  }
  return null;
}

function describeIosFcmFailure(apns: string | null): string {
  const regErr = getLastPushRegistrationError();
  if (regErr) {
    return `Apple push registration failed: ${regErr}. In developer.apple.com enable Push Notifications for App ID com.winuwatch.wuwapp, then upload a new build to TestFlight.`;
  }
  if (!apns) {
    return 'No APNs token — TestFlight build needs Push capability on the App ID, notifications allowed, real iPhone. Reinstall after a new archive.';
  }
  return 'APNs OK but no FCM token — run npm run ios:sync, clean build, reinstall. Firebase needs GoogleService-Info.plist in the app bundle.';
}

export function getIosApnsTokenForDebug(): string | null {
  return lastIosApnsToken ?? getCachedApnsDeviceToken();
}

/** Last APNs token seen during iOS registration (for error messages). */
let lastIosApnsToken: string | null = null;

/** iOS: register with APNs, then read FCM token via @capacitor-community/fcm. */
async function acquireIosPushTokens(): Promise<{ fcm: string | null; apns: string | null }> {
  const cachedApns = getCachedApnsDeviceToken();
  const apnsWaiter = cachedApns ? null : await createApnsTokenWaiter(APNS_WAIT_MS);
  try {
    await safePushRegister();
    const apns =
      cachedApns ??
      (apnsWaiter ? await apnsWaiter.promise : null) ??
      getCachedApnsDeviceToken();
    lastIosApnsToken = apns;
    if (apns) {
      await delay(800);
    }
    const fcm = await pollFcmPluginForToken({ maxAttempts: 6, getTokenTimeoutMs: 5_000 });
    return { fcm, apns };
  } finally {
    if (apnsWaiter) {
      await apnsWaiter.cleanup();
    }
  }
}

async function pollFcmPluginForToken(options?: {
  maxAttempts?: number;
  getTokenTimeoutMs?: number;
}): Promise<string | null> {
  const FCM = await getFcmPlugin();
  if (!FCM) {
    return null;
  }

  const maxAttempts = options?.maxAttempts ?? 8;
  const getTokenTimeoutMs = options?.getTokenTimeoutMs ?? 4_000;

  try {
    await FCM.setAutoInit({ enabled: true });
  } catch {
    /* optional on some builds */
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await delay(600 * attempt);
    }

    const fromGet = await fcmPluginGetToken(FCM, getTokenTimeoutMs);
    if (fromGet) {
      return fromGet;
    }

    const fromRefresh = await fcmPluginRefreshToken(FCM, getTokenTimeoutMs);
    if (fromRefresh) {
      return fromRefresh;
    }
  }

  return null;
}

/**
 * Register with the OS, then read the FCM token.
 * Android: PushNotifications `registration` event.
 * iOS: @capacitor-community/fcm only (Capacitor registration is APNs hex).
 */
async function registerForFcmTokenInner(): Promise<string | null> {
  const platform = Capacitor.getPlatform();

  try {
    if (platform === 'android') {
      const { promise: registrationToken, cleanup } = await createRegistrationTokenWaiter(8_000);
      try {
        await safePushRegister();
        const token = await registrationToken;
        if (!token) {
          console.warn('[wuw-push] Android: no token from PushNotifications registration event');
        }
        return token;
      } finally {
        await cleanup();
      }
    }

    if (platform === 'ios') {
      const { fcm, apns } = await acquireIosPushTokens();
      if (!apns) {
        console.warn('[wuw-push] iOS: no APNs device token');
      }
      if (!fcm) {
        console.warn('[wuw-push] iOS: no FCM token from @capacitor-community/fcm');
      }
      return fcm;
    }

    return null;
  } catch (error) {
    console.warn('[wuw-push] registerForFcmToken failed', error);
    return null;
  }
}

async function registerForFcmToken(): Promise<string | null> {
  const timeoutMs =
    Capacitor.getPlatform() === 'ios'
      ? REGISTER_FCM_TIMEOUT_MS_IOS
      : REGISTER_FCM_TIMEOUT_MS_ANDROID;
  return withTimeout(registerForFcmTokenInner(), timeoutMs, null);
}

async function ensurePushPermission(prompt: boolean): Promise<PushReceivePermission | null> {
  if (!isNativePushPlatform()) {
    return null;
  }

  let receive = await getPushReceivePermission();
  if (prompt && shouldShowPushPermissionPrompt(receive)) {
    receive = await safeRequestPushPermissions();
  }

  return receive;
}

/**
 * Obtain a valid FCM token on device (no server POST).
 * Use with atomic draw-alert subscribe when persisting token via that endpoint.
 */
export async function obtainPushToken(options?: { prompt?: boolean }): Promise<ObtainPushTokenResult> {
  const platform = getNativePushPlatform();
  if (!platform) {
    return { ok: false, reason: 'not_native' };
  }

  const receive = await ensurePushPermission(options?.prompt ?? false);
  if (receive !== 'granted') {
    console.warn('[wuw-push] permission not granted:', receive);
    return { ok: false, reason: 'permission_denied' };
  }

  const token = await registerForFcmToken();
  if (!token || !isLikelyFcmRegistrationToken(token)) {
    console.warn('[wuw-push] no valid FCM token');
    return {
      ok: false,
      reason: 'no_fcm_token',
      detail:
        platform === 'ios' ? describeIosFcmFailure(lastIosApnsToken) : undefined,
    };
  }

  setStoredPushDeviceToken(token);
  return { ok: true, token, platform };
}

async function persistTokenOnServer(token: string): Promise<PushRegisterResult> {
  if (!isLikelyFcmRegistrationToken(token)) {
    return { ok: false, reason: 'invalid_token_shape' };
  }

  const platform = getNativePushPlatform();
  if (!platform) {
    return { ok: false, reason: 'not_native' };
  }

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

/**
 * Permission (optional prompt) + FCM token + POST /me/push-token.
 */
export async function registerPushDevice(options?: { prompt?: boolean }): Promise<PushRegisterResult> {
  const obtained = await obtainPushToken({ prompt: options?.prompt ?? false });
  if (!obtained.ok) {
    return obtained;
  }
  return persistTokenOnServer(obtained.token);
}

/** Permission + FCM token + backend upsert (for draw alerts and tests). */
export async function ensurePushRegisteredForAlerts(): Promise<PushRegisterResult> {
  return registerPushDevice({ prompt: true });
}

/** If notifications are already allowed, register the FCM token without prompting. */
export async function syncPushTokenIfPermitted(): Promise<PushRegisterResult> {
  return registerPushDevice({ prompt: false });
}

export async function requestPushPermissionAndRegister(): Promise<PushRegisterResult> {
  return registerPushDevice({ prompt: true });
}

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

async function readPushTokensWithRegister(): Promise<{
  fcm: string | null;
  apns: string | null;
  fcmError: string | null;
}> {
  const platform = Capacitor.getPlatform();

  try {
    if (platform === 'android') {
      const { promise: registrationToken, cleanup } = await createRegistrationTokenWaiter(8_000);
      try {
        await safePushRegister();
        const fcm = await registrationToken;
        return {
          fcm,
          apns: null,
          fcmError: fcm ? null : 'No FCM token from PushNotifications registration',
        };
      } finally {
        await cleanup();
      }
    }

    if (platform === 'ios') {
      const { fcm, apns } = await acquireIosPushTokens();
      const fcmError = fcm ? null : describeIosFcmFailure(apns);
      return { fcm, apns, fcmError };
    }

    return { fcm: null, apns: null, fcmError: 'Unsupported platform' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { fcm: null, apns: null, fcmError: msg };
  }
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

  const cachedApns = getCachedApnsDeviceToken();
  const stored = getStoredPushDeviceToken();
  if (stored && isLikelyFcmRegistrationToken(stored)) {
    return { fcm: stored, apns: cachedApns ?? lastIosApnsToken, fcmError: null };
  }

  const result = await readPushTokensWithRegister();
  return {
    ...result,
    apns: result.apns ?? cachedApns ?? getCachedApnsDeviceToken(),
  };
}

async function registerPushForDebugInner(): Promise<PushRegisterResult> {
  if (!isNativePushPlatform()) {
    return { ok: false, reason: 'not_native' };
  }

  if (!getMobileSessionToken()) {
    return { ok: false, reason: 'not_logged_in' };
  }

  return registerPushDevice({ prompt: true });
}

/** Debug UI: permission + FCM + POST push-token (bounded so the UI never hangs). */
export function registerPushForDebug(): Promise<PushRegisterResult> {
  const timeoutMs =
    Capacitor.getPlatform() === 'ios' ? REGISTER_FCM_TIMEOUT_MS_IOS + 5_000 : 25_000;
  return withTimeout(registerPushForDebugInner(), timeoutMs, {
    ok: false,
    reason: 'no_fcm_token',
    detail:
      Capacitor.getPlatform() === 'ios'
        ? describeIosFcmFailure(lastIosApnsToken)
        : 'Registration timed out. Check network and notification permission, then retry.',
  });
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

}
