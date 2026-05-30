import { db } from '@/server/db';
import {
  deleteInvalidApnsTokens,
  getDefaultApnsEnvironment,
  isApnsConfiguredForPush,
  sendDrawReminderApnsMulticast,
  type ApnsEnvironment,
  type ApnsMulticastResult,
} from '@/server/draw-reminders/apns';
import {
  isFirebaseConfiguredForPush,
  isPushConfiguredForDrawReminders,
} from '@/server/draw-reminders/cron-secrets';
import {
  deleteInvalidFcmTokens,
  sendDrawReminderFcmMulticast,
  type FcmMulticastResult,
} from '@/server/draw-reminders/fcm';
import {
  findDrawReminderRecipientUsers,
  type DrawReminderPushDevice,
} from '@/server/draw-reminders/recipients';
import { isApnsDeviceToken, isLikelyFcmRegistrationToken } from '@/server/mobile/push-token-validation';
import { isDrawingDateInReminderCronWindow } from '@/server/draw-reminders/window';
import { listCompetitionsForDrawReminders } from '@/server/lightweight/competition/service';

export type DrawReminderEligibilityDebug = {
  competitionId: string;
  usersWithPushDevice: number;
  usersWithDrawAlert: number;
  /** Users with draw alert + push token registered for this competition. */
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
  pushConfigured: boolean;
  firebaseConfigured: boolean;
  apnsConfigured: boolean;
  /** Human-readable reasons no push was sent (empty if ready to send). */
  blockers: string[];
};

export type PushDeliveryDebug = {
  apns?: ApnsMulticastResult & { invalidTokensRemoved?: number };
  fcm?: FcmMulticastResult & { invalidTokensRemoved?: number };
};

export type SendDrawRemindersResult = {
  competitions: number;
  notificationsAttempted: number;
  usersNotified: number;
  skippedReason?: 'push_not_configured' | 'no_competitions' | 'competition_not_found';
  competitionIds?: string[];
  debug?: DrawReminderEligibilityDebug[];
  userTarget?: DrawReminderUserTargetDebug;
  /** Present in test mode when push transports were called. */
  pushDelivery?: PushDeliveryDebug;
  /** @deprecated Use pushDelivery.fcm */
  fcmDelivery?: FcmMulticastResult & { invalidTokensRemoved?: number };
};

type CompetitionReminderRow = {
  id: string;
  name: string;
  drawing_date: Date;
};

function resolveApnsEnvironment(device: DrawReminderPushDevice): ApnsEnvironment {
  return device.apnsEnvironment ?? getDefaultApnsEnvironment();
}

