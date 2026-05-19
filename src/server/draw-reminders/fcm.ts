import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

import { env } from '@/env';

export function getMessagingOrNull() {
  const raw = env.FIREBASE_SERVICE_ACCOUNT_JSON;
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
}): Promise<boolean> {
  const messaging = getMessagingOrNull();
  if (!messaging) {
    return false;
  }

  const dataPayload = Object.fromEntries(
    Object.entries(params.data).map(([k, v]) => [k, String(v)]),
  );

  const res = await messaging.sendEachForMulticast({
    tokens: params.tokens,
    notification: { title: params.title, body: params.body },
    data: dataPayload,
  });
  return res.successCount > 0;
}
