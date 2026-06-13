import { describe, expect, it } from 'vitest';

import {
  describeOneSignalRestApiKeyFormat,
  normalizeOneSignalRestApiKey,
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
