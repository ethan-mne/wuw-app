export const revalidate = 3600;

import { LayoutWrapper } from '@/components/layout-wrapper';
import { EnterCompetition } from '../(home)/enter-competition';
import { db } from '@/server/db';
import TarnslatedTextAbout from './tarnslatedTextAbou';

import { unstable_setRequestLocale } from 'next-intl/server';

export default function AboutUs({
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
    <div className=''>
      <TarnslatedTextAbout />
      <LayoutWrapper>
        <EnterCompetition competitionsData={competitionsData} />
      </LayoutWrapper>
    </div>
  );
}
