import { randomUUID } from 'node:crypto';
import type { CompetitionStatus } from '@prisma/client';

import { db } from '@/server/db';
import { MobileHttpError } from '@/server/mobile/http';
import { filterOneSignalSubscriptionIds } from '@/server/mobile/push-token-validation';
import {
  isOneSignalConfigured,
  sendOneSignalPushMulticast,
} from '@/server/notifications/onesignal';

type CompetitionNotificationRow = {
  id: string;
  name: string;
  status: CompetitionStatus;
  announcementSent: { sentAt: Date } | null;
  drawing_date: Date;
  end_date: Date;
};

const competitionNotificationSelect = {
  id: true,
  name: true,
  status: true,
  announcementSent: {
    select: {
      sentAt: true,
    },
  },
  drawing_date: true,
  end_date: true,
} as const;

export type SendCompetitionAnnouncementResult =
  | {
    kind: 'sent';
    competitionId: string;
    competitionName: string;
    attempted: number;
    successCount: number;
    failureCount: number;
    invalidSubscriptionsRemoved: number;
    notificationId?: string;
    sentAt: Date;
  }
  | {
    kind: 'already_sent';
    competitionId: string;
    competitionName: string;
    sentAt: Date;
  }
  | {
    kind: 'not_active';
    competitionId: string;
    competitionName: string;
    status: CompetitionStatus;
  }
  | {
    kind: 'no_recipients';
    competitionId: string;
    competitionName: string;
    errorMessage?: string;
  }
  | {
    kind: 'delivery_failed';
    competitionId: string;
    competitionName: string;
    attempted: number;
    legacyTokenCount?: number;
    errorMessage?: string;
  };

export type SendCompetitionScheduleAnnouncementResult =
  | {
    kind: 'sent';
    competitionId: string;
    competitionName: string;
    attempted: number;
    successCount: number;
    failureCount: number;
    invalidSubscriptionsRemoved: number;
    notificationId?: string;
    sentAt: Date;
  }
  | {
    kind: 'already_sent';
    competitionId: string;
    competitionName: string;
    sentAt: Date;
  }
  | {
    kind: 'no_recipients';
    competitionId: string;
    competitionName: string;
    errorMessage?: string;
  }
  | {
    kind: 'delivery_failed';
    competitionId: string;
    competitionName: string;
    attempted: number;
    legacyTokenCount?: number;
    errorMessage?: string;
  };

async function loadCompetitionOrThrow(competitionId: string): Promise<CompetitionNotificationRow> {
  const row = await db.competition.findUnique({
    where: { id: competitionId },
    select: competitionNotificationSelect,
  });
  if (!row) {
    throw new MobileHttpError('Competition not found', 404);
  }
  return row;
}

async function getScheduleAnnouncementSentAt(competitionId: string): Promise<Date | null> {
  const rows = await db.$queryRaw<Array<{ sentAt: Date }>>`
    SELECT sentAt
    FROM competition_schedule_announcement_sent
    WHERE competitionId = ${competitionId}
    LIMIT 1
  `;
  return rows[0]?.sentAt ?? null;
}

export async function sendCompetitionAnnouncement(params: {
  competitionId: string;
  sentByUserId: string;
}): Promise<SendCompetitionAnnouncementResult> {
  const competitionId = params.competitionId.trim();
  if (!competitionId) {
    throw new MobileHttpError('Competition not found', 404);
  }

  const competition = await loadCompetitionOrThrow(competitionId);
  if (competition.status !== 'ACTIVE') {
    return {
      kind: 'not_active',
      competitionId: competition.id,
      competitionName: competition.name,
      status: competition.status,
    };
  }
  if (competition.announcementSent) {
    return {
      kind: 'already_sent',
      competitionId: competition.id,
      competitionName: competition.name,
      sentAt: competition.announcementSent.sentAt,
    };
  }
  if (!isOneSignalConfigured()) {
    throw new MobileHttpError('OneSignal is not configured on the server', 503);
  }

  const tokens = await db.userPushDevice.findMany({
    select: { token: true },
  });
  const { subscriptionIds, legacyTokenCount } = filterOneSignalSubscriptionIds(
    tokens.map((item) => item.token),
  );
  if (subscriptionIds.length === 0) {
    return {
      kind: 'no_recipients',
      competitionId: competition.id,
      competitionName: competition.name,
      ...(legacyTokenCount > 0
        ? {
            errorMessage:
              `${legacyTokenCount} stored push token(s) are legacy FCM/APNs ids. Users must reopen the mobile app and re-enable notifications.`,
          }
        : {}),
    };
  }

  let sentAt = new Date();
  try {
    const created = await db.competitionAnnouncementSent.create({
      data: {
        competitionId: competition.id,
        sentByUserId: params.sentByUserId,
      },
      select: {
        sentAt: true,
      },
    });
    sentAt = created.sentAt;
  } catch (error) {
    if (
      typeof error === 'object'
      && error != null
      && 'code' in error
      && error.code === 'P2002'
    ) {
      const latest = await loadCompetitionOrThrow(competition.id);
      return {
        kind: 'already_sent',
        competitionId: latest.id,
        competitionName: latest.name,
        sentAt: latest.announcementSent?.sentAt ?? new Date(),
      };
    }
    throw error;
  }

  const pushResult = await sendOneSignalPushMulticast({
    subscriptionIds,
    title: 'New competition is live',
    body: `${competition.name} is now available.`,
    data: {
      type: 'competition_new',
      competitionId: competition.id,
    },
  });

  let invalidSubscriptionsRemoved = 0;
  if (pushResult.invalidSubscriptionIds.length > 0) {
    const removed = await db.userPushDevice.deleteMany({
      where: {
        token: {
          in: pushResult.invalidSubscriptionIds,
        },
      },
    });
    invalidSubscriptionsRemoved = removed.count;
  }

  if (pushResult.successCount === 0) {
    await db.competitionAnnouncementSent.deleteMany({
      where: { competitionId: competition.id },
    });
    return {
      kind: 'delivery_failed',
      competitionId: competition.id,
      competitionName: competition.name,
      attempted: subscriptionIds.length,
      legacyTokenCount: legacyTokenCount > 0 ? legacyTokenCount : undefined,
      errorMessage: pushResult.errorSummary,
    };
  }

  return {
    kind: 'sent',
    competitionId: competition.id,
    competitionName: competition.name,
    attempted: subscriptionIds.length,
    successCount: pushResult.successCount,
    failureCount: pushResult.failureCount,
    invalidSubscriptionsRemoved,
    notificationId: pushResult.notificationId,
    sentAt,
  };
}

