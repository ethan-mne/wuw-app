import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MobileHttpError } from '@/server/mobile/http';

vi.mock('@/server/admin/auth.service', () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock('@/server/admin/competition-schedule.service', () => ({
  updateCompetitionSchedule: vi.fn(),
}));

import { requireAdminSession } from '@/server/admin/auth.service';
import { updateCompetitionSchedule } from '@/server/admin/competition-schedule.service';
import { PATCH } from './route';

describe('PATCH /api/admin/v1/competitions/[id]/schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireAdminSession).mockRejectedValue(
      new MobileHttpError('Unauthorized', 401),
    );

    const response = await PATCH(
      new Request('https://example.com', { method: 'PATCH', body: '{}' }),
      { params: { id: 'comp_1' } },
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 when authenticated user is not admin', async () => {
    vi.mocked(requireAdminSession).mockRejectedValue(
      new MobileHttpError('Forbidden', 403),
    );

    const response = await PATCH(
      new Request('https://example.com', { method: 'PATCH', body: '{}' }),
      { params: { id: 'comp_1' } },
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Forbidden' });
  });

  it('returns 400 for invalid payload', async () => {
    vi.mocked(requireAdminSession).mockResolvedValue({
      userId: 'admin_1',
      email: 'admin@example.com',
      session: null,
    });

    const response = await PATCH(
      new Request('https://example.com', {
        method: 'PATCH',
        body: JSON.stringify({ drawingDate: 'not-a-date', endDate: '2026-06-20T10:00:00.000Z' }),
      }),
      { params: { id: 'comp_1' } },
    );

    expect(response.status).toBe(400);
    expect(updateCompetitionSchedule).not.toHaveBeenCalled();
  });

  it('updates schedule for admin', async () => {
    vi.mocked(requireAdminSession).mockResolvedValue({
      userId: 'admin_1',
      email: 'admin@example.com',
      session: null,
    });
    vi.mocked(updateCompetitionSchedule).mockResolvedValue({
      id: 'comp_1',
      name: 'Rolex Draw',
      status: 'ACTIVE',
      end_date: new Date('2026-06-20T10:00:00.000Z'),
      drawing_date: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: new Date('2026-06-10T19:00:00.000Z'),
    });

    const response = await PATCH(
      new Request('https://example.com', {
        method: 'PATCH',
        body: JSON.stringify({
          endDate: '2026-06-20T10:00:00.000Z',
          drawingDate: '2026-06-20T12:00:00.000Z',
        }),
      }),
      { params: { id: 'comp_1' } },
    );

    expect(response.status).toBe(200);
    expect(updateCompetitionSchedule).toHaveBeenCalledWith({
      id: 'comp_1',
      endDate: new Date('2026-06-20T10:00:00.000Z'),
      drawingDate: new Date('2026-06-20T12:00:00.000Z'),
    });
  });
});
