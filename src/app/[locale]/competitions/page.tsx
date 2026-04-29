import { LayoutWrapper } from '@/components/layout-wrapper';
import { Suspense } from 'react';
import { CompetitionsList } from './competitions-list';
import { CompetitionsListSkeleton } from './competitons-list-skeleton';
import { PastCompetitions } from '@/components/competitions/past-competitions';
import { db } from '@/server/db';
import { TopRankedTitle } from '@/components/top-ranked-title';

export default async function Competitions() {
  const compFetch = await db.competition.findMany({
    select: {
      id: true,
      total_tickets: true,
      name: true,
      end_date: true,
      price: true,
      ticket_price: true,
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
    where: {
      status: {
        in: ['ACTIVE', 'COMPLETED'],
      },
    },
    take: 10,
    orderBy: {
      end_date: 'desc',
    },
  });
  const competitionsWithDerivedTickets = compFetch.map((comp) => ({
    ...comp,
    remaining_tickets: Math.max(comp.total_tickets - comp._count.Ticket, 0),
  }));
  const activeCompetitionsData = competitionsWithDerivedTickets.filter(
    (comp) => comp.status === 'ACTIVE',
  );
  const completedCompetitions = competitionsWithDerivedTickets
    .filter((comp) => comp.status === 'COMPLETED')
    .slice(0, 6);

  return (
    <LayoutWrapper className='mt-[40px] md:my-[91px] flex flex-col '>
      <div className='w-full lg:w-4/5 flex flex-col self-center  '>
        <div className='flex flex-col gap-[35px] md:gap-[75px] px-2 md:px-0'>
          <p className='text-start  text-[32px] font-bold uppercase text-foreground -tracking-[0.05em] pl-4 md:pl-0'>
            Which Competition you want to join ?
          </p>
          <Suspense fallback={<CompetitionsListSkeleton />}>
            <CompetitionsList currentCompetitions={activeCompetitionsData} />
          </Suspense>
        </div>
        <div className='md:hidden mt-[145px] '>
          <TopRankedTitle
            text='#Top-Ranked Globally for Unbeatable Winning Chances'
            className='px-8'
            textStyle='leading-[43px]'
          />
          <PastCompetitions
            competitions={completedCompetitions}
            className='pl-4 md:pl-0'
            withButton={false}
          />
        </div>
      </div>
    </LayoutWrapper>
  );
}
