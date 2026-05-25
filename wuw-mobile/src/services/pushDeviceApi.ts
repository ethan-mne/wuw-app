import { API_BASE_URL } from '../lib/config';
import { getMobileSessionToken } from '../lib/mobileSessionToken';

export async function registerPushTokenWithServer(
  token: string,
  platform: 'android' | 'ios',
): Promise<void> {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured.');
  }
  const session = getMobileSessionToken();
  if (!session) {
    throw new Error('Not logged in');
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

export async function getPushDeviceStatusFromServer(): Promise<{
  deviceCount: number;
  platforms: Array<'android' | 'ios'>;
} | null> {
  if (!API_BASE_URL) {
    return null;
  }
  const session = getMobileSessionToken();
  if (!session) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/api/mobile/v1/me/push-token`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as {
    data?: { deviceCount?: number; platforms?: Array<'android' | 'ios'> };
  };
  return {
    deviceCount: json.data?.deviceCount ?? 0,
    platforms: json.data?.platforms ?? [],
  };
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
