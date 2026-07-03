import { afterEach, describe, expect, it } from 'vitest';

import {
  describeOneSignalRestApiKeyFormat,
  normalizeOneSignalRestApiKey,
  resolvePushThrottleRatePerMinute,
  sendOneSignalPushMulticast,
} from '@/server/notifications/onesignal';

const SAMPLE_ONESIGNAL = '67bb7c7b-9721-4b67-a2a2-2ca2e8fd7f75';

describe('OneSignal REST API key normalization', () => {
  it('strips Key prefix and quotes from env values', () => {
    expect(normalizeOneSignalRestApiKey('Key os_v2_app_abc123')).toBe('os_v2_app_abc123');
    expect(normalizeOneSignalRestApiKey('"os_v2_app_abc123"')).toBe('os_v2_app_abc123');
  });

  it('detects v2 app keys vs legacy keys', () => {
    expect(describeOneSignalRestApiKeyFormat('os_v2_app_abc123')).toBe('v2_app_key');
    expect(describeOneSignalRestApiKeyFormat('a-very-long-legacy-rest-api-key-value')).toBe('legacy');
  });
});

describe('resolvePushThrottleRatePerMinute', () => {
  const originalEnabled = process.env.PUSH_THROTTLE_ENABLED;
  const originalCompetitionNew = process.env.PUSH_THROTTLE_COMPETITION_NEW;
  const originalDrawSchedule = process.env.PUSH_THROTTLE_DRAW_SCHEDULE;

  afterEach(() => {
    if (originalEnabled === undefined) {
      delete process.env.PUSH_THROTTLE_ENABLED;
    } else {
      process.env.PUSH_THROTTLE_ENABLED = originalEnabled;
    }
    if (originalCompetitionNew === undefined) {
      delete process.env.PUSH_THROTTLE_COMPETITION_NEW;
    } else {
      process.env.PUSH_THROTTLE_COMPETITION_NEW = originalCompetitionNew;
    }
    if (originalDrawSchedule === undefined) {
      delete process.env.PUSH_THROTTLE_DRAW_SCHEDULE;
    } else {
      process.env.PUSH_THROTTLE_DRAW_SCHEDULE = originalDrawSchedule;
    }
  });

  it('returns undefined when throttling is disabled', () => {
    delete process.env.PUSH_THROTTLE_ENABLED;
    expect(resolvePushThrottleRatePerMinute('competition_new')).toBeUndefined();
    expect(resolvePushThrottleRatePerMinute('draw_schedule_updated')).toBeUndefined();
  });

  it('returns defaults when enabled and env vars are unset', () => {
    process.env.PUSH_THROTTLE_ENABLED = 'true';
    delete process.env.PUSH_THROTTLE_COMPETITION_NEW;
    delete process.env.PUSH_THROTTLE_DRAW_SCHEDULE;
    expect(resolvePushThrottleRatePerMinute('competition_new')).toBe(15);
    expect(resolvePushThrottleRatePerMinute('draw_schedule_updated')).toBe(25);
  });

  it('reads env overrides when enabled and valid', () => {
    process.env.PUSH_THROTTLE_ENABLED = 'true';
    process.env.PUSH_THROTTLE_COMPETITION_NEW = '30';
    process.env.PUSH_THROTTLE_DRAW_SCHEDULE = '40';
    expect(resolvePushThrottleRatePerMinute('competition_new')).toBe(30);
    expect(resolvePushThrottleRatePerMinute('draw_schedule_updated')).toBe(40);
  });

  it('falls back to defaults for invalid env values when enabled', () => {
    process.env.PUSH_THROTTLE_ENABLED = 'true';
    process.env.PUSH_THROTTLE_COMPETITION_NEW = '0';
    process.env.PUSH_THROTTLE_DRAW_SCHEDULE = 'not-a-number';
    expect(resolvePushThrottleRatePerMinute('competition_new')).toBe(15);
    expect(resolvePushThrottleRatePerMinute('draw_schedule_updated')).toBe(25);
  });
});

