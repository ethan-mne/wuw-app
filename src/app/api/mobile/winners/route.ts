import { NextResponse } from 'next/server';
import { db } from '@/server/db';

const MAX_TAKE = 100;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skip = Math.max(0, Number.parseInt(searchParams.get('skip') ?? '0', 10) || 0);
  const takeRaw = Number.parseInt(searchParams.get('take') ?? '20', 10) || 20;
  const take = Math.min(MAX_TAKE, Math.max(1, takeRaw));

  const select = {
    id: true,
    name: true,
    watch_name: true,
    value: true,
    img: true,
    src: true,
    date: true,
  } as const;

  const [rows, total] = await Promise.all([
    db.winner.findMany({
      orderBy: {
        date: 'desc',
      },
      skip,
      take,
      select,
    }),
    db.winner.count(),
  ]);

  const winners = rows as Array<{
    id: number;
    name: string | null;
    watch_name: string | null;
    value: number | null;
    img: string | null;
    src: string | null;
    date: Date | null;
  }>;

  const data = winners.map((winner) => ({
    id: String(winner.id),
    name: winner.name ?? 'Winner',
    prize: winner.watch_name ?? 'Competition prize',
    location: '',
    imageUrl: winner.src ?? winner.img ?? '',
    drawDate: winner.date ? winner.date.toISOString().slice(0, 10) : '',
  }));

  return NextResponse.json({
    data,
    hasMore: skip + winners.length < total,
  });
}
