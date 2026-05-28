import type { Prisma } from '@prisma/client';

import { db } from '@/server/db';

export type DrawReminderRecipientUser = {
  id: string;
  pushDevices: { token: string }[];
};

export type FindDrawReminderRecipientsOptions = {
  competitionId: string;
  userId?: string;
  skipAlreadySent?: boolean;
  /** Test only: notify by userId if they have a push token (skip draw-alert check). */
  bypassEligibility?: boolean;
};

/** Prisma filter for users who should receive a draw-reminder push. */
export function buildDrawReminderRecipientWhere(
  options: FindDrawReminderRecipientsOptions,
): Prisma.UserWhereInput {
  const { competitionId, userId, skipAlreadySent, bypassEligibility } = options;

  return {
    ...(userId ? { id: userId } : {}),
    pushDevices: { some: {} },
    ...(skipAlreadySent
      ? {}
      : { drawRemindersSent: { none: { competitionId } } }),
    ...(bypassEligibility
      ? {}
      : {
          drawAlertSubscriptions: { some: { competitionId } },
        }),
  };
}

export async function findDrawReminderRecipientUsers(
  options: FindDrawReminderRecipientsOptions,
): Promise<DrawReminderRecipientUser[]> {
  return db.user.findMany({
    where: buildDrawReminderRecipientWhere(options),
    select: {
      id: true,
      pushDevices: { select: { token: true } },
    },
  });
}
