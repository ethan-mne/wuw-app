import { db } from '@/server/db';
import { Charity } from './charity';
import { Competition } from './competition';
import { FeedBack } from './feed-back';
import { LoyaltyProgram } from './loyalty-program';
import { ReferCode } from './refer-code';
import { TicketAsGift } from './ticket-as-gift';
import { UpcomingCompetitions } from './upcoming-competitions';
import { Blog } from '../../(home)/blog';
import { Suspense } from 'react';
import { api } from '@/trpc/server';
import { readAllPostFiles } from '@/lib/read-posts';
import { env } from '@/env';

export const dynamic = 'force-dynamic';

import { Certificate } from '../../(home)/certificate';
import { BtnTransled, TextTranslated } from './dashTranslation';

export default async function Dashboard() {
  // Get profile info
  const [profile, competitions, activeCompetitions, posts] = await Promise.all([
    api.Users.CurrentUser.query(),
    db.competition.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'NOT_ACTIVE'],
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
    api.Order.getLiveCompetitions.query(),
    readAllPostFiles(),
  ]);
  // this condition is to keep the same grid layout (2 in each row) by showing and hiding the charity component
  const showCharity = activeCompetitions?.length % 2 !== 0;

  const activeCompetitionsData = competitions
    .filter(
      (comp) =>
        comp.total_tickets - comp._count.Ticket > 0 && comp.status === 'ACTIVE',
    )
    .sort((a, b) => a.ticket_price - b.ticket_price);

  const notActiveCompetitions = competitions.filter(
    (comp) =>
      comp.total_tickets - comp._count.Ticket > 0 && comp.status === 'NOT_ACTIVE',
  );
  return profile ? (
    <div className='flex flex-col mb-10'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
        {activeCompetitions.map((comp) => (
          <Competition key={comp.id} competition={comp} />
        ))}
        <ReferCode
          referCode={profile.refferalCode?.code ?? 'NaN'}
          compLink={env.HOST + '/competitions/' + competitions[0]?.id}
        />{' '}
        <LoyaltyProgram
          wincoins={profile?.wincoin ?? 0}
          //NOTE: HERE
          currentCompetitions={activeCompetitionsData.filter(
            (comp) => comp.ticket_price === activeCompetitionsData[0]?.ticket_price,
          )}
        />
        <FeedBack />
        {showCharity && <Charity />}
        <TicketAsGift />
      </div>
      <UpcomingCompetitions
        competition={notActiveCompetitions}
        className='mt-[71px] hidden md:flex'
      />
      <Certificate className='flex md:hidden mt-[102px]' />
      <div className='mt-[104px] md:mt-[202px] flex flex-col gap-16'>
        <div className='px-4 md:px-0'>
          <TextTranslated />
        </div>
        <Suspense>
          <Blog className='mt-[80px] md:mt-[104px]' posts={posts} />
        </Suspense>
        <BtnTransled />
      </div>
    </div>
  ) : null;
}
