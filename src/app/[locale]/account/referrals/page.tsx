import { Suspense } from 'react';
import { HistoryListSkeleton } from '../history/history-list-skeleton';
import { ReferralsList } from './referrals-list';
import { CoinsProgress } from '../coins-progress';
import { api } from '@/trpc/server';
import { db } from '@/server/db';

export const dynamic = 'force-dynamic';

export default async function Referrals() {
  const [referralHistory, profile, competitions] = await Promise.all([
    api.Referal.getReferralHistory.query(),
    api.Users.CurrentUser.query(),
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
    <div className='flex flex-col gap-[47px] md:gap-[40px]  '>
      <h1 className='text-foreground text-[20px] md:text-[24px] font-bold uppercase -tracking-[0.05em] px-4 md:p-0 '>
        Your referrals
      </h1>
      <Suspense fallback={<HistoryListSkeleton itemsCount={3} />}>
        <ReferralsList referralHistory={referralHistory} />
      </Suspense>
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
  );
}
