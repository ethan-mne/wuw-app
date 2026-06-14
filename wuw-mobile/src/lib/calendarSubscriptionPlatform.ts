import { Capacitor } from '@capacitor/core';

export type CalendarSubscriptionPlatform = 'apple' | 'google' | 'other';

type PlatformDetectionOptions = {
  capacitorPlatform?: string;
  userAgent?: string;
};

export function getCalendarSubscriptionPlatform(
  options: PlatformDetectionOptions = {},
): CalendarSubscriptionPlatform {
  const capacitorPlatform = options.capacitorPlatform ?? Capacitor.getPlatform();
  if (capacitorPlatform === 'ios') {
    return 'apple';
  }
  if (capacitorPlatform === 'android') {
    return 'google';
  }

  const userAgent =
    options.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return 'apple';
  }
  if (/Macintosh|Mac OS X/i.test(userAgent)) {
    return 'apple';
  }
  if (/Android/i.test(userAgent)) {
    return 'google';
  }
  return 'other';
}

export function getCalendarSubscriptionIntro(platform: CalendarSubscriptionPlatform): string {
  switch (platform) {
    case 'apple':
      return 'Add WINUWATCH draw dates to Apple Calendar. They update automatically when new draws are scheduled.';
    case 'google':
      return 'Add WINUWATCH draw dates to Google Calendar. They update automatically when new draws are scheduled.';
    default:
      return 'Subscribe to WINUWATCH draw dates in your calendar app. They update automatically when new draws are scheduled.';
  }
}

export function getCalendarSubscriptionHelp(platform: CalendarSubscriptionPlatform): string {
  switch (platform) {
    case 'apple':
      return 'Tap Subscribe to open Apple Calendar and confirm the subscription.';
    case 'google':
      return 'We copy your personal link and open Google Calendar so you can paste it under Add by URL.';
    default:
      return 'Copy your personal link and add it as a subscribed calendar in your app.';
  }
}

export function getPrimaryCalendarButtonLabel(
  platform: CalendarSubscriptionPlatform,
  revoked: boolean,
  busyAction: 'primary' | 'regenerate' | null,
): string {
  if (busyAction === 'primary') {
    return 'Please wait…';
  }
  if (busyAction === 'regenerate') {
    return 'Regenerating…';
  }
  if (revoked) {
    return 'Regenerate link';
  }
  if (platform === 'apple') {
    return 'Subscribe now';
  }
  if (platform === 'google') {
    return 'Add to Google Calendar';
  }
  return 'Copy calendar link';
}
