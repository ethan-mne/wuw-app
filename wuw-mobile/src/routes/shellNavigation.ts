import type { Locale } from '../types';

/** Bottom-nav and account hub routes: no chrome back affordance needed. */
export const PRIMARY_SHELL_TAIL_PATHS = new Set([
  '',
  'draws',
  'account/dashboard',
  'account/profile',
  'account/history',
  'account/referrals',
  'contact-us',
]);

export function getLocaleTailPath(pathname: string, locale: Locale): string {
  const prefix = `/${locale}`;
  if (pathname === prefix || pathname === `${prefix}/`) {
    return '';
  }
  if (!pathname.startsWith(`${prefix}/`)) {
    return pathname.replace(/^\/+/, '').replace(/\/$/, '');
  }
  return pathname.slice(prefix.length + 1).replace(/\/$/, '');
}

export function shouldShowShellBack(tailPath: string): boolean {
  if (!tailPath) {
    return false;
  }
  return !PRIMARY_SHELL_TAIL_PATHS.has(tailPath);
}

/**
 * Target path segment (passed to `withLocale`) after leaving the current screen.
 * Uses a fixed hierarchy so back works without browser history (PWA / app shell).
 */
export function resolveShellBackTarget(tailPath: string): string {
  const segments = tailPath.split('/').filter(Boolean);

  if (segments[0] === 'competitions' && segments[1]) {
    const competitionId = segments[1];

    if (segments.length === 2) {
      return 'draws';
    }

    if (segments[2] === 'question') {
      return `competitions/${competitionId}`;
    }

    const orderId = segments[2];
    const trailing = segments[3];

    if (trailing === 'confirmation' || trailing === 'error') {
      return `competitions/${competitionId}/${orderId}`;
    }

    return `competitions/${competitionId}`;
  }

  if (tailPath === 'login') {
    return 'account/profile';
  }

  if (tailPath === 'verification') {
    return 'login';
  }

  return '';
}
