import { API_BASE_URL } from '../lib/config';
import { getMobileSessionToken } from '../lib/mobileSessionToken';

export async function registerPushTokenWithServer(
  token: string,
  platform: 'android' | 'ios',
): Promise<void> {
  if (!API_BASE_URL) {
    return;
  }
  const session = getMobileSessionToken();
  if (!session) {
    return;
  }

  const response = await fetch(`${API_BASE_URL}/api/mobile/v1/me/push-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session}`,
    },
    body: JSON.stringify({ token, platform }),
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) {
        detail = body.error;
      }
    } catch {
      /* ignore */
    }
    throw new Error(`push-token register failed: ${detail}`);
  }
}

export async function unregisterPushTokenWithServer(token: string): Promise<void> {
  if (!API_BASE_URL) {
    return;
  }
  const session = getMobileSessionToken();
  if (!session) {
    return;
  }

  await fetch(`${API_BASE_URL}/api/mobile/v1/me/push-token`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session}`,
    },
    body: JSON.stringify({ token }),
  });
}
