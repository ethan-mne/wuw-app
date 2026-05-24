import { invalidateUserCachedData } from './dataCache';
import { unregisterPushDeviceIfAny } from './pushNotifications';

const STORAGE_KEY = 'wuw_mobile_session_token';

export function getMobileSessionToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function notifySessionChanged(): void {
  try {
    window.dispatchEvent(new Event('wuw-mobile-session'));
  } catch {
    /* ignore */
  }
}

export function setMobileSessionToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    notifySessionChanged();
  } catch {
    /* ignore quota / private mode */
  }
}

/** Clears the mobile JWT and best-effort unregisters push with the backend (native only). */
export async function clearMobileSession(): Promise<void> {
  try {
    await unregisterPushDeviceIfAny();
  } catch {
    /* ignore */
  }
  setMobileSessionToken(null);
  invalidateUserCachedData();
}

export function mobileAuthHeaders(): Record<string, string> {
  const token = getMobileSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
