/**
 * Turns API-relative or bare CDN paths into absolute URLs.
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
    return `https:${trimmed}`;
  }
  if (/^[\w.-]+\.amazonaws\.com(\/|$)/i.test(trimmed) || /\.s3[.-][\w.-]+\.amazonaws\.com(\/|$)/i.test(trimmed)) {
    return `https://${trimmed.replace(/^\/+/, '')}`;
  }
  const base = (
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? ''
  ).replace(/\/$/, '');
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return base ? `${base}${path}` : trimmed;
}
