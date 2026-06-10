/**
 * Native push registration tokens stored on the server.
 * iOS: APNs device token (64 hex). Android: FCM registration token.
 */

/** 64-char hex string — iOS APNs device token. */
export function isApnsDeviceToken(token: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(token.trim());
}

/** OneSignal subscription id (UUID or opaque id with safe chars). */
export function isLikelyOneSignalSubscriptionId(token: string): boolean {
  const trimmed = token.trim();
  if (!trimmed || isApnsDeviceToken(trimmed) || trimmed.includes(':')) {
    return false;
  }
  const uuidV4Like =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidV4Like.test(trimmed)) {
    return true;
  }
  return /^[A-Za-z0-9_-]{24,200}$/.test(trimmed);
}

export function isLikelyFcmRegistrationToken(token: string): boolean {
  const trimmed = token.trim();
  if (!trimmed || isApnsDeviceToken(trimmed)) {
    return false;
  }
  if (trimmed.includes(':') && trimmed.length >= 50) {
    return true;
  }
  if (trimmed.length >= 80) {
    return true;
  }
  return false;
}

export function isValidNativePushToken(token: string, platform: 'ios' | 'android'): boolean {
  if (platform === 'ios') {
    return isApnsDeviceToken(token) || isLikelyOneSignalSubscriptionId(token);
  }
  return isLikelyFcmRegistrationToken(token) || isLikelyOneSignalSubscriptionId(token);
}

export type ApnsEnvironment = 'sandbox' | 'production';

/** Matches Xcode entitlements: production builds use AppRelease.entitlements. */
export function getIosApnsEnvironment(): ApnsEnvironment {
  const explicit = import.meta.env.VITE_APNS_ENVIRONMENT;
  if (explicit === 'sandbox' || explicit === 'production') {
    return explicit;
  }
  return import.meta.env.PROD ? 'production' : 'sandbox';
}
