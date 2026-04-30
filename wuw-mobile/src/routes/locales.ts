import type { Locale } from '../types';

export const locales: Locale[] = ['en', 'es', 'fr'];
export const defaultLocale: Locale = 'en';

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export function withLocale(locale: Locale | undefined, path = '') {
  const activeLocale = locale ?? defaultLocale;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `/${activeLocale}${normalizedPath === '/' ? '' : normalizedPath}`;
}
