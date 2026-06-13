import { describe, expect, it } from 'vitest';

import {
  filterOneSignalSubscriptionIds,
  isApnsDeviceToken,
  isLikelyFcmRegistrationToken,
  isLikelyOneSignalSubscriptionId,
  isValidPushTokenForPlatform,
} from '@/server/mobile/push-token-validation';

const SAMPLE_APNS =
  'a9d0ed10e9cfd022a61cb08753f49c5a0b0dfb383697bf9f9d750a1003da19c7';
const SAMPLE_FCM =
  'fcmToken:APA91bExampleToken123456789012345678901234567890123456789012345678901234567890';
const SAMPLE_ONESIGNAL = '67bb7c7b-9721-4b67-a2a2-2ca2e8fd7f75';

describe('isValidPushTokenForPlatform', () => {
  it('accepts APNs hex on iOS', () => {
    expect(isValidPushTokenForPlatform(SAMPLE_APNS, 'ios')).toBe(true);
  });

  it('accepts legacy FCM shape on iOS during transition', () => {
    expect(isValidPushTokenForPlatform(SAMPLE_FCM, 'ios')).toBe(true);
  });

  it('rejects APNs hex on Android', () => {
    expect(isValidPushTokenForPlatform(SAMPLE_APNS, 'android')).toBe(false);
  });

  it('accepts FCM on Android', () => {
    expect(isValidPushTokenForPlatform(SAMPLE_FCM, 'android')).toBe(true);
  });

  it('accepts OneSignal id on Android and iOS', () => {
    expect(isValidPushTokenForPlatform(SAMPLE_ONESIGNAL, 'android')).toBe(true);
    expect(isValidPushTokenForPlatform(SAMPLE_ONESIGNAL, 'ios')).toBe(true);
  });
});

describe('token shape helpers', () => {
  it('detects APNs device token', () => {
    expect(isApnsDeviceToken(SAMPLE_APNS)).toBe(true);
    expect(isApnsDeviceToken(SAMPLE_FCM)).toBe(false);
  });

  it('detects FCM registration token', () => {
    expect(isLikelyFcmRegistrationToken(SAMPLE_FCM)).toBe(true);
    expect(isLikelyFcmRegistrationToken(SAMPLE_APNS)).toBe(false);
  });

  it('detects OneSignal subscription id', () => {
    expect(isLikelyOneSignalSubscriptionId(SAMPLE_ONESIGNAL)).toBe(true);
    expect(isLikelyOneSignalSubscriptionId(SAMPLE_FCM)).toBe(false);
    expect(isLikelyOneSignalSubscriptionId(SAMPLE_APNS)).toBe(false);
  });
});

describe('filterOneSignalSubscriptionIds', () => {
  it('keeps only OneSignal subscription ids', () => {
    expect(
      filterOneSignalSubscriptionIds([SAMPLE_ONESIGNAL, SAMPLE_FCM, SAMPLE_APNS]),
    ).toEqual({
      subscriptionIds: [SAMPLE_ONESIGNAL],
      legacyTokenCount: 2,
    });
  });

  it('deduplicates tokens', () => {
    expect(
      filterOneSignalSubscriptionIds([SAMPLE_ONESIGNAL, SAMPLE_ONESIGNAL, SAMPLE_FCM]),
    ).toEqual({
      subscriptionIds: [SAMPLE_ONESIGNAL],
      legacyTokenCount: 1,
    });
  });
});
