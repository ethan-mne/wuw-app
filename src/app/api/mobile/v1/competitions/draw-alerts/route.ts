import { NextResponse } from 'next/server';
import { z } from 'zod';

import { mapDrawAlertRouteError } from '@/server/mobile/draw-alert-errors';
import { listSubscribedDrawAlertCompetitionIds } from '@/server/mobile/draw-alert.service';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  competitionIds: z.array(z.string()).max(500),
});

export async function POST(request: Request) {
  try {
    let json: unknown = {};
    try {
      const text = await request.text();
      if (text.trim()) {
        json = JSON.parse(text) as unknown;
      }
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid payload';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const competitionIds = await listSubscribedDrawAlertCompetitionIds(parsed.data.competitionIds);
    return NextResponse.json({ data: { competitionIds } });
  } catch (error) {
    return mapDrawAlertRouteError(error);
  }
}
