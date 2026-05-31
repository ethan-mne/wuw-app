import { API_BASE_URL } from '../lib/config';
import { mobileAuthHeaders } from '../lib/mobileSessionToken';

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

export async function apiClient<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
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
