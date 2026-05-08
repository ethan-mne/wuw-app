import { NextResponse } from 'next/server';
import { listMobileCompetitions } from '@/server/mobile/competitions.service';

export async function GET() {
  const competitions = await listMobileCompetitions();
  return NextResponse.json({ data: competitions });
}
