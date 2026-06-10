import type { PrismaClient } from '@prisma/client';

import { sendOneSignalPushMulticast } from '@/server/notifications/onesignal';

type CompetitionEventRow = {
  id: string;
  name: string;
  status: 'ACTIVE' | 'NOT_ACTIVE' | 'COMPLETED';
  drawing_date: Date;
  end_date: Date;
};

const competitionEventSelect = {
  id: true,
  name: true,
  status: true,
  drawing_date: true,
  end_date: true,
} as const;

export function hasDrawScheduleChanged(
  previous: Pick<CompetitionEventRow, 'drawing_date' | 'end_date'>,
  next: Pick<CompetitionEventRow, 'drawing_date' | 'end_date'>,
): boolean {
  return (
    previous.drawing_date.getTime() !== next.drawing_date.getTime()
    || previous.end_date.getTime() !== next.end_date.getTime()
  );
}

export async function notifyCompetitionCreated(
  prisma: PrismaClient,
  competition: CompetitionEventRow,
): Promise<void> {
  if (competition.status !== 'ACTIVE') {
    return;
  }

  const devices = await prisma.userPushDevice.findMany({
    select: {
      token: true,
    },
  });
  const subscriptionIds = devices.map((device) => device.token);
  if (subscriptionIds.length === 0) {
    return;
  }

  await sendOneSignalPushMulticast({
    subscriptionIds,
    title: 'New competition is live',
    body: `${competition.name} is now available.`,
    data: {
      type: 'competition_new',
      competitionId: competition.id,
    },
  });
}

export async function notifyCompetitionScheduleUpdated(
  prisma: PrismaClient,
  competition: CompetitionEventRow,
): Promise<void> {
  const rows = await prisma.drawAlertSubscription.findMany({
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

  const subscriptionIds = rows.flatMap((row) =>
    row.user.pushDevices.map((device) => device.token),
  );
  if (subscriptionIds.length === 0) {
    return;
  }

  await sendOneSignalPushMulticast({
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
}

export async function runCompetitionCreateSideEffects(
  prisma: PrismaClient,
  competitionId: string,
): Promise<void> {
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    select: competitionEventSelect,
  });
  if (!competition) {
    return;
  }
  await notifyCompetitionCreated(prisma, competition);
}

export async function runCompetitionUpdateSideEffects(
  prisma: PrismaClient,
  previousCompetition: Pick<CompetitionEventRow, 'id' | 'drawing_date' | 'end_date'>,
): Promise<void> {
  const competition = await prisma.competition.findUnique({
    where: { id: previousCompetition.id },
    select: competitionEventSelect,
  });
  if (!competition) {
    return;
  }

  if (!hasDrawScheduleChanged(previousCompetition, competition)) {
    return;
  }

  await prisma.drawReminderSent.deleteMany({
    where: { competitionId: competition.id },
  });
  await notifyCompetitionScheduleUpdated(prisma, competition);
}
