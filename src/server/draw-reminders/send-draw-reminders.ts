import { env } from '@/env';
import { db } from '@/server/db';
import { sendDrawReminderFcmMulticast } from '@/server/draw-reminders/fcm';
import { listCompetitionsForDrawReminders } from '@/server/lightweight/competition/service';

export type SendDrawRemindersResult = {
  competitions: number;
  notificationsAttempted: number;
  usersNotified: number;
  skippedReason?: 'firebase_not_configured';
};

export async function runDrawReminderJob(now: Date): Promise<SendDrawRemindersResult> {
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) {
    return {
      competitions: 0,
      notificationsAttempted: 0,
      usersNotified: 0,
      skippedReason: 'firebase_not_configured',
    };
  }

  const competitions = await listCompetitionsForDrawReminders(now);
  if (competitions.length === 0) {
    return { competitions: 0, notificationsAttempted: 0, usersNotified: 0 };
  }

  let notificationsAttempted = 0;
  let usersNotified = 0;

  for (const comp of competitions) {
    const orders = await db.order.findMany({
      where: {
        status: 'CONFIRMED',
        Ticket: { some: { competitionId: comp.id } },
      },
      select: { email: true },
      distinct: ['email'],
    });
    const ticketEmails = [...new Set(orders.map((o) => o.email).filter((e) => Boolean(e)))];

    const users = await db.user.findMany({
      where: {
        pushDevices: { some: {} },
        drawRemindersSent: { none: { competitionId: comp.id } },
        OR: [
          ...(ticketEmails.length > 0 ? [{ email: { in: ticketEmails } }] : []),
          { drawAlertSubscriptions: { some: { competitionId: comp.id } } },
        ],
      },
      select: {
        id: true,
        pushDevices: { select: { token: true } },
      },
    });

    if (users.length === 0) {
      continue;
    }

    const title = 'Draw starting soon';
    const body = `${comp.name} — the draw is in 10 minutes.`;

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
          competitionId: comp.id,
          type: 'draw_reminder',
        },
      });
      notificationsAttempted += tokens.length;
      if (ok) {
        await db.drawReminderSent.create({
          data: { userId: user.id, competitionId: comp.id },
        });
        usersNotified += 1;
      }
    }
  }

  return { competitions: competitions.length, notificationsAttempted, usersNotified };
}
