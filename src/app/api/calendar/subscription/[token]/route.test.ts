import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/env', () => ({
  env: {
    BASE_URL: 'https://winuwatch.com',
  },
}));

vi.mock('@/server/mobile/calendar-feed.service', () => ({
  resolveCalendarFeedIdentityByToken: vi.fn(),
  listCalendarFeedCompetitionsForUser: vi.fn(),
  calendarEventSequenceFromUpdatedAt: vi.fn(),
}));

import {
  calendarEventSequenceFromUpdatedAt,
  listCalendarFeedCompetitionsForUser,
  resolveCalendarFeedIdentityByToken,
} from '@/server/mobile/calendar-feed.service';
import { GET } from './route';

describe('GET /api/calendar/subscription/[token]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 for invalid token', async () => {
    vi.mocked(resolveCalendarFeedIdentityByToken).mockResolvedValue(null);

    const response = await GET(new Request('https://example.com'), {
      params: { token: 'bad-token' },
    });

    expect(response.status).toBe(404);
    expect(await response.text()).toContain('Not found');
  });

  it('returns an ICS payload for a valid token', async () => {
    vi.mocked(resolveCalendarFeedIdentityByToken).mockResolvedValue({
      userId: 'user_1',
      email: 'user@test.com',
    });
    vi.mocked(calendarEventSequenceFromUpdatedAt).mockReturnValue(77);
    vi.mocked(listCalendarFeedCompetitionsForUser).mockResolvedValue([
      {
        id: 'comp_1',
        name: 'Rolex GMT',
        drawingDate: new Date('2026-06-21T19:00:00.000Z'),
        endDate: new Date('2026-06-21T19:00:00.000Z'),
        updatedAt: new Date('2026-06-08T10:15:00.000Z'),
        drawScheduleVersion: 'v1:2026-06-21T19:00:00.000Z|2026-06-21T19:00:00.000Z',
      },
    ]);

    const response = await GET(new Request('https://example.com'), {
      params: { token: 'good-token' },
    });

    const text = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/calendar');
    expect(text).toContain('BEGIN:VCALENDAR');
    expect(text).toContain('UID:draw-comp_1@winuwatch');
    expect(text).toContain('SEQUENCE:77');
    expect(text).toContain('DTSTART:20260621T190000Z');
  });
});
