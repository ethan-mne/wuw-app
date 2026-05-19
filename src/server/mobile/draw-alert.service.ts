import { db } from '@/server/db';
import { MobileHttpError } from '@/server/mobile/http';
import { requireMobileSession } from '@/server/mobile/auth.service';

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

export async function subscribeDrawAlert(competitionId: string): Promise<void> {
  const { userId } = await requireMobileSession('userId');
  const trimmed = competitionId.trim();
  if (!trimmed) {
    throw new MobileHttpError('Invalid competition', 400);
  }
  await assertCompetitionAllowsDrawAlerts(trimmed);
  await db.drawAlertSubscription.upsert({
    where: {
      userId_competitionId: { userId, competitionId: trimmed },
    },
    create: { userId, competitionId: trimmed },
    update: {},
  });
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
