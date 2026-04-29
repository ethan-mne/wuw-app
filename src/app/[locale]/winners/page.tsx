import { LayoutWrapper } from '@/components/layout-wrapper';
import { FirstSection } from './first-section';
import { WinnersList } from './winners-list';
import { TopRankedTitle } from '@/components/top-ranked-title';
import { EnterCompetition } from '../(home)/enter-competition';
import { db } from '@/server/db';
import { Suspense } from 'react';
import { api } from '@/trpc/server';

export const dynamic = 'force-dynamic';

import { unstable_setRequestLocale } from 'next-intl/server';

export default function Winners({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const competitionsData = db.competition.findMany({
    where: {
      status: 'ACTIVE',
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
          Ticket: true,
        },
      },
    },
  });
  return (
    <LayoutWrapper>
      <FirstSection amount_promise={api.AmountWon.get.query()} />
      <Suspense>
        <WinnersList
          winners={api.winners.winnerGrouped.query({
            videoFilter: true,
          })}
        />
      </Suspense>
      <TopRankedTitle
        className='bg-background  hidden md:flex h-[354px]'
        textStyle='text-foreground'
        text='#Top-Ranked Globally for Unbeatable Winning Chances'
      />
      <Suspense>
        <EnterCompetition
          competitionsData={competitionsData}
          className='mt-[106px] md:mt-[1px] mb-[99px] md:mb-[106px]'
        />
      </Suspense>
    </LayoutWrapper>
  );
}
