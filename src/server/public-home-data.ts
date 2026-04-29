import { unstable_cache } from 'next/cache';

import { formatPrice } from '@/lib/formaters';
import { db } from '@/server/db';

export type PublicWinner =
  | {
      id: number;
      img: string | null;
      name: string;
      value: string;
      watch: string;
      date: string;
    }
  | {
      src: string;
    };

export const getPublicHomeStats = unstable_cache(
  async () => {
    const settings = await db.globalSettings.findMany({
      where: {
        key: {
          in: ['insta_followers', 'last_won_amount'],
        },
      },
      select: {
        key: true,
        value: true,
      },
    });

    const byKey = new Map(settings.map((setting) => [setting.key, setting.value]));

    return {
      instagramCount: byKey.get('insta_followers') ?? '',
      amountWon: parseInt(byKey.get('last_won_amount') ?? '0'),
    };
  },
  ['public-home-stats'],
  { revalidate: 300, tags: ['public-home-stats'] },
);

export const getPublicHomeWinners = unstable_cache(
  async (): Promise<PublicWinner[]> => {
    const winners = await db.winner.findMany({
      where: {
        img: {
          not: null,
        },
      },
      take: 8,
      orderBy: {
        date: 'desc',
      },
      select: {
        id: true,
        img: true,
        name: true,
        value: true,
        date: true,
        watch_name: true,
      },
    });

    return winners.map((winner) => ({
      id: winner.id,
      img: winner.img,
      name: winner.name ?? '',
      value: formatPrice(winner.value ?? 0),
      watch: winner.watch_name ?? '',
      date: (winner.date ?? new Date()).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    }));
  },
  ['public-home-winners'],
  { revalidate: 300, tags: ['public-home-winners'] },
);
