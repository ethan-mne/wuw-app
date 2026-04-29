export const revalidate = 3600;

import { LayoutWrapper } from '@/components/layout-wrapper';
import { FirstSection } from './first-section';
import { Stepper } from '../(home)/stepper';
import { Certificate } from '../(home)/certificate';
import { HashQuote } from '@/components/hash-quote';
import { db } from '@/server/db';
import { EnterCompetition } from '../(home)/enter-competition';
import { TopRankedTitle } from '@/components/top-ranked-title';
import { Winuwatch } from '@/components/icons';

import { unstable_setRequestLocale } from 'next-intl/server';

export default function HowToPlay({
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
      status: true,
      max_winners: true,
      cash_alternative: true,
      Watches: {
        include: {
          images_url: {
            select: {
              url: true,
            },
          },
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
  }).then((competitions) =>
    competitions.map((comp) => ({
      ...comp,
      remaining_tickets: Math.max(comp.total_tickets - comp._count.Ticket, 0),
    })),
  );
  return (
    <>
      <LayoutWrapper>
        <FirstSection />
        <div className='my-20'>
          <Stepper />
        </div>
      </LayoutWrapper>
      <Certificate />
      <HashQuote className='hidden md:flex'>
        <p className='text-center text-base font-medium uppercase tracking-[10.80px] text-background md:text-3xl'>
          #only those who play end up winning
        </p>
      </HashQuote>
      <LayoutWrapper>
        <EnterCompetition competitionsData={competitionsData} />
      </LayoutWrapper>
      <div className='flex-col  justify-center items-center my-10 gap-6 flex md:hidden'>
        <Winuwatch className='fill-foreground h-[39.12px]' />
        <TopRankedTitle
          textStyle='text-foreground leading-loose'
          className='h-[57px] bg-background'
          text='#only those who play end up winning'
        />
      </div>
    </>
  );
}
