import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdminSession } from '@/server/admin/auth.service';
import { updateCompetitionSchedule } from '@/server/admin/competition-schedule.service';
import { MobileHttpError } from '@/server/mobile/http';

export const dynamic = 'force-dynamic';

const updateScheduleBodySchema = z.object({
  endDate: z.coerce.date(),
  drawingDate: z.coerce.date(),
});

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await requireAdminSession();

    const id = params.id?.trim() ?? '';
    if (!id) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    let json: unknown = {};
    try {
      const text = await request.text();
      if (text.trim()) {
        json = JSON.parse(text) as unknown;
      }
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = updateScheduleBodySchema.safeParse(json);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid payload';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const updated = await updateCompetitionSchedule({
      id,
      endDate: parsed.data.endDate,
      drawingDate: parsed.data.drawingDate,
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message ?? 'Invalid payload';
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (error instanceof MobileHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
