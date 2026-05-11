const STORAGE_KEY = 'wuw_mobile_session_token';

export function getMobileSessionToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setMobileSessionToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export function mobileAuthHeaders(): Record<string, string> {
  const token = getMobileSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
