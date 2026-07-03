type OneSignalTokenResult = {
  tokenPrefix: string;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
};

export type OneSignalMulticastResult = {
  successCount: number;
  failureCount: number;
  notificationId?: string;
  errorSummary?: string;
  results: OneSignalTokenResult[];
  invalidSubscriptionIds: string[];
};

type OneSignalApiResponse = {
  id?: string | string[];
  recipients?: number;
  errors?: unknown;
};

const ONESIGNAL_API_URL = 'https://api.onesignal.com/notifications';
const ONESIGNAL_SUBSCRIPTIONS_CHUNK = 2_000;
const ONESIGNAL_V2_APP_KEY_PREFIX = 'os_v2_app_';

const DEFAULT_PUSH_THROTTLE_COMPETITION_NEW = 15;
const DEFAULT_PUSH_THROTTLE_DRAW_SCHEDULE = 25;

export type PushThrottleKind = 'competition_new' | 'draw_schedule_updated';

function parsePositiveInt(raw: string | undefined): number | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

export function resolvePushThrottleRatePerMinute(kind: PushThrottleKind): number {
  const envKey = kind === 'competition_new'
    ? 'PUSH_THROTTLE_COMPETITION_NEW'
    : 'PUSH_THROTTLE_DRAW_SCHEDULE';
  const fallback = kind === 'competition_new'
    ? DEFAULT_PUSH_THROTTLE_COMPETITION_NEW
    : DEFAULT_PUSH_THROTTLE_DRAW_SCHEDULE;
  return parsePositiveInt(process.env[envKey]) ?? fallback;
}

export type OneSignalRestApiKeyFormat =
  | 'missing'
  | 'v2_app_key'
  | 'legacy'
  | 'invalid';

export function normalizeOneSignalRestApiKey(raw: string | undefined): string {
  let value = raw?.trim() ?? '';
  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  if (/^key\s+/i.test(value)) {
    value = value.replace(/^key\s+/i, '').trim();
  }
  if (/^basic\s+/i.test(value)) {
    value = value.replace(/^basic\s+/i, '').trim();
  }
  return value;
}

export function describeOneSignalRestApiKeyFormat(
  raw: string | undefined,
): OneSignalRestApiKeyFormat {
  const normalized = normalizeOneSignalRestApiKey(raw);
  if (!normalized) {
    return 'missing';
  }
  if (normalized.startsWith(ONESIGNAL_V2_APP_KEY_PREFIX)) {
    return 'v2_app_key';
  }
  // Legacy REST API keys were long opaque strings (not os_v2_app_*).
  if (/^[A-Za-z0-9_-]{20,}$/.test(normalized)) {
    return 'legacy';
  }
  return 'invalid';
}

function buildOneSignalAuthorizationHeader(restApiKey: string): string {
  return `Key ${restApiKey}`;
}

function accessDeniedHint(keyFormat: OneSignalRestApiKeyFormat): string {
  if (keyFormat === 'legacy') {
    return 'ONESIGNAL_REST_API_KEY looks like a legacy REST API key. OneSignal requires a new App API Key (starts with os_v2_app_) from Settings → Keys & IDs.';
  }
  return 'Check ONESIGNAL_REST_API_KEY on the server: use the App API Key from OneSignal → Settings → Keys & IDs (starts with os_v2_app_). Do not use the User Auth Key or Organization API Key.';
}

function enrichOneSignalAuthErrorMessage(
  errorMessage: string,
  keyFormat: OneSignalRestApiKeyFormat,
): string {
  if (!/access denied/i.test(errorMessage)) {
    return errorMessage;
  }
  return `${errorMessage} ${accessDeniedHint(keyFormat)}`;
}

function tokenPrefix(token: string): string {
  if (token.length <= 12) {
    return token;
  }
  return `${token.slice(0, 8)}…${token.slice(-4)}`;
}

