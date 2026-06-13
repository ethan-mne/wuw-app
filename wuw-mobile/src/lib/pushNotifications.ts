import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

import {
  getIosApnsEnvironment,
  isApnsDeviceToken,
  isLikelyFcmRegistrationToken,
  isValidNativePushToken,
  type ApnsEnvironment,
} from './pushToken';
import { getMobileSessionToken } from './mobileSessionToken';
import { getStoredPushDeviceToken, setStoredPushDeviceToken } from './pushStorage';
import {
  getCachedApnsDeviceToken,
  getLastPushRegistrationError,
} from './pushNotificationSetup';
import {
  getOneSignalSubscriptionId,
  hasOneSignalMobileConfig,
  initOneSignal,
  requestOneSignalPermission,
} from './oneSignal';
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
  | { ok: true; token: string; platform: 'ios' | 'android'; apnsEnvironment?: ApnsEnvironment }
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
    return 'Sign in (OTP), then try again.';
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
const REGISTER_PUSH_TIMEOUT_MS_ANDROID = 20_000;
const REGISTER_PUSH_TIMEOUT_MS_IOS = 20_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise, delay(ms).then(() => fallback)]);
}

/** Never block indefinitely on repeated register() calls. */
async function safePushRegister(): Promise<void> {
  try {
    await Promise.race([PushNotifications.register(), delay(12_000)]);
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

function acceptPushRegistrationValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  if (Capacitor.getPlatform() === 'ios') {
    return isApnsDeviceToken(trimmed);
  }
  return isLikelyFcmRegistrationToken(trimmed);
}

function describeIosPushFailure(): string {
  const regErr = getLastPushRegistrationError();
  if (regErr) {
    return `Apple push registration failed: ${regErr}. Enable Push Notifications for App ID com.winuwatch.wuwapp, then reinstall.`;
  }
  const cached = getCachedApnsDeviceToken();
  if (cached) {
    return 'APNs token was received but registration timed out — try again.';
  }
  return 'No APNs token — use a real iPhone (not Simulator), allow notifications, Push capability in Xcode.';
}

export function getIosApnsTokenForDebug(): string | null {
  return getCachedApnsDeviceToken();
}

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

/** Register with the OS and read the native push token (APNs on iOS, FCM on Android). */
async function registerForNativePushTokenInner(): Promise<string | null> {
  const cached = getCachedApnsDeviceToken();
  if (Capacitor.getPlatform() === 'ios' && cached && isApnsDeviceToken(cached)) {
    return cached;
  }

  const { promise: registrationToken, cleanup } = await createRegistrationTokenWaiter(15_000);
  try {
    await safePushRegister();
    const token = await registrationToken;
    if (!token) {
      console.warn('[wuw-push] no token from PushNotifications registration event');
    }
    return token;
  } finally {
    await cleanup();
  }
}

async function registerForNativePushToken(): Promise<string | null> {
  const timeoutMs =
    Capacitor.getPlatform() === 'ios'
      ? REGISTER_PUSH_TIMEOUT_MS_IOS
      : REGISTER_PUSH_TIMEOUT_MS_ANDROID;
  return withTimeout(registerForNativePushTokenInner(), timeoutMs, null);
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

async function tryObtainOneSignalSubscriptionToken(input: {
  platform: 'ios' | 'android';
  prompt: boolean;
}): Promise<ObtainPushTokenResult | null> {
  if (!hasOneSignalMobileConfig()) {
    return null;
  }

  if (!initOneSignal()) {
    return {
      ok: false,
      reason: 'no_fcm_token',
      detail: 'OneSignal SDK unavailable on this device build.',
    };
  }

  if (input.prompt) {
    const permission = await requestOneSignalPermission();
    if (!permission.ok) {
      return {
        ok: false,
        reason: 'permission_denied',
        detail: permission.detail ?? 'Failed to request notifications through OneSignal.',
      };
    }
    if (!permission.granted) {
      return { ok: false, reason: 'permission_denied' };
    }
  }

  const subscription = await getOneSignalSubscriptionId();
  if (!subscription.ok) {
    return {
      ok: false,
      reason: 'no_fcm_token',
      detail: 'No OneSignal subscription id available yet. Retry in a moment.',
    };
  }

  if (!isValidNativePushToken(subscription.subscriptionId, input.platform)) {
    return {
      ok: false,
      reason: 'invalid_token_shape',
      detail: 'Invalid OneSignal subscription id shape.',
    };
  }

  return {
    ok: true,
    token: subscription.subscriptionId,
    platform: input.platform,
  };
}

/**
 * Obtain a valid push token on device (no server POST).
 * Use with atomic draw-alert subscribe when persisting token via that endpoint.
 */
export async function obtainPushToken(options?: { prompt?: boolean }): Promise<ObtainPushTokenResult> {
  const platform = getNativePushPlatform();
  if (!platform) {
    return { ok: false, reason: 'not_native' };
  }

  const oneSignalToken = await tryObtainOneSignalSubscriptionToken({
    platform,
    prompt: options?.prompt ?? false,
  });
  if (oneSignalToken) {
    if (oneSignalToken.ok) {
      setStoredPushDeviceToken(oneSignalToken.token);
    }
    return oneSignalToken;
  }

  const receive = await ensurePushPermission(options?.prompt ?? false);
  if (receive !== 'granted') {
    console.warn('[wuw-push] permission not granted:', receive);
    return { ok: false, reason: 'permission_denied' };
  }

  const token = await registerForNativePushToken();
  if (!token || !isValidNativePushToken(token, platform)) {
    console.warn('[wuw-push] no valid push token');
    return {
      ok: false,
      reason: 'no_fcm_token',
      detail: platform === 'ios' ? describeIosPushFailure() : undefined,
    };
  }

  setStoredPushDeviceToken(token);
  if (platform === 'ios') {
    return { ok: true, token, platform, apnsEnvironment: getIosApnsEnvironment() };
  }
  return { ok: true, token, platform };
}

async function persistTokenOnServer(
  token: string,
  platform: 'ios' | 'android',
  apnsEnvironment?: ApnsEnvironment,
): Promise<PushRegisterResult> {
  if (!isValidNativePushToken(token, platform)) {
    return { ok: false, reason: 'invalid_token_shape' };
  }

  setStoredPushDeviceToken(token);

  try {
    await registerPushTokenWithServer(token, platform, apnsEnvironment);
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
 * Permission (optional prompt) + push token + POST /me/push-token.
 */
export async function registerPushDevice(options?: { prompt?: boolean }): Promise<PushRegisterResult> {
  const obtained = await obtainPushToken({ prompt: options?.prompt ?? false });
  if (!obtained.ok) {
    return obtained;
  }
  return persistTokenOnServer(obtained.token, obtained.platform, obtained.apnsEnvironment);
}

/** Permission + push token + backend upsert (for draw alerts and tests). */
export async function ensurePushRegisteredForAlerts(): Promise<PushRegisterResult> {
  return registerPushDevice({ prompt: true });
}

/** If notifications are already allowed, register the push token without prompting. */
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

  if (hasOneSignalMobileConfig()) {
    const permission = await requestOneSignalPermission();
    // OneSignal requestPermission(true) may already deep-link to app settings when OS prompts are exhausted.
    // Avoid a second immediate redirect loop when user returns without granting permission.
    if (!permission.ok || !permission.granted) {
      return false;
    }
    notifyPushPermissionChanged();
    void syncPushTokenIfPermitted();
    return true;
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
  pushToken: string | null;
  apnsToken: string | null;
  pushError: string | null;
}> {
  const platform = Capacitor.getPlatform();

  try {
    const token = await registerForNativePushToken();
    if (platform === 'ios') {
      return {
        pushToken: token,
        apnsToken: token,
        pushError: token ? null : describeIosPushFailure(),
      };
    }
    return {
      pushToken: token,
      apnsToken: null,
      pushError: token ? null : 'No FCM token from PushNotifications registration',
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { pushToken: null, apnsToken: null, pushError: msg };
  }
}

/** Debug UI: read push + APNs tokens without persisting to the server. */
export async function readLocalPushTokensForDebug(): Promise<{
  pushToken: string | null;
  apnsToken: string | null;
  pushError: string | null;
}> {
  if (!isNativePushPlatform()) {
    return { pushToken: null, apnsToken: null, pushError: 'Not a native app (web preview)' };
  }

  const receive = await getPushReceivePermission();
  if (receive !== 'granted') {
    return {
      pushToken: null,
      apnsToken: null,
      pushError: `Notifications not granted (${receive ?? 'unknown'})`,
    };
  }

  const platform = getNativePushPlatform();
  const cachedApns = getCachedApnsDeviceToken();
  const stored = getStoredPushDeviceToken();
  if (stored && platform && isValidNativePushToken(stored, platform)) {
    return {
      pushToken: stored,
      apnsToken: platform === 'ios' ? (cachedApns ?? stored) : null,
      pushError: null,
    };
  }

  const result = await readPushTokensWithRegister();
  return {
    ...result,
    apnsToken: result.apnsToken ?? cachedApns,
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

/** Debug UI: permission + push token + POST push-token (bounded so the UI never hangs). */
export function registerPushForDebug(): Promise<PushRegisterResult> {
  const timeoutMs =
    Capacitor.getPlatform() === 'ios' ? REGISTER_PUSH_TIMEOUT_MS_IOS + 5_000 : 25_000;
  return withTimeout(registerPushForDebugInner(), timeoutMs, {
    ok: false,
    reason: 'no_fcm_token',
    detail:
      Capacitor.getPlatform() === 'ios'
        ? describeIosPushFailure()
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
