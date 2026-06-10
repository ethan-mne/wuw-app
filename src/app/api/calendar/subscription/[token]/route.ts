import { env } from '@/env';
import { buildCalendarIcs } from '@/server/calendar/ics';
import {
  calendarEventSequenceFromUpdatedAt,
  listCalendarFeedCompetitionsForUser,
  resolveCalendarFeedIdentityByToken,
} from '@/server/mobile/calendar-feed.service';

export const dynamic = 'force-dynamic';

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function competitionUrl(id: string): string {
  return `${trimTrailingSlash(env.BASE_URL)}/en/competitions/${encodeURIComponent(id)}`;
}

type RouteContext = {
  params: {
    token: string;
  };
};

export async function GET(_: Request, { params }: RouteContext): Promise<Response> {
  const token = params.token?.trim() ?? '';
  const identity = await resolveCalendarFeedIdentityByToken(token);
  if (!identity) {
    return new Response('Not found', { status: 404 });
  }

  const competitions = await listCalendarFeedCompetitionsForUser({
    userId: identity.userId,
    email: identity.email,
  });

  const ics = buildCalendarIcs({
    calendarName: 'Winuwatch Draws',
    calendarDescription: 'Upcoming Winuwatch draws from your subscriptions and tickets.',
    events: competitions.map((competition) => ({
      uid: `draw-${competition.id}@winuwatch`,
      sequence: calendarEventSequenceFromUpdatedAt(competition.updatedAt),
      dtstamp: competition.updatedAt,
      dtstart: competition.drawingDate,
      summary: `${competition.name} — Live draw`,
      description: `Live draw reminder for ${competition.name}.`,
      url: competitionUrl(competition.id),
      lastModified: competition.updatedAt,
      status: 'CONFIRMED',
    })),
  });

  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'private, max-age=300',
      'Content-Disposition': 'inline; filename="winuwatch-draws.ics"',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