function groupApnsDevicesByEnvironment(
  devices: DrawReminderPushDevice[],
): Map<ApnsEnvironment, string[]> {
  const groups = new Map<ApnsEnvironment, string[]>();
  for (const device of devices) {
    if (!isApnsDeviceToken(device.token)) {
      continue;
    }
    const env = resolveApnsEnvironment(device);
    const list = groups.get(env) ?? [];
    list.push(device.token);
    groups.set(env, list);
  }
  return groups;
}

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
  const apnsConfigured = isApnsConfiguredForPush();
  const pushConfigured = isPushConfiguredForDrawReminders();
  const totalPushDevicesInDb = await db.userPushDevice.count();
  if (!pushConfigured) {
    blockers.push('push_not_configured_on_server — set APNS_* and/or FIREBASE_SERVICE_ACCOUNT_JSON');
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
      pushDevices: { select: { id: true, token: true, platform: true } },
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
      pushConfigured,
      firebaseConfigured,
      apnsConfigured,
      blockers,
    };
  }

  const pushDeviceCount = user.pushDevices.length;
  const hasDrawAlert = user.drawAlertSubscriptions.length > 0;

  if (pushDeviceCount === 0) {
    blockers.push(
      'no_push_token_in_database — tap Remind me in the app with notifications allowed (registers token + draw alert)',
    );
  } else {
    const hasApnsToken = user.pushDevices.some((d) => isApnsDeviceToken(d.token));
    const hasFcmToken = user.pushDevices.some((d) => isLikelyFcmRegistrationToken(d.token));
    if (hasApnsToken && !apnsConfigured) {
      blockers.push('apns_not_configured_on_server — set APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY_P8 on Render');
    }
    if (hasFcmToken && !firebaseConfigured) {
      blockers.push('firebase_not_configured_on_server — set FIREBASE_SERVICE_ACCOUNT_JSON for FCM tokens');
    }
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
    pushConfigured,
    firebaseConfigured,
    apnsConfigured,
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
  includeDeliveryDetails?: boolean;
  pruneInvalidTokens?: boolean;
}): Promise<{
  notificationsAttempted: number;
  usersNotified: number;
  pushDelivery?: PushDeliveryDebug;
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
  const data = {
    competitionId: params.comp.id,
    type: 'draw_reminder',
  };

  let notificationsAttempted = 0;
  let usersNotified = 0;
  let mergedDelivery: PushDeliveryDebug | undefined;

  for (const user of users) {
    const devices = user.pushDevices;
    if (devices.length === 0) {
      continue;
    }

    const fcmTokens = devices
      .map((d) => d.token)
      .filter(isLikelyFcmRegistrationToken);
    const apnsGroups = groupApnsDevicesByEnvironment(devices);

    let userSuccessCount = 0;

    if (fcmTokens.length > 0 && !isFirebaseConfiguredForPush()) {
      console.warn('[draw-reminder] FCM tokens present but FIREBASE_SERVICE_ACCOUNT_JSON is not configured');
    }

    if (apnsGroups.size > 0 && !isApnsConfiguredForPush()) {
      console.warn('[draw-reminder] APNs tokens present but APNS_* env is not configured');
    }

    if (fcmTokens.length > 0 && isFirebaseConfiguredForPush()) {
      const fcm = await sendDrawReminderFcmMulticast({
        tokens: fcmTokens,
        title,
        body,
        data,
      });
      notificationsAttempted += fcmTokens.length;
      userSuccessCount += fcm.successCount;

      let invalidTokensRemoved = 0;
      if (params.pruneInvalidTokens && fcm.failureCount > 0) {
        invalidTokensRemoved = await deleteInvalidFcmTokens(fcmTokens, fcm.results);
      }

      if (params.includeDeliveryDetails) {
        mergedDelivery = {
          ...mergedDelivery,
          fcm: mergedDelivery?.fcm
            ? {
                successCount: mergedDelivery.fcm.successCount + fcm.successCount,
                failureCount: mergedDelivery.fcm.failureCount + fcm.failureCount,
                firebaseProjectId: fcm.firebaseProjectId ?? mergedDelivery.fcm.firebaseProjectId,
                results: [...mergedDelivery.fcm.results, ...fcm.results],
                invalidTokensRemoved:
                  (mergedDelivery.fcm.invalidTokensRemoved ?? 0) + invalidTokensRemoved,
              }
            : { ...fcm, invalidTokensRemoved },
        };
      }
    }

    if (apnsGroups.size > 0 && isApnsConfiguredForPush()) {
      for (const [environment, apnsTokens] of apnsGroups) {
        const apns = await sendDrawReminderApnsMulticast({
          tokens: apnsTokens,
          title,
          body,
          data,
          environment,
        });
        notificationsAttempted += apnsTokens.length;
        userSuccessCount += apns.successCount;

        let invalidTokensRemoved = 0;
        if (params.pruneInvalidTokens && apns.failureCount > 0) {
          invalidTokensRemoved = await deleteInvalidApnsTokens(apnsTokens, apns.results);
        }

        if (params.includeDeliveryDetails) {
          mergedDelivery = {
            ...mergedDelivery,
            apns: mergedDelivery?.apns
              ? {
                  successCount: mergedDelivery.apns.successCount + apns.successCount,
                  failureCount: mergedDelivery.apns.failureCount + apns.failureCount,
                  results: [...mergedDelivery.apns.results, ...apns.results],
                  invalidTokensRemoved:
                    (mergedDelivery.apns.invalidTokensRemoved ?? 0) + invalidTokensRemoved,
                }
              : { ...apns, invalidTokensRemoved },
          };
        }
      }
    }

    if (userSuccessCount > 0) {
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

  return { notificationsAttempted, usersNotified, pushDelivery: mergedDelivery };
}

/** Production cron: competitions in the ~10-minute-before-draw window. */
export async function runDrawReminderJob(now: Date): Promise<SendDrawRemindersResult> {
  if (!isPushConfiguredForDrawReminders()) {
    return {
      competitions: 0,
      notificationsAttempted: 0,
      usersNotified: 0,
      skippedReason: 'push_not_configured',
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
  if (!isPushConfiguredForDrawReminders()) {
    return {
      competitions: 0,
      notificationsAttempted: 0,
      usersNotified: 0,
      skippedReason: 'push_not_configured',
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
  let pushDelivery: PushDeliveryDebug | undefined;

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
      includeDeliveryDetails: true,
      pruneInvalidTokens: true,
    });
    notificationsAttempted += result.notificationsAttempted;
    usersNotified += result.usersNotified;
    if (result.pushDelivery) {
      pushDelivery = result.pushDelivery;
    }
  }

  return {
    competitions: competitions.length,
    notificationsAttempted,
    usersNotified,
    competitionIds: competitions.map((c) => c.id),
    ...(debugRows.length > 0 ? { debug: debugRows } : {}),
    ...(userTarget ? { userTarget } : {}),
    ...(pushDelivery ? { pushDelivery, fcmDelivery: pushDelivery.fcm } : {}),
  };
}
