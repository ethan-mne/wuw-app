import { NextResponse } from 'next/server';
import { db } from '@/server/db';

export async function GET() {
  const winners = (await db.winner.findMany({
    orderBy: {
      date: 'desc',
    },
    take: 20,
    select: {
      id: true,
      fullname: true,
      comp_name: true,
      location: true,
      src: true,
      date: true,
    },
  })) as Array<{
    id: string;
    fullname: string;
    comp_name: string | null;
    location: string | null;
    src: string | null;
    date: Date | null;
  }>;

  return NextResponse.json({
    data: winners.map((winner) => ({
      id: winner.id,
      name: winner.fullname,
      prize: winner.comp_name ?? 'Competition prize',
      location: winner.location ?? 'Unknown',
      imageUrl: winner.src ?? '',
      drawDate: winner.date ? winner.date.toISOString().slice(0, 10) : '',
    })),
  });
}