export async function sendCompetitionScheduleAnnouncement(params: {
  competitionId: string;
  sentByUserId: string;
}): Promise<SendCompetitionScheduleAnnouncementResult> {
  const competitionId = params.competitionId.trim();
  if (!competitionId) {
    throw new MobileHttpError('Competition not found', 404);
  }

  const competition = await loadCompetitionOrThrow(competitionId);
  const existingSentAt = await getScheduleAnnouncementSentAt(competition.id);
  if (existingSentAt) {
    return {
      kind: 'already_sent',
      competitionId: competition.id,
      competitionName: competition.name,
      sentAt: existingSentAt,
    };
  }
  if (!isOneSignalConfigured()) {
    throw new MobileHttpError('OneSignal is not configured on the server', 503);
  }

  const rows = await db.drawAlertSubscription.findMany({
    where: {
      competitionId: competition.id,
    },
    select: {
      user: {
        select: {
          pushDevices: {
            select: {
              token: true,
            },
          },
        },
      },
    },
  });
  const allTokens = rows.flatMap((row) => row.user.pushDevices.map((device) => device.token));
  const { subscriptionIds, legacyTokenCount } = filterOneSignalSubscriptionIds(allTokens);

  if (subscriptionIds.length === 0) {
    return {
      kind: 'no_recipients',
      competitionId: competition.id,
      competitionName: competition.name,
      ...(legacyTokenCount > 0
        ? {
            errorMessage:
              `${legacyTokenCount} draw-alert subscriber(s) have legacy FCM/APNs push tokens. They must reopen the mobile app and re-subscribe to draw alerts.`,
          }
        : {}),
    };
  }

  const sentAt = new Date();
  const inserted = await db.$executeRaw`
    INSERT IGNORE INTO competition_schedule_announcement_sent (id, competitionId, sentByUserId, sentAt)
    VALUES (${randomUUID()}, ${competition.id}, ${params.sentByUserId}, ${sentAt})
  `;
  if (inserted === 0) {
    const latestSentAt = await getScheduleAnnouncementSentAt(competition.id);
    return {
      kind: 'already_sent',
      competitionId: competition.id,
      competitionName: competition.name,
      sentAt: latestSentAt ?? sentAt,
    };
  }

  const pushResult = await sendOneSignalPushMulticast({
    subscriptionIds,
    title: 'Draw schedule updated',
    body: `${competition.name} has a new draw date/time.`,
    data: {
      type: 'draw_schedule_updated',
      competitionId: competition.id,
      drawingDate: competition.drawing_date.toISOString(),
      endDate: competition.end_date.toISOString(),
    },
  });

  let invalidSubscriptionsRemoved = 0;
  if (pushResult.invalidSubscriptionIds.length > 0) {
    const removed = await db.userPushDevice.deleteMany({
      where: {
        token: {
          in: pushResult.invalidSubscriptionIds,
        },
      },
    });
    invalidSubscriptionsRemoved = removed.count;
  }

  if (pushResult.successCount === 0) {
    await db.$executeRaw`
      DELETE FROM competition_schedule_announcement_sent
      WHERE competitionId = ${competition.id}
    `;
    return {
      kind: 'delivery_failed',
      competitionId: competition.id,
      competitionName: competition.name,
      attempted: subscriptionIds.length,
      legacyTokenCount: legacyTokenCount > 0 ? legacyTokenCount : undefined,
      errorMessage: pushResult.errorSummary,
    };
  }

  return {
    kind: 'sent',
    competitionId: competition.id,
    competitionName: competition.name,
    attempted: subscriptionIds.length,
    successCount: pushResult.successCount,
    failureCount: pushResult.failureCount,
    invalidSubscriptionsRemoved,
    notificationId: pushResult.notificationId,
    sentAt,
  };
}
