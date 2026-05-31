import { z } from 'zod';
import type { Prisma } from '@prisma/client';

import { db } from '@/server/db';
import { requireMobileSession } from '@/server/mobile/auth.service';
import { MobileHttpError } from '@/server/mobile/http';
import { isValidPushTokenForPlatform } from '@/server/mobile/push-token-validation';

export const subscribeDrawAlertBodySchema = z
  .object({
    token: z.string().min(1).max(512).optional(),
    platform: z.enum(['android', 'ios']).optional(),
    apnsEnvironment: z.enum(['sandbox', 'production']).optional(),
    /** `local` = on-device schedule only; `push` or omitted with token = legacy push registration. */
    delivery: z.enum(['local', 'push']).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.token) {
      return;
    }
    if (!data.platform) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'platform is required when token is provided',
        path: ['platform'],
      });
      return;
    }
    if (!isValidPushTokenForPlatform(data.token, data.platform)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          data.platform === 'ios'
            ? 'Invalid push token (expected APNs device token or legacy FCM token)'
            : 'Invalid FCM token',
        path: ['token'],
      });
    }
  });

export type SubscribeDrawAlertBody = z.infer<typeof subscribeDrawAlertBodySchema>;

async function assertCompetitionAllowsDrawAlerts(competitionId: string) {
  const c = await db.competition.findUnique({
    where: { id: competitionId },
    select: { id: true, drawing_date: true, status: true },
  });
  if (!c) {
    throw new MobileHttpError('Competition not found', 404);
  }
  if (c.status === 'COMPLETED') {
    throw new MobileHttpError('This competition has ended', 400);
  }
  if (c.drawing_date.getTime() <= Date.now()) {
    throw new MobileHttpError('The draw has already passed', 400);
  }
  return c;
}

export async function getDrawAlertSubscribed(competitionId: string): Promise<boolean> {
  const { userId } = await requireMobileSession('userId');
  const trimmed = competitionId.trim();
  if (!trimmed) {
    return false;
  }
  const row = await db.drawAlertSubscription.findUnique({
    where: {
      userId_competitionId: { userId, competitionId: trimmed },
    },
    select: { id: true },
  });
  return row != null;
}

/** Subscribe to draw alert; optionally register push device token in the same transaction. */
export async function subscribeDrawAlertWithPush(
  competitionId: string,
  body: SubscribeDrawAlertBody,
): Promise<void> {
  const { userId } = await requireMobileSession('userId');
  const trimmed = competitionId.trim();
  if (!trimmed) {
    throw new MobileHttpError('Invalid competition', 400);
  }
  await assertCompetitionAllowsDrawAlerts(trimmed);

  const ops: Prisma.PrismaPromise<unknown>[] = [
    db.drawAlertSubscription.upsert({
      where: {
        userId_competitionId: { userId, competitionId: trimmed },
      },
      create: { userId, competitionId: trimmed },
      update: {},
    }),
  ];

  if (body.token && body.platform) {
    ops.push(
      db.userPushDevice.upsert({
        where: { token: body.token },
        create: {
          userId,
          token: body.token,
          platform: body.platform,
          apnsEnvironment:
            body.platform === 'ios' ? (body.apnsEnvironment ?? null) : null,
        },
        update: {
          userId,
          platform: body.platform,
          apnsEnvironment:
            body.platform === 'ios' ? (body.apnsEnvironment ?? null) : null,
        },
      }),
    );
  }

  await db.$transaction(ops);
}

export async function unsubscribeDrawAlert(competitionId: string): Promise<void> {
  const { userId } = await requireMobileSession('userId');
  const trimmed = competitionId.trim();
  if (!trimmed) {
    throw new MobileHttpError('Invalid competition', 400);
  }
  await db.drawAlertSubscription.deleteMany({
    where: { userId, competitionId: trimmed },
  });
}
