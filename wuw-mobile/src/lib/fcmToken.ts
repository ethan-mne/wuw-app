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
  if (!trimmed || isApnsDeviceToken(trimmed)) {
    return false;
  }
  // Typical FCM v1 token (contains ':' and APA91b segment).
  if (trimmed.includes(':') && trimmed.length >= 50) {
    return true;
  }
  if (trimmed.length >= 80) {
    return true;
  }
  return false;
}
