/**
 * FCM registration tokens (what firebase-admin expects).
 * Capacitor PushNotifications `registration` returns an APNs token on iOS — not valid for FCM HTTP v1.
 */

/** 64-char hex string — iOS APNs device token mistakenly stored as FCM. */
export function isApnsDeviceToken(token: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(token.trim());
}

export function isLikelyFcmRegistrationToken(token: string): boolean {
  const trimmed = token.trim();
  if (trimmed.length < 80) {
    return false;
  }
  if (isApnsDeviceToken(trimmed)) {
    return false;
  }
  return true;
}
