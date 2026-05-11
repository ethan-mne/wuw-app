import { NextResponse } from 'next/server';
import { getMobileCompetitionById } from '@/server/mobile/competitions.service';
import { MobileHttpError } from '@/server/mobile/http';

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

    const competition = await getMobileCompetitionById(id);
    return NextResponse.json({ data: competition });
  } catch (error) {
    if (error instanceof MobileHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
