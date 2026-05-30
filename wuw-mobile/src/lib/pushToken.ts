/**
 * Native push registration tokens stored on the server.
 * iOS: APNs device token (64 hex). Android: FCM registration token.
 */

/** 64-char hex string — iOS APNs device token. */
export function isApnsDeviceToken(token: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(token.trim());
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
    return isApnsDeviceToken(token);
  }
  return isLikelyFcmRegistrationToken(token);
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
