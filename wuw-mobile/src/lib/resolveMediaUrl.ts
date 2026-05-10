import { API_BASE_URL } from './config';

/**
 * Turns API-relative image paths into absolute URLs using the API origin.
 * Full URLs and protocol-relative URLs are left usable as-is.
 */
export function resolveMediaUrl(url: string | undefined | null): string {
  if (url == null) {
    return '';
  }
  const trimmed = url.trim();
  if (trimmed === '') {
    return '';
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    if (typeof window !== 'undefined' && window.location?.protocol) {
      return `${window.location.protocol}${trimmed}`;
    }
    return `https:${trimmed}`;
  }
  if (!API_BASE_URL) {
    return trimmed;
  }
  const base = API_BASE_URL.replace(/\/$/, '');
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}
