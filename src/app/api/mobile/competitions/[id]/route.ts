import { NextResponse } from 'next/server';
import { getCompetitionForMobileById } from '@/server/lightweight/competition/service';

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: RouteContext) {
  const competition = await getCompetitionForMobileById(params.id);

  if (!competition) {
    return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
  }

  return NextResponse.json({ data: competition });
}
