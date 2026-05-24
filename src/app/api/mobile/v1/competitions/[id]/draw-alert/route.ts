import { NextResponse } from 'next/server';

import { mapDrawAlertRouteError } from '@/server/mobile/draw-alert-errors';
import {
  getDrawAlertSubscribed,
  subscribeDrawAlert,
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

export async function POST(_: Request, { params }: RouteContext) {
  try {
    const id = params.id?.trim() ?? '';
    if (!id) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }
    await subscribeDrawAlert(id);
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
