import { NextResponse } from 'next/server';
import { listCompetitionsForMobile } from '@/server/lightweight/competition/service';

export async function GET() {
  const competitions = await listCompetitionsForMobile();
  return NextResponse.json({ data: competitions });
}
