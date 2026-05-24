import { defaultLocale, isLocale } from './locales';
import type { Locale } from '../types';

export function resolveLocale(localeParam: string | undefined): Locale {
  return isLocale(localeParam) ? localeParam : defaultLocale;
}
