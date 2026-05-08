import { NextResponse } from 'next/server';
import { listMobileWinners, parseWinnersPagination } from '@/server/mobile/winners.service';

export async function GET(request: Request) {
  const { skip, take } = parseWinnersPagination(request.url);
  const response = await listMobileWinners(skip, take);
  return NextResponse.json(response);
}
