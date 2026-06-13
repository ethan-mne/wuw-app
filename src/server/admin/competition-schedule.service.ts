import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { db } from '@/server/db';
import { MobileHttpError } from '@/server/mobile/http';

const adminCompetitionScheduleBaseSelect = {
  id: true,
  name: true,
  status: true,
  end_date: true,
  drawing_date: true,
  updatedAt: true,
  comp_image_url: true,
  Watches: {
    select: {
      images_url: {
        select: { url: true },
        orderBy: { createdAt: 'asc' as const },
        take: 1,
      },
    },
  },
  announcementSent: {
    select: {
      sentAt: true,
    },
  },
} as const;

const adminCompetitionScheduleSelect = {
  ...adminCompetitionScheduleBaseSelect,
  scheduleAnnouncementSent: {
    select: {
      sentAt: true,
    },
  },
} as const;

function isMissingScheduleAnnouncementStorage(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError
    && (error.code === 'P2021' || error.code === 'P2022')
    && String(error.message).includes('competition_schedule_announcement_sent')
  );
}

export type AdminCompetitionScheduleRow = {
  id: string;
  name: string;
  status: 'ACTIVE' | 'NOT_ACTIVE' | 'COMPLETED';
  end_date: Date;
  drawing_date: Date;
  updatedAt: Date;
  competitionImageUrl: string | null;
  watch: {
    images: Array<{ url: string; alt: string }>;
  };
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

function mapAdminCompetitionScheduleRow(
  row: {
    id: string;
    name: string;
    status: 'ACTIVE' | 'NOT_ACTIVE' | 'COMPLETED';
    end_date: Date;
    drawing_date: Date;
    updatedAt: Date;
    comp_image_url: string | null;
    Watches: { images_url: Array<{ url: string }> } | null;
    announcementSent: { sentAt: Date } | null;
    scheduleAnnouncementSent?: { sentAt: Date } | null;
  },
): AdminCompetitionScheduleRow {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    end_date: row.end_date,
    drawing_date: row.drawing_date,
    updatedAt: row.updatedAt,
    competitionImageUrl: row.comp_image_url?.trim() || null,
    watch: {
      images:
        row.Watches?.images_url.map((image) => ({
          url: image.url,
          alt: `${row.name} image`,
        })) ?? [],
    },
    announcementSentAt: row.announcementSent?.sentAt ?? null,
    scheduleAnnouncementSentAt: row.scheduleAnnouncementSent?.sentAt ?? null,
  };
}

export async function listCompetitionsForAdminSchedule(): Promise<
  AdminCompetitionScheduleRow[]
> {
  const query = {
    where: {
      status: { not: 'COMPLETED' as const },
    },
    orderBy: [{ drawing_date: 'asc' as const }, { name: 'asc' as const }],
  };

  try {
    const rows = await db.competition.findMany({
      ...query,
      select: adminCompetitionScheduleSelect,
    });
    return rows.map(mapAdminCompetitionScheduleRow);
  } catch (error) {
    if (!isMissingScheduleAnnouncementStorage(error)) {
      throw error;
    }

    const rows = await db.competition.findMany({
      ...query,
      select: adminCompetitionScheduleBaseSelect,
    });
    return rows.map((row) =>
      mapAdminCompetitionScheduleRow({ ...row, scheduleAnnouncementSent: null }),
    );
  }
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
    return mapAdminCompetitionScheduleRow(updated);
  } catch (error) {
    if (isMissingScheduleAnnouncementStorage(error)) {
      const updated = await db.competition.update({
        where: { id: parsed.id },
        data: {
          end_date: parsed.endDate,
          drawing_date: parsed.drawingDate,
        },
        select: adminCompetitionScheduleBaseSelect,
      });
      return mapAdminCompetitionScheduleRow({
        ...updated,
        scheduleAnnouncementSent: null,
      });
    }
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
