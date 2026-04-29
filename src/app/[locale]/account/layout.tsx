import { api } from '@/trpc/server';
import { AccountHeader } from './account-header';
import { SubHeader } from './sub-header';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { db } from '@/server/db';
import { DahsboardLayout } from './dashboard-layout';

interface AccountLayoutProps {
  children: React.ReactNode;
}

export default async function AccountLayout({ children }: AccountLayoutProps) {
  const profile = await api.Users.CurrentUser.query();
  const coins = profile?.wincoin ?? 0;
  const compFetch = await db.competition.findMany({
    where: {
      id: {
        not: 'cltbgkdjn0010nc195rv83gik', //remove chanel competition
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
      comp_image_url: true,
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
    orderBy: {
      end_date: 'desc',
    },
  });
  const completedCompetitions = compFetch.filter(
    (comp) => comp.status === 'COMPLETED',
  );

  return (
    <>
      <div className='mb-[115px] md:mb-[170px]'>
        <AccountHeader
          name={
            profile
              ? (((profile.firstName ?? profile.lastName)
                  ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim()
                  : profile.email) ?? ' ')
              : ' '
          }
        />
        <SubHeader coins={coins} />
        <LayoutWrapper className='flex md:justify-center'>
          <div className='w-full md:w-5/6  '>{children}</div>
        </LayoutWrapper>
      </div>
      <DahsboardLayout completedCompetitions={completedCompetitions} />
    </>
  );
}
