import { ApnsClient, Host, Notification, Errors, ApnsError } from 'apns2';

export type ApnsTokenSendResult = {
  tokenPrefix: string;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
};

export type ApnsMulticastResult = {
  successCount: number;
  failureCount: number;
  results: ApnsTokenSendResult[];
};

export type ApnsEnvironment = 'sandbox' | 'production';

function tokenPrefix(token: string): string {
  if (token.length <= 12) {
    return token;
  }
  return `${token.slice(0, 8)}…${token.slice(-4)}`;
}

function normalizeP8Key(raw: string): Buffer {
  return Buffer.from(raw.replace(/\\n/g, '\n'), 'utf8');
}

type ApnsConfig = {
  keyId: string;
  teamId: string;
  signingKey: Buffer;
  bundleId: string;
};

function getApnsConfig(): ApnsConfig | null {
  const keyId = process.env.APNS_KEY_ID?.trim();
  const teamId = process.env.APNS_TEAM_ID?.trim();
  const keyP8 = process.env.APNS_KEY_P8?.trim();
  const bundleId = process.env.APNS_BUNDLE_ID?.trim() ?? 'com.winuwatch.wuwapp';

  if (!keyId || !teamId || !keyP8) {
    return null;
  }

  return {
    keyId,
    teamId,
    signingKey: normalizeP8Key(keyP8),
    bundleId,
  };
}

export function isApnsConfiguredForPush(): boolean {
  return getApnsConfig() != null;
}

export function getDefaultApnsEnvironment(): ApnsEnvironment {
  const raw = process.env.APNS_PRODUCTION?.trim().toLowerCase();
  if (raw === 'false' || raw === '0') {
    return 'sandbox';
  }
  return 'production';
}

const clientCache = new Map<ApnsEnvironment, ApnsClient>();

function getApnsClient(environment: ApnsEnvironment): ApnsClient | null {
  const config = getApnsConfig();
  if (!config) {
    return null;
  }

  let client = clientCache.get(environment);
  if (!client) {
    client = new ApnsClient({
      team: config.teamId,
      keyId: config.keyId,
      signingKey: config.signingKey,
      defaultTopic: config.bundleId,
      host: environment === 'production' ? Host.production : Host.development,
    });
    clientCache.set(environment, client);
  }
  return client;
}

function emptyResult(tokens: string[], message: string): ApnsMulticastResult {
  return {
    successCount: 0,
    failureCount: tokens.length,
    results: tokens.map((token) => ({
      tokenPrefix: tokenPrefix(token),
      success: false,
      errorCode: 'apns_not_configured',
      errorMessage: message,
    })),
  };
}

export async function sendDrawReminderApnsMulticast(params: {
  tokens: string[];
  title: string;
  body: string;
  data: Record<string, string>;
  environment: ApnsEnvironment;
}): Promise<ApnsMulticastResult> {
  if (params.tokens.length === 0) {
    return { successCount: 0, failureCount: 0, results: [] };
  }

  const client = getApnsClient(params.environment);
  if (!client) {
    return emptyResult(params.tokens, 'APNS_KEY_ID / APNS_TEAM_ID / APNS_KEY_P8 missing or invalid');
  }

  const notifications = params.tokens.map(
    (deviceToken) =>
      new Notification(deviceToken, {
        aps: {
          alert: { title: params.title, body: params.body },
          sound: 'default',
        },
        ...params.data,
      }),
  );

  const results: ApnsTokenSendResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  try {
    const responses = await client.sendMany(notifications);

    for (let i = 0; i < params.tokens.length; i++) {
      const token = params.tokens[i] ?? '';
      const response = responses[i];

      if (response && 'error' in response && response.error instanceof ApnsError) {
        failureCount += 1;
        results.push({
          tokenPrefix: tokenPrefix(token),
          success: false,
          errorCode: response.error.reason,
          errorMessage: response.error.message,
        });
        continue;
      }

      successCount += 1;
      results.push({ tokenPrefix: tokenPrefix(token), success: true });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return emptyResult(params.tokens, msg);
  }

  return { successCount, failureCount, results };
}

const INVALID_APNS_REASONS = new Set<string>([
  Errors.badDeviceToken,
  Errors.unregistered,
  Errors.deviceTokenNotForTopic,
  Errors.badTopic,
]);

/** Remove tokens APNs reports as invalid so the next send does not retry dead devices. */
export async function deleteInvalidApnsTokens(
  tokens: string[],
  results: ApnsTokenSendResult[],
): Promise<number> {
  const { db } = await import('@/server/db');

  let deleted = 0;
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const token = tokens[i];
    if (!result || result.success || !token || !result.errorCode) {
      continue;
    }
    if (!INVALID_APNS_REASONS.has(result.errorCode)) {
      continue;
    }
    const removed = await db.userPushDevice.deleteMany({ where: { token } });
    deleted += removed.count;
  }
  return deleted;
}
