import { API_BASE_URL } from '../lib/config';
import { mobileAuthHeaders } from '../lib/mobileSessionToken';

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

export async function apiClient<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const isBrowser = typeof window !== 'undefined';
  const isLocalhostBrowser = isBrowser && window.location.hostname === 'localhost';
  const currentOrigin = isBrowser ? window.location.origin : '';

  // In local dev, force same-origin `/api/*` so Vite proxy handles backend calls
  // and browser CORS preflights never target localhost:3000 directly.
  const shouldForceRelativeApi =
    isLocalhostBrowser
    && path.startsWith('/api/')
    && API_BASE_URL
    && API_BASE_URL !== currentOrigin;

  const requestUrl = shouldForceRelativeApi
    ? path
    : API_BASE_URL
      ? `${API_BASE_URL}${path}`
      : path;

  const response = await fetch(requestUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...mobileAuthHeaders(),
      ...options.headers,
    },
  });

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
