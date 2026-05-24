import { db } from '@/server/db';
import { isFirebaseConfiguredForPush } from '@/server/draw-reminders/cron-secrets';
import { sendDrawReminderFcmMulticast } from '@/server/draw-reminders/fcm';
import { isDrawingDateInReminderCronWindow } from '@/server/draw-reminders/window';
import { listCompetitionsForDrawReminders } from '@/server/lightweight/competition/service';

export type DrawReminderEligibilityDebug = {
  competitionId: string;
  ticketHolderEmails: number;
  usersWithPushDevice: number;
  usersWithDrawAlert: number;
  eligibleUsers: number;
  /** Logged-in users with a push token but no ticket email match and no draw alert for this comp. */
  pushOnlyNoEligibility: number;
};

export type DrawReminderUserTargetDebug = {
  userId: string;
  competitionId: string;
  userExists: boolean;
  pushDeviceCount: number;
  hasDrawAlert: boolean;
  hasConfirmedTicket: boolean;
  firebaseConfigured: boolean;
  /** Human-readable reasons no push was sent (empty if ready to send). */
  blockers: string[];
};

export type SendDrawRemindersResult = {
  competitions: number;
  notificationsAttempted: number;
  usersNotified: number;
  skippedReason?: 'firebase_not_configured' | 'no_competitions' | 'competition_not_found';
  competitionIds?: string[];
  debug?: DrawReminderEligibilityDebug[];
  userTarget?: DrawReminderUserTargetDebug;
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

async function getTicketEmailsForCompetition(competitionId: string): Promise<string[]> {
  const orders = await db.order.findMany({
    where: {
      status: 'CONFIRMED',
      Ticket: { some: { competitionId } },
    },
    select: { email: true },
    distinct: ['email'],
  });
  return [...new Set(orders.map((o) => o.email).filter((e) => Boolean(e)))];
}

export async function getUserDrawReminderTargetDebug(
  userId: string,
  competitionId: string,
): Promise<DrawReminderUserTargetDebug> {
  const blockers: string[] = [];
  const firebaseConfigured = isFirebaseConfiguredForPush();
  if (!firebaseConfigured) {
    blockers.push('firebase_not_configured_on_server');
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      pushDevices: { select: { id: true } },
      drawAlertSubscriptions: {
        where: { competitionId },
        select: { id: true },
      },
    },
  });

  if (!user) {
    blockers.push('user_not_found');
    return {
      userId,
      competitionId,
      userExists: false,
      pushDeviceCount: 0,
      hasDrawAlert: false,
      hasConfirmedTicket: false,
      firebaseConfigured,
      blockers,
    };
  }

  const pushDeviceCount = user.pushDevices.length;
  const hasDrawAlert = user.drawAlertSubscriptions.length > 0;
  const ticketEmails = await getTicketEmailsForCompetition(competitionId);
  const hasConfirmedTicket = ticketEmails.includes(user.email);

  if (pushDeviceCount === 0) {
    blockers.push(
      'no_fcm_token_in_database — open the installed Android/iOS app, allow notifications, stay logged in (production API)',
    );
  }

  return {
    userId,
    competitionId,
    userExists: true,
    pushDeviceCount,
    hasDrawAlert,
    hasConfirmedTicket,
    firebaseConfigured,
    blockers,
  };
}

export async function getDrawReminderEligibilityDebug(
  competitionId: string,
): Promise<DrawReminderEligibilityDebug> {
  const ticketEmails = await getTicketEmailsForCompetition(competitionId);

  const [usersWithPushDevice, usersWithDrawAlert, eligibleUsers, pushOnlyNoEligibility] =
    await Promise.all([
      db.user.count({ where: { pushDevices: { some: {} } } }),
      db.user.count({
        where: {
          drawAlertSubscriptions: { some: { competitionId } },
        },
      }),
      db.user.count({
        where: {
          pushDevices: { some: {} },
          OR: [
            ...(ticketEmails.length > 0 ? [{ email: { in: ticketEmails } }] : []),
            { drawAlertSubscriptions: { some: { competitionId } } },
          ],
        },
      }),
      db.user.count({
        where: {
          pushDevices: { some: {} },
          drawAlertSubscriptions: { none: { competitionId } },
          ...(ticketEmails.length > 0 ? { email: { notIn: ticketEmails } } : {}),
        },
      }),
    ]);

  return {
    competitionId,
    ticketHolderEmails: ticketEmails.length,
    usersWithPushDevice,
    usersWithDrawAlert,
    eligibleUsers,
    pushOnlyNoEligibility,
  };
}

async function notifyCompetitionDrawReminder(params: {
  comp: CompetitionReminderRow;
  userId?: string;
  skipAlreadySent?: boolean;
  recordSent?: boolean;
  /** Test only: notify user by id if they have a push token (skip ticket / draw-alert check). */
  bypassEligibility?: boolean;
}): Promise<{ notificationsAttempted: number; usersNotified: number }> {
  const ticketEmails = await getTicketEmailsForCompetition(params.comp.id);

  const users = await db.user.findMany({
    where: {
      ...(params.userId ? { id: params.userId } : {}),
      pushDevices: { some: {} },
      ...(params.skipAlreadySent
        ? {}
        : { drawRemindersSent: { none: { competitionId: params.comp.id } } }),
      ...(params.bypassEligibility
        ? {}
        : {
            OR: [
              ...(ticketEmails.length > 0 ? [{ email: { in: ticketEmails } }] : []),
              { drawAlertSubscriptions: { some: { competitionId: params.comp.id } } },
            ],
          }),
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
  if (!isFirebaseConfiguredForPush()) {
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
  /** Only notify this user; with `userId`, skips ticket/draw-alert requirement (push token only). */
  userId?: string;
  /** Skip cron time window; with no `competitionId`, all ACTIVE upcoming draws. */
  force?: boolean;
  /** Allow resending even if already recorded (default true for test). */
  skipAlreadySent?: boolean;
  /** Write `draw_reminder_sent` after success (default false for test). */
  recordSent?: boolean;
  /** Include per-competition eligibility counts in the response. */
  debug?: boolean;
};

/**
 * Manual / dev trigger: send draw-reminder pushes without waiting for the cron window.
 */
export async function runDrawReminderTest(
  options: DrawReminderTestOptions = {},
): Promise<SendDrawRemindersResult> {
  if (!isFirebaseConfiguredForPush()) {
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
  const bypassEligibility = Boolean(options.userId?.trim());

  const debugRows: DrawReminderEligibilityDebug[] = [];
  if (options.debug) {
    for (const comp of competitions) {
      debugRows.push(await getDrawReminderEligibilityDebug(comp.id));
    }
  }

  let userTarget: DrawReminderUserTargetDebug | undefined;
  const trimmedUserId = options.userId?.trim();
  if (trimmedUserId && competitions[0]) {
    userTarget = await getUserDrawReminderTargetDebug(trimmedUserId, competitions[0].id);
  }

  for (const comp of competitions) {
    const result = await notifyCompetitionDrawReminder({
      comp,
      userId: options.userId,
      skipAlreadySent,
      recordSent,
      bypassEligibility,
    });
    notificationsAttempted += result.notificationsAttempted;
    usersNotified += result.usersNotified;
  }

  return {
    competitions: competitions.length,
    notificationsAttempted,
    usersNotified,
    competitionIds: competitions.map((c) => c.id),
    ...(debugRows.length > 0 ? { debug: debugRows } : {}),
    ...(userTarget ? { userTarget } : {}),
  };
}
