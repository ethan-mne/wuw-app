import { randomBytes } from 'node:crypto';

import { env } from '@/env';
import { db } from '@/server/db';
import { requireMobileSession } from '@/server/mobile/auth.service';
import { MobileHttpError } from '@/server/mobile/http';

export type CalendarFeedCompetition = {
  id: string;
  name: string;
  drawingDate: Date;
  endDate: Date;
  updatedAt: Date;
  drawScheduleVersion: string;
};

export type CalendarFeedSubscriptionDto = {
  httpsUrl: string;
  webcalUrl: string;
  tokenPreview: string;
};

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function calendarFeedTokenPreview(token: string): string {
  if (token.length <= 10) {
    return token;
  }
  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

function randomCalendarFeedToken(): string {
  return randomBytes(32).toString('hex');
}

function normalizeCalendarFeedToken(raw: string): string {
  return raw.trim().toLowerCase();
}

function isValidCalendarFeedToken(raw: string): boolean {
  return /^[a-f0-9]{64}$/.test(raw);
}

function calendarFeedPathFromToken(token: string): string {
  return `/api/calendar/subscription/${encodeURIComponent(token)}`;
}

function buildCalendarFeedUrls(token: string): { httpsUrl: string; webcalUrl: string } {
  const base = trimTrailingSlash(env.BASE_URL);
  const httpsUrl = `${base}${calendarFeedPathFromToken(token)}`;
  const webcalUrl = httpsUrl.replace(/^https?:\/\//i, 'webcal://');
  return { httpsUrl, webcalUrl };
}

async function ensureActiveCalendarFeedTokenForUser(userId: string): Promise<string> {
  const existing = await db.user.findUnique({
    where: { id: userId },
    select: {
      calendarFeedToken: true,
      calendarFeedTokenRevokedAt: true,
    },
  });

  if (!existing) {
    throw new MobileHttpError('User not found', 404);
  }

  if (existing.calendarFeedToken && existing.calendarFeedTokenRevokedAt == null) {
    return existing.calendarFeedToken;
  }

  const token = randomCalendarFeedToken();
  await db.user.update({
    where: { id: userId },
    data: {
      calendarFeedToken: token,
      calendarFeedTokenCreatedAt: new Date(),
      calendarFeedTokenRevokedAt: null,
    },
  });
  return token;
}

export function drawScheduleVersionFromDates(drawingDate: Date, endDate: Date): string {
  return `v1:${drawingDate.toISOString()}|${endDate.toISOString()}`;
}

export function calendarEventSequenceFromUpdatedAt(updatedAt: Date): number {
  const value = Math.floor(updatedAt.getTime() / 1000);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

export async function listCalendarFeedCompetitionsForUser(input: {
  userId: string;
  email: string;
  now?: Date;
}): Promise<CalendarFeedCompetition[]> {
  const email = input.email.trim();
  if (!email) {
    return [];
  }
  const now = input.now ?? new Date();
  const rows = await db.competition.findMany({
    where: {
      drawing_date: { gt: now },
      OR: [
        {
          Ticket: {
            some: {
              Order: {
                email,
                status: 'CONFIRMED',
              },
            },
          },
        },
        {
          DrawAlertSubscription: {
            some: {
              userId: input.userId,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      drawing_date: true,
      end_date: true,
      updatedAt: true,
    },
    orderBy: {
      drawing_date: 'asc',
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    drawingDate: row.drawing_date,
    endDate: row.end_date,
    updatedAt: row.updatedAt,
    drawScheduleVersion: drawScheduleVersionFromDates(row.drawing_date, row.end_date),
  }));
}

export async function getCalendarFeedSubscriptionForCurrentUser(): Promise<CalendarFeedSubscriptionDto> {
  const { userId } = await requireMobileSession('userId');
  const token = await ensureActiveCalendarFeedTokenForUser(userId);
  const urls = buildCalendarFeedUrls(token);
  return {
    httpsUrl: urls.httpsUrl,
    webcalUrl: urls.webcalUrl,
    tokenPreview: calendarFeedTokenPreview(token),
  };
}

export async function regenerateCalendarFeedTokenForCurrentUser(): Promise<CalendarFeedSubscriptionDto> {
  const { userId } = await requireMobileSession('userId');
  const token = randomCalendarFeedToken();
  await db.user.update({
    where: { id: userId },
    data: {
      calendarFeedToken: token,
      calendarFeedTokenCreatedAt: new Date(),
      calendarFeedTokenRevokedAt: null,
    },
  });
  const urls = buildCalendarFeedUrls(token);
  return {
    httpsUrl: urls.httpsUrl,
    webcalUrl: urls.webcalUrl,
    tokenPreview: calendarFeedTokenPreview(token),
  };
}

export async function revokeCalendarFeedTokenForCurrentUser(): Promise<void> {
  const { userId } = await requireMobileSession('userId');
  await db.user.update({
    where: { id: userId },
    data: {
      calendarFeedTokenRevokedAt: new Date(),
    },
  });
}

export async function resolveCalendarFeedIdentityByToken(rawToken: string): Promise<{
  userId: string;
  email: string;
} | null> {
  const token = normalizeCalendarFeedToken(rawToken);
  if (!isValidCalendarFeedToken(token)) {
    return null;
  }

  const user = await db.user.findFirst({
    where: {
      calendarFeedToken: token,
      calendarFeedTokenRevokedAt: null,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user?.email?.trim()) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
  };
}
