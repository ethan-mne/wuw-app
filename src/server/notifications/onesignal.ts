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
  results: OneSignalTokenResult[];
  invalidSubscriptionIds: string[];
};

type OneSignalApiResponse = {
  id?: string;
  recipients?: number;
  errors?: unknown;
};

const ONESIGNAL_API_URL = 'https://api.onesignal.com/notifications';
const ONESIGNAL_SUBSCRIPTIONS_CHUNK = 2_000;

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
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY?.trim();
  if (!appId || !restApiKey) {
    return null;
  }
  return { appId, restApiKey };
}

export function isOneSignalConfigured(): boolean {
  return getOneSignalConfig() != null;
}

function extractInvalidSubscriptionIds(errors: unknown): string[] {
  if (typeof errors !== 'object' || errors == null) {
    return [];
  }
  const root = errors as Record<string, unknown>;
  const value = root.invalid_player_ids;
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function sendOneSignalChunk(params: {
  subscriptionIds: string[];
  title: string;
  body: string;
  data: Record<string, string>;
}): Promise<OneSignalMulticastResult> {
  const config = getOneSignalConfig();
  if (!config) {
    return {
      successCount: 0,
      failureCount: params.subscriptionIds.length,
      invalidSubscriptionIds: [],
      results: params.subscriptionIds.map((token) => ({
        tokenPrefix: tokenPrefix(token),
        success: false,
        errorCode: 'onesignal_not_configured',
        errorMessage: 'ONESIGNAL_APP_ID / ONESIGNAL_REST_API_KEY missing',
      })),
    };
  }

  try {
    const response = await fetch(ONESIGNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${config.restApiKey}`,
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
      }),
    });

    const json = (await response.json().catch(() => ({}))) as OneSignalApiResponse;
    if (!response.ok) {
      const errorMessage =
        typeof json.errors === 'string'
          ? json.errors
          : `OneSignal HTTP ${response.status}`;
      return {
        successCount: 0,
        failureCount: params.subscriptionIds.length,
        invalidSubscriptionIds: [],
        results: params.subscriptionIds.map((token) => ({
          tokenPrefix: tokenPrefix(token),
          success: false,
          errorCode: 'onesignal_http_error',
          errorMessage,
        })),
      };
    }

    const invalidSubscriptionIds = new Set(extractInvalidSubscriptionIds(json.errors));
    const recipients =
      typeof json.recipients === 'number' && json.recipients >= 0
        ? json.recipients
        : params.subscriptionIds.length - invalidSubscriptionIds.size;

    const successCount = Math.max(
      0,
      Math.min(params.subscriptionIds.length - invalidSubscriptionIds.size, recipients),
    );
    const failureCount = params.subscriptionIds.length - successCount;
    const results = params.subscriptionIds.map((token) => ({
      tokenPrefix: tokenPrefix(token),
      success: !invalidSubscriptionIds.has(token),
      ...(invalidSubscriptionIds.has(token)
        ? {
            errorCode: 'invalid_subscription_id',
            errorMessage: 'OneSignal rejected this subscription id',
          }
        : {}),
    }));

    return {
      successCount,
      failureCount,
      notificationId: typeof json.id === 'string' ? json.id : undefined,
      invalidSubscriptionIds: [...invalidSubscriptionIds],
      results,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      successCount: 0,
      failureCount: params.subscriptionIds.length,
      invalidSubscriptionIds: [],
      results: params.subscriptionIds.map((token) => ({
        tokenPrefix: tokenPrefix(token),
        success: false,
        errorCode: 'onesignal_request_failed',
        errorMessage: message,
      })),
    };
  }
}

export async function sendOneSignalPushMulticast(params: {
  subscriptionIds: string[];
  title: string;
  body: string;
  data: Record<string, string>;
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
    invalidSubscriptionIds: [],
    results: [],
  };

  for (const ids of chunks) {
    const one = await sendOneSignalChunk({
      subscriptionIds: ids,
      title: params.title,
      body: params.body,
      data: params.data,
    });
    merged.successCount += one.successCount;
    merged.failureCount += one.failureCount;
    merged.results.push(...one.results);
    merged.invalidSubscriptionIds.push(...one.invalidSubscriptionIds);
    if (!merged.notificationId && one.notificationId) {
      merged.notificationId = one.notificationId;
    }
  }

  return merged;
}
