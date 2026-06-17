import { Capacitor } from '@capacitor/core';

const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';

function normalizeApiBaseUrl(value: string): string {
  if (!value) {
    return '';
  }

  try {
    const parsed = new URL(value);

    // Android emulator cannot reach host machine via localhost.
    if (
      Capacitor.isNativePlatform()
      && Capacitor.getPlatform() === 'android'
      && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
    ) {
      parsed.hostname = '10.0.2.2';
    }

    // iOS simulator cannot use Android emulator loopback alias.
    if (
      Capacitor.isNativePlatform()
      && Capacitor.getPlatform() === 'ios'
      && parsed.hostname === '10.0.2.2'
    ) {
      parsed.hostname = 'localhost';
    }

    return parsed.origin;
  } catch {
    return value.replace(/\/$/, '');
  }
}

export const API_BASE_URL = normalizeApiBaseUrl(envApiBaseUrl);
export const DEMO_AUTH_ENABLED = import.meta.env.VITE_DEMO_AUTH_ENABLED === 'true';

/** Resolve API path for fetch — uses same-origin `/api/*` in local browser dev so Vite proxy handles backend calls. */
export function resolveApiUrl(path: string): string {
  const isBrowser = typeof window !== 'undefined';
  const isNative = Capacitor.isNativePlatform();
  const isLocalhostBrowser = isBrowser && window.location.hostname === 'localhost';
  const currentOrigin = isBrowser ? window.location.origin : '';

  const shouldForceRelativeApi =
    !isNative
    && isBrowser
    && isLocalhostBrowser
    && path.startsWith('/api/')
    && API_BASE_URL
    && API_BASE_URL !== currentOrigin;

  return shouldForceRelativeApi
    ? path
    : API_BASE_URL
      ? `${API_BASE_URL}${path}`
      : path;
}
