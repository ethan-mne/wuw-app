import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MobileHttpError } from '@/server/mobile/http';

vi.mock('@/server/db', () => ({
  db: {
    competition: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { db } from '@/server/db';
import {
  listCompetitionsForAdminSchedule,
  updateCompetitionSchedule,
} from '@/server/admin/competition-schedule.service';

describe('competition-schedule.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists competitions for schedule dashboard', async () => {
    vi.mocked(db.competition.findMany).mockResolvedValue([
      {
        id: 'comp_1',
        name: 'Comp A',
        status: 'ACTIVE',
        end_date: new Date('2026-06-20T10:00:00.000Z'),
        drawing_date: new Date('2026-06-20T12:00:00.000Z'),
        updatedAt: new Date('2026-06-10T19:00:00.000Z'),
      },
    ]);

    const rows = await listCompetitionsForAdminSchedule();
    expect(rows).toHaveLength(1);
    expect(db.competition.findMany).toHaveBeenCalledOnce();
    expect(db.competition.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: { not: 'COMPLETED' },
        },
      }),
    );
  });

  it('throws 400 when endDate is after drawingDate', async () => {
    await expect(
      updateCompetitionSchedule({
        id: 'comp_1',
        endDate: new Date('2026-06-20T13:00:00.000Z'),
        drawingDate: new Date('2026-06-20T12:00:00.000Z'),
      }),
    ).rejects.toThrow('endDate must be before or equal to drawingDate');
  });

  it('updates competition schedule when payload is valid', async () => {
    vi.mocked(db.competition.update).mockResolvedValue({
      id: 'comp_1',
      name: 'Comp A',
      status: 'ACTIVE',
      end_date: new Date('2026-06-20T10:00:00.000Z'),
      drawing_date: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: new Date('2026-06-10T19:00:00.000Z'),
    });

    const result = await updateCompetitionSchedule({
      id: 'comp_1',
      endDate: new Date('2026-06-20T10:00:00.000Z'),
      drawingDate: new Date('2026-06-20T12:00:00.000Z'),
    });

    expect(result.id).toBe('comp_1');
    expect(db.competition.update).toHaveBeenCalledOnce();
  });

  it('throws 404 when competition does not exist', async () => {
    vi.mocked(db.competition.update).mockRejectedValue({
      code: 'P2025',
      name: 'PrismaClientKnownRequestError',
    });

    await expect(
      updateCompetitionSchedule({
        id: 'missing',
        endDate: new Date('2026-06-20T10:00:00.000Z'),
        drawingDate: new Date('2026-06-20T12:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(MobileHttpError);
  });
});
