import { env } from '@/env';
import { db } from '@/server/db';
import { sendDrawReminderFcmMulticast } from '@/server/draw-reminders/fcm';
import { isDrawingDateInReminderCronWindow } from '@/server/draw-reminders/window';
import { listCompetitionsForDrawReminders } from '@/server/lightweight/competition/service';

export type SendDrawRemindersResult = {
  competitions: number;
  notificationsAttempted: number;
  usersNotified: number;
  skippedReason?: 'firebase_not_configured' | 'no_competitions' | 'competition_not_found';
  competitionIds?: string[];
};

type CompetitionReminderRow = {
  id: string;
  name: string;
  drawing_date: Date;
};

async function loadCompetitionsForReminderRun(
  now: Date,
  opts?: { competitionId?: string; force?: boolean },
): Promise<CompetitionReminderRow[]> {
  const trimmedId = opts?.competitionId?.trim();

  if (trimmedId) {
    const comp = await db.competition.findUnique({
      where: { id: trimmedId },
      select: { id: true, name: true, drawing_date: true, status: true },
    });
    if (!comp) {
      return [];
    }
    if (!opts?.force) {
      if (comp.status !== 'ACTIVE') {
        return [];
      }
      if (!isDrawingDateInReminderCronWindow({ drawingDate: comp.drawing_date, now })) {
        return [];
      }
    }
    return [{ id: comp.id, name: comp.name, drawing_date: comp.drawing_date }];
  }

  if (opts?.force) {
    return db.competition.findMany({
      where: {
        status: 'ACTIVE',
        drawing_date: { gt: now },
      },
      select: { id: true, name: true, drawing_date: true },
      orderBy: { drawing_date: 'asc' },
    });
  }

  return listCompetitionsForDrawReminders(now);
}

async function notifyCompetitionDrawReminder(params: {
  comp: CompetitionReminderRow;
  userId?: string;
  skipAlreadySent?: boolean;
  recordSent?: boolean;
}): Promise<{ notificationsAttempted: number; usersNotified: number }> {
  const orders = await db.order.findMany({
    where: {
      status: 'CONFIRMED',
      Ticket: { some: { competitionId: params.comp.id } },
    },
    select: { email: true },
    distinct: ['email'],
  });
  const ticketEmails = [...new Set(orders.map((o) => o.email).filter((e) => Boolean(e)))];

  const users = await db.user.findMany({
    where: {
      ...(params.userId ? { id: params.userId } : {}),
      pushDevices: { some: {} },
      ...(params.skipAlreadySent
        ? {}
        : { drawRemindersSent: { none: { competitionId: params.comp.id } } }),
      OR: [
        ...(ticketEmails.length > 0 ? [{ email: { in: ticketEmails } }] : []),
        { drawAlertSubscriptions: { some: { competitionId: params.comp.id } } },
      ],
    },
    select: {
      id: true,
      pushDevices: { select: { token: true } },
    },
  });

  if (users.length === 0) {
    return { notificationsAttempted: 0, usersNotified: 0 };
  }

  const title = 'Draw starting soon';
  const body = `${params.comp.name} — the draw is in 10 minutes.`;

  let notificationsAttempted = 0;
  let usersNotified = 0;

  for (const user of users) {
    const tokens = user.pushDevices.map((d) => d.token);
    if (tokens.length === 0) {
      continue;
    }

    const ok = await sendDrawReminderFcmMulticast({
      tokens,
      title,
      body,
      data: {
        competitionId: params.comp.id,
        type: 'draw_reminder',
      },
    });
    notificationsAttempted += tokens.length;
    if (ok) {
      if (params.recordSent !== false) {
        await db.drawReminderSent.upsert({
          where: {
            userId_competitionId: {
              userId: user.id,
              competitionId: params.comp.id,
            },
          },
          create: { userId: user.id, competitionId: params.comp.id },
          update: {},
        });
      }
      usersNotified += 1;
    }
  }

  return { notificationsAttempted, usersNotified };
}

/** Production cron: competitions in the ~10-minute-before-draw window. */
export async function runDrawReminderJob(now: Date): Promise<SendDrawRemindersResult> {
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) {
    return {
      competitions: 0,
      notificationsAttempted: 0,
      usersNotified: 0,
      skippedReason: 'firebase_not_configured',
    };
  }

  const competitions = await loadCompetitionsForReminderRun(now);
  if (competitions.length === 0) {
    return {
      competitions: 0,
      notificationsAttempted: 0,
      usersNotified: 0,
      skippedReason: 'no_competitions',
    };
  }

  let notificationsAttempted = 0;
  let usersNotified = 0;

  for (const comp of competitions) {
    const result = await notifyCompetitionDrawReminder({
      comp,
      recordSent: true,
    });
    notificationsAttempted += result.notificationsAttempted;
    usersNotified += result.usersNotified;
  }

  return {
    competitions: competitions.length,
    notificationsAttempted,
    usersNotified,
    competitionIds: competitions.map((c) => c.id),
  };
}

export type DrawReminderTestOptions = {
  /** Target one competition; omit to use cron window (or all upcoming if `force`). */
  competitionId?: string;
  /** Only notify this user (must have a push token and qualify for the draw). */
  userId?: string;
  /** Skip cron time window; with no `competitionId`, all ACTIVE upcoming draws. */
  force?: boolean;
  /** Allow resending even if already recorded (default true for test). */
  skipAlreadySent?: boolean;
  /** Write `draw_reminder_sent` after success (default false for test). */
  recordSent?: boolean;
};

/**
 * Manual / dev trigger: send draw-reminder pushes without waiting for the cron window.
 */
export async function runDrawReminderTest(
  options: DrawReminderTestOptions = {},
): Promise<SendDrawRemindersResult> {
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) {
    return {
      competitions: 0,
      notificationsAttempted: 0,
      usersNotified: 0,
      skippedReason: 'firebase_not_configured',
    };
  }

  const now = new Date();
  const competitions = await loadCompetitionsForReminderRun(now, {
    competitionId: options.competitionId,
    force: options.force ?? true,
  });

  if (options.competitionId?.trim() && competitions.length === 0) {
    return {
      competitions: 0,
      notificationsAttempted: 0,
      usersNotified: 0,
      skippedReason: 'competition_not_found',
    };
  }

  if (competitions.length === 0) {
    return {
      competitions: 0,
      notificationsAttempted: 0,
      usersNotified: 0,
      skippedReason: 'no_competitions',
    };
  }

  let notificationsAttempted = 0;
  let usersNotified = 0;

  const skipAlreadySent = options.skipAlreadySent ?? true;
  const recordSent = options.recordSent ?? false;

  for (const comp of competitions) {
    const result = await notifyCompetitionDrawReminder({
      comp,
      userId: options.userId,
      skipAlreadySent,
      recordSent,
    });
    notificationsAttempted += result.notificationsAttempted;
    usersNotified += result.usersNotified;
  }

  return {
    competitions: competitions.length,
    notificationsAttempted,
    usersNotified,
    competitionIds: competitions.map((c) => c.id),
  };
}
