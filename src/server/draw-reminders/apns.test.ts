import { describe, expect, it } from 'vitest';

import {
  alternateApnsEnvironment,
  isApnsEnvironmentMismatch,
} from '@/server/draw-reminders/apns-environment';

describe('APNs environment helpers', () => {
  it('flips sandbox and production', () => {
    expect(alternateApnsEnvironment('production')).toBe('sandbox');
    expect(alternateApnsEnvironment('sandbox')).toBe('production');
  });

  it('detects environment mismatch errors from APNs', () => {
    expect(isApnsEnvironmentMismatch('BadEnvironmentKeyInToken')).toBe(true);
    expect(isApnsEnvironmentMismatch('BadDeviceToken')).toBe(false);
    expect(isApnsEnvironmentMismatch(undefined)).toBe(false);
  });
});
