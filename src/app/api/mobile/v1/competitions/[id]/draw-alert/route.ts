import { NextResponse } from 'next/server';

import { mapDrawAlertRouteError } from '@/server/mobile/draw-alert-errors';
import {
  getDrawAlertSubscribed,
  subscribeDrawAlertBodySchema,
  subscribeDrawAlertWithPush,
  unsubscribeDrawAlert,
} from '@/server/mobile/draw-alert.service';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const id = params.id?.trim() ?? '';
    if (!id) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }
    const subscribed = await getDrawAlertSubscribed(id);
    return NextResponse.json({ data: { subscribed } });
  } catch (error) {
    return mapDrawAlertRouteError(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
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

    const parsed = subscribeDrawAlertBodySchema.safeParse(json);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid payload';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    await subscribeDrawAlertWithPush(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return mapDrawAlertRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const id = params.id?.trim() ?? '';
    if (!id) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }
    await unsubscribeDrawAlert(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return mapDrawAlertRouteError(error);
  }
}
