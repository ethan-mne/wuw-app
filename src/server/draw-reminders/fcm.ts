import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

export type FcmTokenSendResult = {
  tokenPrefix: string;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
};

export type FcmMulticastResult = {
  successCount: number;
  failureCount: number;
  firebaseProjectId?: string;
  results: FcmTokenSendResult[];
};

function tokenPrefix(token: string): string {
  if (token.length <= 12) {
    return token;
  }
  return `${token.slice(0, 8)}…${token.slice(-4)}`;
}

export function getFirebaseProjectIdFromEnv(): string | undefined {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(raw) as { project_id?: string };
    return parsed.project_id;
  } catch {
    return undefined;
  }
}

export function getMessagingOrNull() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) {
    return null;
  }
  if (getApps().length === 0) {
    const parsed = JSON.parse(raw) as ServiceAccount;
    initializeApp({ credential: cert(parsed) });
  }
  return getMessaging();
}

export async function sendDrawReminderFcmMulticast(params: {
  tokens: string[];
  title: string;
  body: string;
  data: Record<string, string>;
}): Promise<FcmMulticastResult> {
  const empty: FcmMulticastResult = {
    successCount: 0,
    failureCount: params.tokens.length,
    firebaseProjectId: getFirebaseProjectIdFromEnv(),
    results: params.tokens.map((token) => ({
      tokenPrefix: tokenPrefix(token),
      success: false,
      errorCode: 'messaging_not_configured',
      errorMessage: 'FIREBASE_SERVICE_ACCOUNT_JSON is missing or invalid',
    })),
  };

  const messaging = getMessagingOrNull();
  if (!messaging) {
    return empty;
  }

  const dataPayload = Object.fromEntries(
    Object.entries(params.data).map(([k, v]) => [k, String(v)]),
  );

  const res = await messaging.sendEachForMulticast({
    tokens: params.tokens,
    notification: { title: params.title, body: params.body },
    data: dataPayload,
    android: {
      priority: 'high',
      notification: {
        channelId: 'draw_reminders',
        priority: 'high' as const,
        defaultSound: true,
        defaultVibrateTimings: true,
        visibility: 'public' as const,
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          alert: {
            title: params.title,
            body: params.body,
          },
        },
      },
    },
  });

  const results: FcmTokenSendResult[] = res.responses.map((response, index) => {
    const token = params.tokens[index] ?? '';
    if (response.success) {
      return { tokenPrefix: tokenPrefix(token), success: true };
    }
    return {
      tokenPrefix: tokenPrefix(token),
      success: false,
      errorCode: response.error?.code,
      errorMessage: response.error?.message,
    };
  });

  return {
    successCount: res.successCount,
    failureCount: res.failureCount,
    firebaseProjectId: getFirebaseProjectIdFromEnv(),
    results,
  };
}

/** Remove tokens FCM reports as invalid so the next send does not retry dead devices. */
export async function deleteInvalidFcmTokens(
  tokens: string[],
  results: FcmTokenSendResult[],
): Promise<number> {
  const { db } = await import('@/server/db');
  const invalidCodes = new Set([
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
    'messaging/invalid-argument',
  ]);

  let deleted = 0;
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const token = tokens[i];
    if (!result || result.success || !token || !result.errorCode) {
      continue;
    }
    if (!invalidCodes.has(result.errorCode)) {
      continue;
    }
    const removed = await db.userPushDevice.deleteMany({ where: { token } });
    deleted += removed.count;
  }
  return deleted;
}
