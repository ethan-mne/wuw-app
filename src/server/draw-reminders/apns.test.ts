import { describe, expect, it } from 'vitest';

import {
  alternateApnsEnvironment,
  isApnsEnvironmentMismatch,
  normalizeP8Key,
} from '@/server/draw-reminders/apns-environment';

describe('APNs environment helpers', () => {
  it('flips sandbox and production', () => {
    expect(alternateApnsEnvironment('production')).toBe('sandbox');
    expect(alternateApnsEnvironment('sandbox')).toBe('production');
  });

  it('detects environment mismatch errors from APNs', () => {
    expect(isApnsEnvironmentMismatch('BadEnvironmentKeyInToken')).toBe(true);
    expect(isApnsEnvironmentMismatch('InvalidProviderToken')).toBe(true);
    expect(isApnsEnvironmentMismatch('BadDeviceToken')).toBe(false);
    expect(isApnsEnvironmentMismatch(undefined)).toBe(false);
  });
});

describe('normalizeP8Key', () => {
  const body = 'MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgtest';
  const singleLine = `-----BEGIN PRIVATE KEY-----\\n${body}\\n-----END PRIVATE KEY-----`;
  const multiLine = `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`;

  it('parses escaped single-line PEM', () => {
    expect(normalizeP8Key(singleLine)).toBe(multiLine);
  });

  it('parses multi-line PEM', () => {
    expect(normalizeP8Key(multiLine)).toBe(multiLine);
  });

  it('cleans Render-style mixed newlines and literal \\n', () => {
    const messy = `-----BEGIN PRIVATE KEY-----\n\\n${body}\\n-----END PRIVATE KEY-----`;
    expect(normalizeP8Key(messy)).toBe(multiLine);
  });
});
