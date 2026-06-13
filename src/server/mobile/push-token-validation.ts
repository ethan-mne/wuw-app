/** 64-char hex — iOS APNs device token (invalid for firebase-admin FCM sends). */
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

export function filterOneSignalSubscriptionIds(tokens: string[]): {
  subscriptionIds: string[];
  legacyTokenCount: number;
} {
  const unique = [...new Set(tokens.map((token) => token.trim()).filter(Boolean))];
  const subscriptionIds = unique.filter(isLikelyOneSignalSubscriptionId);
  return {
    subscriptionIds,
    legacyTokenCount: unique.length - subscriptionIds.length,
  };
}

export function isValidPushTokenForPlatform(
  token: string,
  platform: 'ios' | 'android',
): boolean {
  if (platform === 'android') {
    return isLikelyFcmRegistrationToken(token) || isLikelyOneSignalSubscriptionId(token);
  }
  return (
    isApnsDeviceToken(token)
    || isLikelyFcmRegistrationToken(token)
    || isLikelyOneSignalSubscriptionId(token)
  );
}
