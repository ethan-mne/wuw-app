import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { db } from '@/server/db';
import { MobileHttpError } from '@/server/mobile/http';

const adminCompetitionScheduleSelect = {
  id: true,
  name: true,
  status: true,
  end_date: true,
  drawing_date: true,
  updatedAt: true,
  announcementSent: {
    select: {
      sentAt: true,
    },
  },
} as const;

export type AdminCompetitionScheduleRow = {
  id: string;
  name: string;
  status: 'ACTIVE' | 'NOT_ACTIVE' | 'COMPLETED';
  end_date: Date;
  drawing_date: Date;
  updatedAt: Date;
  announcementSentAt: Date | null;
  scheduleAnnouncementSentAt: Date | null;
};

export const updateCompetitionScheduleInputSchema = z
  .object({
    id: z.string().trim().min(1, 'Competition id is required'),
    endDate: z.date(),
    drawingDate: z.date(),
  })
  .superRefine((data, ctx) => {
    if (data.endDate.getTime() > data.drawingDate.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endDate must be before or equal to drawingDate',
        path: ['endDate'],
      });
    }
  });

export type UpdateCompetitionScheduleInput = z.infer<
  typeof updateCompetitionScheduleInputSchema
>;

async function getScheduleAnnouncementSentMap(
  competitionIds: string[],
): Promise<Map<string, Date>> {
  if (competitionIds.length === 0) {
    return new Map();
  }
  const rows = await db.$queryRaw<Array<{ competitionId: string; sentAt: Date }>>`
    SELECT competitionId, sentAt
    FROM competition_schedule_announcement_sent
    WHERE competitionId IN (${Prisma.join(competitionIds)})
  `;
  const map = new Map<string, Date>();
  for (const row of rows) {
    map.set(row.competitionId, row.sentAt);
  }
  return map;
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

export async function listCompetitionsForAdminSchedule(): Promise<
  AdminCompetitionScheduleRow[]
> {
  const rows = await db.competition.findMany({
    where: {
      status: { not: 'COMPLETED' },
    },
    select: adminCompetitionScheduleSelect,
    orderBy: [{ drawing_date: 'asc' }, { name: 'asc' }],
  });
  const scheduleAnnouncementMap = await getScheduleAnnouncementSentMap(rows.map((row) => row.id));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    end_date: row.end_date,
    drawing_date: row.drawing_date,
    updatedAt: row.updatedAt,
    announcementSentAt: row.announcementSent?.sentAt ?? null,
    scheduleAnnouncementSentAt: scheduleAnnouncementMap.get(row.id) ?? null,
  }));
}

export async function updateCompetitionSchedule(
  input: UpdateCompetitionScheduleInput,
): Promise<AdminCompetitionScheduleRow> {
  const parsed = updateCompetitionScheduleInputSchema.parse(input);

  try {
    const updated = await db.competition.update({
      where: { id: parsed.id },
      data: {
        end_date: parsed.endDate,
        drawing_date: parsed.drawingDate,
      },
      select: adminCompetitionScheduleSelect,
    });
    const scheduleAnnouncementSentAt = await getScheduleAnnouncementSentAt(updated.id);
    return {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      end_date: updated.end_date,
      drawing_date: updated.drawing_date,
      updatedAt: updated.updatedAt,
      announcementSentAt: updated.announcementSent?.sentAt ?? null,
      scheduleAnnouncementSentAt,
    };
  } catch (error) {
    if (
      typeof error === 'object'
      && error != null
      && 'code' in error
      && error.code === 'P2025'
    ) {
      throw new MobileHttpError('Competition not found', 404);
    }
    throw error;
  }
}
