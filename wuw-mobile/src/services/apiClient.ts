import { API_BASE_URL, resolveApiUrl } from '../lib/config';
import { mobileAuthHeaders } from '../lib/mobileSessionToken';
import { Capacitor } from '@capacitor/core';

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

export async function apiClient<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const isNative = Capacitor.isNativePlatform();
  const requestUrl = resolveApiUrl(path);

  if (isNative && !API_BASE_URL && path.startsWith('/api/')) {
    throw new Error(
      'VITE_API_BASE_URL is not configured. Rebuild the app with a valid API URL.',
    );
  }

  let response: Response;
  try {
    response = await fetch(requestUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...mobileAuthHeaders(),
        ...options.headers,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Network request failed';
    if (detail === 'Load failed' || detail === 'Failed to fetch') {
      throw new Error(
        `Cannot reach API at ${requestUrl}. Check VITE_API_BASE_URL and your network connection.`,
      );
    }
    throw error instanceof Error ? error : new Error(detail);
  }

  if (!response.ok) {
    let message = `API request failed with status ${response.status}.`;
    try {
      const json = (await response.json()) as { error?: unknown; message?: unknown };
      const detail =
        typeof json.error === 'string'
          ? json.error
          : typeof json.message === 'string'
            ? json.message
            : null;
      if (detail) {
        message = detail;
      }
    } catch {
      // Keep generic message when body is not JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<TResponse>;
}
