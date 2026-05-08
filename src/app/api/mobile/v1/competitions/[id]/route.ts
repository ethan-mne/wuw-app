import { NextResponse } from 'next/server';
import { getMobileCompetitionById } from '@/server/mobile/competitions.service';
import { MobileHttpError } from '@/server/mobile/http';

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const competition = await getMobileCompetitionById(params.id);
    return NextResponse.json({ data: competition });
  } catch (error) {
    if (error instanceof MobileHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
