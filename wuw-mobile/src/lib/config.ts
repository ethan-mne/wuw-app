const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';

const localhostFallback =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? ''
    : '';

export const API_BASE_URL = envApiBaseUrl || localhostFallback;
export const DEMO_AUTH_ENABLED = import.meta.env.VITE_DEMO_AUTH_ENABLED === 'true';
