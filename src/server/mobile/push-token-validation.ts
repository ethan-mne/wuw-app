/** 64-char hex — iOS APNs device token (invalid for firebase-admin FCM sends). */
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