describe('sendOneSignalPushMulticast throttle payload', () => {
  const originalFetch = globalThis.fetch;
  const originalAppId = process.env.ONESIGNAL_APP_ID;
  const originalRestApiKey = process.env.ONESIGNAL_REST_API_KEY;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalAppId === undefined) {
      delete process.env.ONESIGNAL_APP_ID;
    } else {
      process.env.ONESIGNAL_APP_ID = originalAppId;
    }
    if (originalRestApiKey === undefined) {
      delete process.env.ONESIGNAL_REST_API_KEY;
    } else {
      process.env.ONESIGNAL_REST_API_KEY = originalRestApiKey;
    }
  });

  it('includes throttle_rate_per_minute when throttleRatePerMinute is set', async () => {
    let requestBody: Record<string, unknown> = {};
    globalThis.fetch = (async (_url, init) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(
        JSON.stringify({ id: 'notif-1', recipients: 1 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as typeof fetch;

    process.env.ONESIGNAL_APP_ID = '724df40e-025f-4620-959d-0aa22cbf529b';
    process.env.ONESIGNAL_REST_API_KEY = 'test-rest-api-key';

    await sendOneSignalPushMulticast({
      subscriptionIds: [SAMPLE_ONESIGNAL],
      title: 'New competition is live',
      body: 'Test competition is now available.',
      data: { type: 'competition_new', competitionId: 'comp-1' },
      throttleRatePerMinute: 15,
    });

    expect(requestBody.throttle_rate_per_minute).toBe(15);
  });

  it('omits throttle_rate_per_minute when throttleRatePerMinute is not set', async () => {
    let requestBody: Record<string, unknown> = {};
    globalThis.fetch = (async (_url, init) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(
        JSON.stringify({ id: 'notif-2', recipients: 1 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as typeof fetch;

    process.env.ONESIGNAL_APP_ID = '724df40e-025f-4620-959d-0aa22cbf529b';
    process.env.ONESIGNAL_REST_API_KEY = 'test-rest-api-key';

    await sendOneSignalPushMulticast({
      subscriptionIds: [SAMPLE_ONESIGNAL],
      title: 'Draw starting soon',
      body: 'Test draw reminder',
      data: { type: 'draw_reminder', competitionId: 'comp-1' },
    });

    expect(requestBody).not.toHaveProperty('throttle_rate_per_minute');
  });
});

describe('sendOneSignalPushMulticast response parsing', () => {
  it('treats HTTP 200 with empty id and dispatch errors as failure', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          id: '',
          errors: ['All included players are not subscribed'],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )) as typeof fetch;

    process.env.ONESIGNAL_APP_ID = '724df40e-025f-4620-959d-0aa22cbf529b';
    process.env.ONESIGNAL_REST_API_KEY = 'test-rest-api-key';

    try {
      const result = await sendOneSignalPushMulticast({
        subscriptionIds: [SAMPLE_ONESIGNAL],
        title: 'Draw schedule updated',
        body: 'Test competition has a new draw date/time.',
        data: {
          type: 'draw_schedule_updated',
          competitionId: 'comp-1',
        },
      });

      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(1);
      expect(result.errorSummary).toBe('All included players are not subscribed');
    } finally {
      globalThis.fetch = originalFetch;
      delete process.env.ONESIGNAL_APP_ID;
      delete process.env.ONESIGNAL_REST_API_KEY;
    }
  });

  it('treats notification id with recipients 0 as success (throttled queue)', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          id: 'notif-throttled',
          recipients: 0,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )) as typeof fetch;

    process.env.ONESIGNAL_APP_ID = '724df40e-025f-4620-959d-0aa22cbf529b';
    process.env.ONESIGNAL_REST_API_KEY = 'test-rest-api-key';

    try {
      const result = await sendOneSignalPushMulticast({
        subscriptionIds: [SAMPLE_ONESIGNAL, 'aba264c0-d051-4f46-9c3b-941b1c3437ce'],
        title: 'New competition is live',
        body: 'Test competition is now available.',
        data: { type: 'competition_new', competitionId: 'comp-1' },
        throttleRatePerMinute: 15,
      });

      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(result.notificationId).toBe('notif-throttled');
    } finally {
      globalThis.fetch = originalFetch;
      delete process.env.ONESIGNAL_APP_ID;
      delete process.env.ONESIGNAL_REST_API_KEY;
    }
  });

  it('rejects legacy FCM tokens before calling OneSignal when filtered upstream', async () => {
    const originalFetch = globalThis.fetch;
    let fetchCalled = false;
    globalThis.fetch = (async () => {
      fetchCalled = true;
      return new Response('{}', { status: 200 });
    }) as typeof fetch;

    try {
      const result = await sendOneSignalPushMulticast({
        subscriptionIds: [],
        title: 'Draw schedule updated',
        body: 'Test',
        data: { type: 'draw_schedule_updated', competitionId: 'comp-1' },
      });

      expect(result.successCount).toBe(0);
      expect(fetchCalled).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
