import { Suspense } from 'react';
import {
  CompetitionHistoryText,
  HistoryCompetitionList,
} from './history-competitions-list';
import { HistoryListSkeleton } from './history-list-skeleton';
import { CoinsProgress } from '../coins-progress';
import { api } from '@/trpc/server';
import { db } from '@/server/db';

export const dynamic = 'force-dynamic';

export default async function History() {
  const [profile, historyFetch, competitions] = await Promise.all([
    api.Users.CurrentUser.query(),
    api.Order.getOrderHistory.query(),
    //NOTE: Get active competitions
    db.competition.findMany({
      where: {
        status: {
          in: ['ACTIVE'],
        },
      },
      select: {
        id: true,
        total_tickets: true,
        name: true,
        end_date: true,
        price: true,
        ticket_price: true,
        remaining_tickets: true,
        status: true,
        max_winners: true,
        cash_alternative: true,
        Watches: {
          include: {
            images_url: true,
          },
        },
        _count: {
          select: {
            Ticket: {
              where: {
                Order: {
                  status: 'CONFIRMED',
                },
              },
            },
          },
        },
      },
      orderBy: {
        // end_date: 'desc',
        ticket_price: 'asc',
      },
    }),
  ]);
  return (
    <div className='flex flex-col gap-[47px] md:gap-[40px] '>
      <CompetitionHistoryText />
      <Suspense fallback={<HistoryListSkeleton itemsCount={3} />}>
        <HistoryCompetitionList history={historyFetch} />
      </Suspense>
      <div className='px-4 md:hidden'>
        <div className='px-4 md:hidden'>
          <CoinsProgress
            coins={profile.wincoin ?? 0}
            progress={profile.wincoin ?? 0}
            currentCompetitions={(() => {
              const available = competitions.filter(
                (comp) => comp.total_tickets - comp._count.Ticket > 0,
              );
              const cheapest = available[0]?.ticket_price;
              return available.filter((c) => c.ticket_price === cheapest);
            })()}
          />
        </div>
      </div>
    </div>
  );
}
