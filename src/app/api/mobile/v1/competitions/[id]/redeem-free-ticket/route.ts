import { NextResponse } from 'next/server';

import { MobileHttpError } from '@/server/mobile/http';
import { redeemFreeTicket } from '@/server/mobile/loyalty.service';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(_: Request, { params }: RouteContext) {
  try {
    const id = params.id?.trim() ?? '';
    if (!id) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }
    const result = await redeemFreeTicket(id);
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof MobileHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
