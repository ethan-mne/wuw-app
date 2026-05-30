/** 64-char hex — iOS APNs device token (invalid for firebase-admin FCM sends). */
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

export function isValidPushTokenForPlatform(
  token: string,
  platform: 'ios' | 'android',
): boolean {
  if (platform === 'android') {
    return isLikelyFcmRegistrationToken(token);
  }
  return isApnsDeviceToken(token) || isLikelyFcmRegistrationToken(token);
}
