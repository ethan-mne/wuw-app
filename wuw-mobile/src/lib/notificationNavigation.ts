import type { NavigateFunction } from 'react-router-dom';

import { defaultLocale, isLocale, withLocale } from '../routes/locales';
import type { Locale } from '../types';

const PENDING_COMPETITION_KEY = 'wuw_pending_notification_competition';
const PENDING_NOTIFICATION_TYPE_KEY = 'wuw_pending_notification_type';

let navigateFn: NavigateFunction | null = null;
let pendingCompetitionId: string | null = null;
let pendingNotificationType: string | null = null;

export function extractCompetitionIdFromNotificationPayload(payload: unknown): string | null {
  if (payload == null) {
    return null;
  }

  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (!trimmed) {
      return null;
    }
    if (trimmed.startsWith('{')) {
      try {
        return extractCompetitionIdFromNotificationPayload(JSON.parse(trimmed) as unknown);
      } catch {
        return null;
      }
    }
    return null;
  }

  if (typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const direct = record.competitionId ?? record.competition_id;
  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }

  for (const nestedKey of ['data', 'extra', 'additionalData', 'custom'] as const) {
    const nested = record[nestedKey];
    if (nested == null) {
      continue;
    }
    const extracted = extractCompetitionIdFromNotificationPayload(nested);
    if (extracted) {
      return extracted;
    }
  }

  return null;
}

export function extractNotificationTypeFromPayload(payload: unknown): string | null {
  if (payload == null) {
    return null;
  }

  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (!trimmed) {
      return null;
    }
    if (trimmed.startsWith('{')) {
      try {
        return extractNotificationTypeFromPayload(JSON.parse(trimmed) as unknown);
      } catch {
        return null;
      }
    }
    return null;
  }

  if (typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const direct = record.type;
  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }

  for (const nestedKey of ['data', 'extra', 'additionalData', 'custom'] as const) {
    const nested = record[nestedKey];
    if (nested == null) {
      continue;
    }
    const extracted = extractNotificationTypeFromPayload(nested);
    if (extracted) {
      return extracted;
    }
  }

  return null;
}

function queueNotificationType(notificationType: string): void {
  const trimmed = notificationType.trim();
  if (!trimmed) {
    return;
  }
  pendingNotificationType = trimmed;
  try {
    sessionStorage.setItem(PENDING_NOTIFICATION_TYPE_KEY, trimmed);
  } catch {
    /* ignore */
  }
}

export function peekPendingNotificationType(): string | null {
  if (pendingNotificationType) {
    return pendingNotificationType;
  }
  try {
    const stored = sessionStorage.getItem(PENDING_NOTIFICATION_TYPE_KEY)?.trim() ?? '';
    return stored || null;
  } catch {
    return null;
  }
}

export function consumePendingNotificationType(): string | null {
  if (pendingNotificationType) {
    const type = pendingNotificationType;
    pendingNotificationType = null;
    try {
      sessionStorage.removeItem(PENDING_NOTIFICATION_TYPE_KEY);
    } catch {
      /* ignore */
    }
    return type;
  }

  try {
    const stored = sessionStorage.getItem(PENDING_NOTIFICATION_TYPE_KEY)?.trim() ?? '';
    sessionStorage.removeItem(PENDING_NOTIFICATION_TYPE_KEY);
    return stored || null;
  } catch {
    return null;
  }
}

export function wasOpenedFromCompetitionNewNotification(): boolean {
  return peekPendingNotificationType() === 'competition_new';
}

export function currentLocaleFromPath(pathname: string = window.location.pathname): Locale {
  const segment = pathname.split('/').filter(Boolean)[0];
  return isLocale(segment) ? segment : defaultLocale;
}

export function competitionDetailPath(competitionId: string, locale?: Locale): string {
  const trimmed = competitionId.trim();
  return withLocale(locale ?? currentLocaleFromPath(), `competitions/${trimmed}`);
}

export function registerNotificationNavigator(navigate: NavigateFunction | null): void {
  navigateFn = navigate;
}

export function queueCompetitionNavigation(competitionId: string): void {
  const trimmed = competitionId.trim();
  if (!trimmed) {
    return;
  }
  pendingCompetitionId = trimmed;
  try {
    sessionStorage.setItem(PENDING_COMPETITION_KEY, trimmed);
  } catch {
    /* ignore */
  }
}

export function consumePendingCompetitionNavigation(): string | null {
  if (pendingCompetitionId) {
    const id = pendingCompetitionId;
    pendingCompetitionId = null;
    try {
      sessionStorage.removeItem(PENDING_COMPETITION_KEY);
    } catch {
      /* ignore */
    }
    return id;
  }

  try {
    const stored = sessionStorage.getItem(PENDING_COMPETITION_KEY)?.trim() ?? '';
    sessionStorage.removeItem(PENDING_COMPETITION_KEY);
    return stored || null;
  } catch {
    return null;
  }
}

export function openCompetitionFromNotification(competitionId: string): void {
  const trimmed = competitionId.trim();
  if (!trimmed) {
    return;
  }

  const path = competitionDetailPath(trimmed);
  if (navigateFn) {
    navigateFn(path);
    return;
  }

  queueCompetitionNavigation(trimmed);
}

export function handleNotificationOpenPayload(payload: unknown): boolean {
  const notificationType = extractNotificationTypeFromPayload(payload);
  if (notificationType) {
    queueNotificationType(notificationType);
  }

  const competitionId = extractCompetitionIdFromNotificationPayload(payload);
  if (!competitionId) {
    return false;
  }
  openCompetitionFromNotification(competitionId);
  return true;
}
