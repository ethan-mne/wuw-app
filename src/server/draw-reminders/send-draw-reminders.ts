import { db } from '@/server/db';
import { isFirebaseConfiguredForPush } from '@/server/draw-reminders/cron-secrets';
import {
  deleteInvalidFcmTokens,
  sendDrawReminderFcmMulticast,
  type FcmMulticastResult,
} from '@/server/draw-reminders/fcm';
import { findDrawReminderRecipientUsers } from '@/server/draw-reminders/recipients';
import { isDrawingDateInReminderCronWindow } from '@/server/draw-reminders/window';
import { listCompetitionsForDrawReminders } from '@/server/lightweight/competition/service';

export type DrawReminderEligibilityDebug = {
  competitionId: string;
  usersWithPushDevice: number;
  usersWithDrawAlert: number;
  /** Users with draw alert + FCM token registered for this competition. */
  eligibleUsers: number;
  /** Push token registered but no draw alert for this competition. */
  pushWithoutDrawAlert: number;
};

export type DrawReminderUserTargetDebug = {
  userId: string;
  competitionId: string;
  userExists: boolean;
  pushDeviceCount: number;
  /** Total rows in user_push_device (all users) — 0 means no device ever registered on prod. */
  totalPushDevicesInDb: number;
  hasDrawAlert: boolean;
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
  /** Present in test mode when FCM was called (includes per-token error codes). */
  fcmDelivery?: FcmMulticastResult & { invalidTokensRemoved?: number };
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

export async function getUserDrawReminderTargetDebug(
  userId: string,
  competitionId: string,
): Promise<DrawReminderUserTargetDebug> {
  const blockers: string[] = [];
  const firebaseConfigured = isFirebaseConfiguredForPush();
  const totalPushDevicesInDb = await db.userPushDevice.count();
  if (!firebaseConfigured) {
    blockers.push('firebase_not_configured_on_server');
  }
  if (totalPushDevicesInDb === 0) {
    blockers.push(
      'no_push_devices_anywhere_in_db — mobile app never POSTed /api/mobile/v1/me/push-token successfully (rebuild app, allow notifications, tap Remind me)',
    );
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
      totalPushDevicesInDb,
      hasDrawAlert: false,
      firebaseConfigured,
      blockers,
    };
  }

  const pushDeviceCount = user.pushDevices.length;
  const hasDrawAlert = user.drawAlertSubscriptions.length > 0;

  if (pushDeviceCount === 0) {
    blockers.push(
      'no_fcm_token_in_database — tap Remind me in the app with notifications allowed (registers token + draw alert)',
    );
  }
  if (!hasDrawAlert) {
    blockers.push('no_draw_alert_subscription — tap Remind me for this competition in the app');
  }

  return {
    userId,
    competitionId,
    userExists: true,
    pushDeviceCount,
    totalPushDevicesInDb,
    hasDrawAlert,
    firebaseConfigured,
    blockers,
  };
}

export async function getDrawReminderEligibilityDebug(
  competitionId: string,
): Promise<DrawReminderEligibilityDebug> {
  const [usersWithPushDevice, usersWithDrawAlert, eligibleUsers, pushWithoutDrawAlert] =
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
          drawAlertSubscriptions: { some: { competitionId } },
        },
      }),
      db.user.count({
        where: {
          pushDevices: { some: {} },
          drawAlertSubscriptions: { none: { competitionId } },
        },
      }),
    ]);

  return {
    competitionId,
    usersWithPushDevice,
    usersWithDrawAlert,
    eligibleUsers,
    pushWithoutDrawAlert,
  };
}

async function notifyCompetitionDrawReminder(params: {
  comp: CompetitionReminderRow;
  userId?: string;
  skipAlreadySent?: boolean;
  recordSent?: boolean;
  /** Test only: notify user by id if they have a push token (skip draw-alert check). */
  bypassEligibility?: boolean;
  includeFcmDetails?: boolean;
  pruneInvalidTokens?: boolean;
}): Promise<{
  notificationsAttempted: number;
  usersNotified: number;
  fcmDelivery?: FcmMulticastResult & { invalidTokensRemoved?: number };
}> {
  const users = await findDrawReminderRecipientUsers({
    competitionId: params.comp.id,
    userId: params.userId,
    skipAlreadySent: params.skipAlreadySent,
    bypassEligibility: params.bypassEligibility,
  });

  if (users.length === 0) {
    return { notificationsAttempted: 0, usersNotified: 0 };
  }

  const title = 'Draw starting soon';
  const body = `${params.comp.name} — the draw is in 10 minutes.`;

  let notificationsAttempted = 0;
  let usersNotified = 0;
  let mergedFcm: (FcmMulticastResult & { invalidTokensRemoved?: number }) | undefined;

  for (const user of users) {
    const tokens = user.pushDevices.map((d) => d.token);
    if (tokens.length === 0) {
      continue;
    }

    const fcm = await sendDrawReminderFcmMulticast({
      tokens,
      title,
      body,
      data: {
        competitionId: params.comp.id,
        type: 'draw_reminder',
      },
    });
    notificationsAttempted += tokens.length;

    let invalidTokensRemoved = 0;
    if (params.pruneInvalidTokens && fcm.failureCount > 0) {
      invalidTokensRemoved = await deleteInvalidFcmTokens(tokens, fcm.results);
    }

    if (params.includeFcmDetails) {
      mergedFcm = mergedFcm
        ? {
            successCount: mergedFcm.successCount + fcm.successCount,
            failureCount: mergedFcm.failureCount + fcm.failureCount,
            firebaseProjectId: fcm.firebaseProjectId ?? mergedFcm.firebaseProjectId,
            results: [...mergedFcm.results, ...fcm.results],
            invalidTokensRemoved:
              (mergedFcm.invalidTokensRemoved ?? 0) + invalidTokensRemoved,
          }
        : { ...fcm, invalidTokensRemoved };
    }

    if (fcm.successCount > 0) {
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

  return { notificationsAttempted, usersNotified, fcmDelivery: mergedFcm };
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
  /** Only notify this user; with `userId`, skips draw-alert requirement (push token only). */
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
  let fcmDelivery: SendDrawRemindersResult['fcmDelivery'];

  const skipAlreadySent = options.skipAlreadySent ?? true;
  const recordSent = options.recordSent ?? false;
  const bypassEligibility = Boolean(options.userId?.trim());
  const includeFcmDetails = true;

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
      includeFcmDetails,
      pruneInvalidTokens: true,
    });
    notificationsAttempted += result.notificationsAttempted;
    usersNotified += result.usersNotified;
    if (result.fcmDelivery) {
      fcmDelivery = result.fcmDelivery;
    }
  }

  return {
    competitions: competitions.length,
    notificationsAttempted,
    usersNotified,
    competitionIds: competitions.map((c) => c.id),
    ...(debugRows.length > 0 ? { debug: debugRows } : {}),
    ...(userTarget ? { userTarget } : {}),
    ...(fcmDelivery ? { fcmDelivery } : {}),
  };
}
