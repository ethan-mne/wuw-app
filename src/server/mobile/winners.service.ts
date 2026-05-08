import { db } from '@/server/db';
import { getPublicHomeWinners } from '@/server/public-home-data';
import type { MobileWinnersResponse } from '@/server/mobile/types';

const MAX_TAKE = 100;

export function parseWinnersPagination(url: string) {
  const { searchParams } = new URL(url);
  const skip = Math.max(0, Number.parseInt(searchParams.get('skip') ?? '0', 10) || 0);
  const takeRaw = Number.parseInt(searchParams.get('take') ?? '20', 10) || 20;
  const take = Math.min(MAX_TAKE, Math.max(1, takeRaw));

  return {
    skip,
    take,
  };
}

export async function listMobileWinners(skip: number, take: number): Promise<MobileWinnersResponse> {
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

  const data = rows.map((winner) => ({
    id: String(winner.id),
    name: winner.name ?? 'Winner',
    prize: winner.watch_name ?? 'Competition prize',
    location: '',
    imageUrl: winner.src ?? winner.img ?? '',
    drawDate: winner.date ? winner.date.toISOString().slice(0, 10) : '',
  }));

  if (data.length === 0) {
    const publicWinners = await getPublicHomeWinners();
    const paged = publicWinners.slice(skip, skip + take);
    const fallbackData = paged
      .filter((winner): winner is Exclude<(typeof paged)[number], { src: string }> => 'id' in winner)
      .map((winner) => ({
        id: String(winner.id),
        name: winner.name || 'Winner',
        prize: winner.watch || 'Competition prize',
        location: '',
        imageUrl: winner.img ?? '',
        drawDate: winner.date,
      }));

    return {
      data: fallbackData,
      hasMore: skip + paged.length < publicWinners.length,
    };
  }

  return {
    data,
    hasMore: skip + rows.length < total,
  };
}
