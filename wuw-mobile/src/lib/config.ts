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

    return parsed.origin;
  } catch {
    return value.replace(/\/$/, '');
  }
}

export const API_BASE_URL = normalizeApiBaseUrl(envApiBaseUrl);
export const DEMO_AUTH_ENABLED = import.meta.env.VITE_DEMO_AUTH_ENABLED === 'true';
