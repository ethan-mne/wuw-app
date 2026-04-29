import { PastCompetitions } from '@/components/competitions/past-competitions';
import { TopRankedTitle } from '@/components/top-ranked-title';
import { db } from '@/server/db';
import Script from 'next/script';
import { PaypalProvider } from './paypal-provider';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const compFetch = await db.competition.findMany({
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
          images_url: {
            select: {
              url: true,
            },
          },
        },
      },
    },
    where: {
      status: {
        in: ['COMPLETED'],
      },
    },
    take: 6,
    orderBy: {
      end_date: 'desc',
    },
  });
  return (
    <div className='flex flex-col gap-10'>
      <Script
        src='https://pay.google.com/gp/p/js/pay.js'
        strategy='beforeInteractive'
        async
      />
      <Script
        src='https://applepay.cdn-apple.com/jsapi/v1/apple-pay-sdk.js'
        strategy='beforeInteractive'
        async
      />
      <PaypalProvider>{children}</PaypalProvider>
      <div>
        <TopRankedTitle
          text='#Top-Ranked Globally for Unbeatable Winning Chances'
          className='hidden md:flex'
        />
        <TopRankedTitle
          text='#only those who play end up winning'
          className='flex md:hidden'
        />
        <PastCompetitions
          competitions_type='UPCOMING'
          competitions={compFetch}
          className='pl-4 md:pl-0'
          withButton={false}
        />
        <p className='hidden md:block text-center  font-medium uppercase tracking-[0.45em] text-background text-[24px] bg-foreground py-[139px]'>
          #only those who play end up winning
        </p>
      </div>
    </div>
  );
}
