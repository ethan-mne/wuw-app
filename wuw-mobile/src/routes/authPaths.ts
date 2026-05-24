import { defaultLocale, isLocale, withLocale } from './locales';
import type { Locale } from '../types';

export function resolveLocale(localeParam: string | undefined): Locale {
  return isLocale(localeParam) ? localeParam : defaultLocale;
}

export function isPublicAuthPath(pathname: string, locale: Locale): boolean {
  const loginPath = withLocale(locale, 'login');
  const verificationPath = withLocale(locale, 'verification');
  return pathname === loginPath || pathname === verificationPath;
}

export function shouldRequireLogin(pathname: string, locale: Locale): boolean {
  return !isPublicAuthPath(pathname, locale);
}
