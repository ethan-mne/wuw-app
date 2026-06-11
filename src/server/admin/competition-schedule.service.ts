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
} as const;

export type AdminCompetitionScheduleRow = {
  id: string;
  name: string;
  status: 'ACTIVE' | 'NOT_ACTIVE' | 'COMPLETED';
  end_date: Date;
  drawing_date: Date;
  updatedAt: Date;
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

export async function listCompetitionsForAdminSchedule(): Promise<
  AdminCompetitionScheduleRow[]
> {
  return db.competition.findMany({
    where: {
      status: { not: 'COMPLETED' },
    },
    select: adminCompetitionScheduleSelect,
    orderBy: [{ drawing_date: 'asc' }, { name: 'asc' }],
  });
}

export async function updateCompetitionSchedule(
  input: UpdateCompetitionScheduleInput,
): Promise<AdminCompetitionScheduleRow> {
  const parsed = updateCompetitionScheduleInputSchema.parse(input);

  try {
    return await db.competition.update({
      where: { id: parsed.id },
      data: {
        end_date: parsed.endDate,
        drawing_date: parsed.drawingDate,
      },
      select: adminCompetitionScheduleSelect,
    });
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