function chunk<T>(items: T[], size: number): T[][] {
  if (items.length === 0) {
    return [];
  }
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

export function getOneSignalConfig(): { appId: string; restApiKey: string } | null {
  const appId = process.env.ONESIGNAL_APP_ID?.trim();
  const restApiKey = normalizeOneSignalRestApiKey(process.env.ONESIGNAL_REST_API_KEY);
  if (!appId || !restApiKey) {
    return null;
  }
  return { appId, restApiKey };
}

export function getOneSignalRestApiKeyFormat(): OneSignalRestApiKeyFormat {
  return describeOneSignalRestApiKeyFormat(process.env.ONESIGNAL_REST_API_KEY);
}

export function isOneSignalConfigured(): boolean {
  return getOneSignalConfig() != null;
}

function hasNotificationId(json: OneSignalApiResponse): boolean {
  if (typeof json.id === 'string' && json.id.trim().length > 0) {
    return true;
  }
  if (Array.isArray(json.id)) {
    return json.id.some((item) => typeof item === 'string' && item.trim().length > 0);
  }
  return false;
}

function extractDispatchErrors(errors: unknown): string[] {
  if (!Array.isArray(errors)) {
    return [];
  }
  return errors
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractInvalidSubscriptionIds(errors: unknown): string[] {
  if (typeof errors !== 'object' || errors == null) {
    return [];
  }
  const root = errors as Record<string, unknown>;
  for (const key of ['invalid_subscription_ids', 'invalid_player_ids'] as const) {
    const value = root[key];
    if (!Array.isArray(value)) {
      continue;
    }
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function summarizeOneSignalErrors(errors: unknown): string | undefined {
  const dispatchErrors = extractDispatchErrors(errors);
  if (dispatchErrors.length > 0) {
    return dispatchErrors.join('; ');
  }
  if (typeof errors === 'string' && errors.trim()) {
    return errors.trim();
  }
  return undefined;
}

function failureResult(params: {
  subscriptionIds: string[];
  invalidSubscriptionIds?: string[];
  errorCode: string;
  errorMessage: string;
}): OneSignalMulticastResult {
  const invalidSubscriptionIds = params.invalidSubscriptionIds ?? [];
  const invalidSet = new Set(invalidSubscriptionIds);
  return {
    successCount: 0,
    failureCount: params.subscriptionIds.length,
    errorSummary: params.errorMessage,
    invalidSubscriptionIds,
    results: params.subscriptionIds.map((token) => ({
      tokenPrefix: tokenPrefix(token),
      success: false,
      errorCode: invalidSet.has(token) ? 'invalid_subscription_id' : params.errorCode,
      errorMessage: invalidSet.has(token)
        ? 'OneSignal rejected this subscription id'
        : params.errorMessage,
    })),
  };
}

async function sendOneSignalChunk(params: {
  subscriptionIds: string[];
  title: string;
  body: string;
  data: Record<string, string>;
  throttleRatePerMinute?: number;
}): Promise<OneSignalMulticastResult> {
  const config = getOneSignalConfig();
  if (!config) {
    return failureResult({
      subscriptionIds: params.subscriptionIds,
      errorCode: 'onesignal_not_configured',
      errorMessage: 'ONESIGNAL_APP_ID / ONESIGNAL_REST_API_KEY missing',
    });
  }

  const keyFormat = describeOneSignalRestApiKeyFormat(process.env.ONESIGNAL_REST_API_KEY);

  try {
    const response = await fetch(ONESIGNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: buildOneSignalAuthorizationHeader(config.restApiKey),
      },
      body: JSON.stringify({
        app_id: config.appId,
        target_channel: 'push',
        include_subscription_ids: params.subscriptionIds,
        headings: {
          en: params.title,
        },
        contents: {
          en: params.body,
        },
        data: params.data,
        ...(params.throttleRatePerMinute != null && params.throttleRatePerMinute > 0
          ? { throttle_rate_per_minute: params.throttleRatePerMinute }
          : {}),
      }),
    });

    const json = (await response.json().catch(() => ({}))) as OneSignalApiResponse;
    const invalidSubscriptionIds = extractInvalidSubscriptionIds(json.errors);
    const dispatchErrors = extractDispatchErrors(json.errors);
    const errorSummary = summarizeOneSignalErrors(json.errors);

    if (!response.ok) {
      const errorMessage = enrichOneSignalAuthErrorMessage(
        errorSummary ?? `OneSignal HTTP ${response.status}`,
        keyFormat,
      );
      return failureResult({
        subscriptionIds: params.subscriptionIds,
        invalidSubscriptionIds,
        errorCode: 'onesignal_http_error',
        errorMessage,
      });
    }

    if (!hasNotificationId(json)) {
      const errorMessage = enrichOneSignalAuthErrorMessage(
        errorSummary
        ?? (invalidSubscriptionIds.length > 0
          ? 'OneSignal rejected all subscription ids'
          : 'OneSignal did not create the notification (no valid subscriptions)'),
        keyFormat,
      );
      return failureResult({
        subscriptionIds: params.subscriptionIds,
        invalidSubscriptionIds,
        errorCode: 'onesignal_not_dispatched',
        errorMessage,
      });
    }

    const invalidSet = new Set(invalidSubscriptionIds);
    const eligibleCount = params.subscriptionIds.length - invalidSet.size;
    const reportedRecipients =
      typeof json.recipients === 'number' && json.recipients >= 0
        ? json.recipients
        : undefined;

    // Throttled (or queued) notifications return notification id with recipients: 0.
    // OneSignal still accepted the send; do not treat that as delivery_failed upstream.
    const successCount = reportedRecipients != null && reportedRecipients > 0
      ? Math.min(eligibleCount, reportedRecipients)
      : eligibleCount;
    const failureCount = params.subscriptionIds.length - successCount;
    const results = params.subscriptionIds.map((token) => ({
      tokenPrefix: tokenPrefix(token),
      success: !invalidSet.has(token),
      ...(invalidSet.has(token)
        ? {
            errorCode: 'invalid_subscription_id',
            errorMessage: 'OneSignal rejected this subscription id',
          }
        : {}),
    }));

    return {
      successCount,
      failureCount,
      notificationId: typeof json.id === 'string'
        ? json.id
        : Array.isArray(json.id)
          ? json.id.find((item) => typeof item === 'string' && item.trim().length > 0)
          : undefined,
      errorSummary: dispatchErrors.length > 0 ? dispatchErrors.join('; ') : undefined,
      invalidSubscriptionIds,
      results,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failureResult({
      subscriptionIds: params.subscriptionIds,
      errorCode: 'onesignal_request_failed',
      errorMessage: message,
    });
  }
}

export async function sendOneSignalPushMulticast(params: {
  subscriptionIds: string[];
  title: string;
  body: string;
  data: Record<string, string>;
  throttleRatePerMinute?: number;
}): Promise<OneSignalMulticastResult> {
  const normalized = [...new Set(
    params.subscriptionIds
      .map((item) => item.trim())
      .filter(Boolean),
  )];

  if (normalized.length === 0) {
    return {
      successCount: 0,
      failureCount: 0,
      invalidSubscriptionIds: [],
      results: [],
    };
  }

  const chunks = chunk(normalized, ONESIGNAL_SUBSCRIPTIONS_CHUNK);
  const merged: OneSignalMulticastResult = {
    successCount: 0,
    failureCount: 0,
    notificationId: undefined,
    errorSummary: undefined,
    invalidSubscriptionIds: [],
    results: [],
  };

  for (const ids of chunks) {
    const one = await sendOneSignalChunk({
      subscriptionIds: ids,
      title: params.title,
      body: params.body,
      data: params.data,
      throttleRatePerMinute: params.throttleRatePerMinute,
    });
    merged.successCount += one.successCount;
    merged.failureCount += one.failureCount;
    merged.results.push(...one.results);
    merged.invalidSubscriptionIds.push(...one.invalidSubscriptionIds);
    if (!merged.notificationId && one.notificationId) {
      merged.notificationId = one.notificationId;
    }
    if (!merged.errorSummary && one.errorSummary) {
      merged.errorSummary = one.errorSummary;
    }
  }

  return merged;
}
