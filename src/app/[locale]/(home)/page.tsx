import { PastCompetitions } from '@/components/competitions/past-competitions';
import { UpcomingCompetitions } from '@/components/competitions/upcoming-competitions';
import { StickyTicketFooter } from '@/components/footer/sticky-ticket-footer';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/server/db';
import { Suspense } from 'react';
import { Certificate } from './certificate';
import { Charity } from './charity';
import { Competitions } from './competitions';
import { EnterCompetition } from './enter-competition';
import { HowToCompete } from './how-to-compete';
import { InstagramTopBanner } from './instagram-top-banner';
import { Winners } from './winners';
import { readAllPostFiles } from '@/lib/read-posts';
import { Blog } from './blog';
// import { DiscountPopUp } from './discount-popup';
import BecauseWeLove from './becauseWeLove';
import BtnViewAllArticles from './BtnViewAllArticles';
import { unstable_setRequestLocale } from 'next-intl/server';
import { AgePopUp } from './age-popup';
import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import Link from 'next/link';
import { Whatsapp } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getPublicHomeStats,
  getPublicHomeWinners,
} from '@/server/public-home-data';

const HOME_METADATA: Record<string, { title: string; description: string }> = {
  en: {
    title: 'Luxury Watch Competitions',
    description:
      'Enter WINUWATCH competitions to win luxury watches with secure checkout and transparent draw certificates.',
  },
  es: {
    title: 'Sorteos de Relojes de Lujo',
    description:
      'Participa en los sorteos de WINUWATCH para ganar relojes de lujo con pago seguro y certificados de sorteo transparentes.',
  },
  fr: {
    title: 'Concours de Montres de Luxe',
    description:
      'Participez aux concours WINUWATCH pour gagner des montres de luxe avec paiement sécurisé et certificats de tirage transparents.',
  },
};

export const revalidate = 60;

const getHomeCompetitions = unstable_cache(
  async () => {
    const rows = await db.competition.findMany({
      where: {
        id: {
          not: 'cltbgkdjn0010nc195rv83gik',
        },
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
        comp_image_url: true,
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
      orderBy: {
        end_date: 'desc',
      },
    });
    return rows.map((comp) => ({
      ...comp,
      remaining_tickets: Math.max(comp.total_tickets - comp._count.Ticket, 0),
    }));
  },
  ['home-competitions-derived-remaining-tickets'],
  { revalidate: 60, tags: ['competitions'] },
);

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const metadata = HOME_METADATA[locale] ?? HOME_METADATA.en;

  return {
    title: metadata?.title + ' | WINUWATCH',
    description: metadata?.description + ' | WINUWATCH',
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: '/en',
        es: '/es',
      },
    },
  };
}

export default async function Home({
  params: { locale },
}: Readonly<{
  params: { locale: string };
}>) {
  // Enable static rendering
  unstable_setRequestLocale(locale);
  const [rawCompFetch, posts, publicStats, publicWinners] = await Promise.all([
    getHomeCompetitions(),
    readAllPostFiles(),
    getPublicHomeStats(),
    getPublicHomeWinners(),
  ]);
  // unstable_cache serializes Dates as strings — restore them
  const compFetch = rawCompFetch.map((comp) => ({
    ...comp,
    end_date: new Date(comp.end_date),
  }));
  // const hasUsedReduction = session?.user.email
  //   ? await db.order.findMany({
  //       where: {
  //         email: session.user.email,
  //         coupon: '4LvDX4hg',
  //       },
  //     })
  //   : null;
  const activeCompetitionsData = compFetch.filter(
    (comp) => comp.status === 'ACTIVE',
  );
  const notActiveCompetitions = compFetch.filter(
    (comp) => comp.status === 'NOT_ACTIVE',
  );
  const completedCompetitions = compFetch.filter(
    (comp) => comp.status === 'COMPLETED',
  );

  return (
    <>
      <div className='relative'>
        <LayoutWrapper>
          {/* instagram shows only in mobile screens */}
          <InstagramTopBanner instagramCount={publicStats.instagramCount} />
          {/* competitions */}
          <Suspense
            fallback={
              <Skeleton className='mb-4 h-[700px] w-full bg-muted-foreground' />
            }
          >
            <Competitions competitions={activeCompetitionsData} />
          </Suspense>
          {/* winners */}
          <Winners
            amountWon={publicStats.amountWon}
            className='pl-4 md:pl-0 mt-[91px] md:mt-[181px]'
            winners={publicWinners}
          />
          {/* how to compete */}
          <HowToCompete />
        </LayoutWrapper>
        {/* watches won */}
        <PastCompetitions
          competitions={completedCompetitions}
          className='mt-[104px] pl-4 md:pl-0'
        />
        {/* certificate */}
        <Certificate />
        <LayoutWrapper className='flex flex-col'>
          {/* blog */}
          <Suspense>
            <div className='flex flex-col mt-[192px] '>
              <div className='w-full md:w-4/5 lg:self-center pl-4 md:pl-0'>
                <BecauseWeLove />
              </div>
              <Blog className='mt-[104px]' posts={posts} />
              <BtnViewAllArticles />
            </div>
          </Suspense>
          {/* charity */}
          <Charity />
          {/* competition selection and ticket purchase procedure */}
          <Suspense
            fallback={
              <Skeleton className='mb-4 h-[700px] w-full bg-muted-foreground' />
            }
          >
            <EnterCompetition competitionsData={activeCompetitionsData} />
          </Suspense>
        </LayoutWrapper>
        <UpcomingCompetitions competitions={notActiveCompetitions} />
        {/* right side whatsapp link */}
        <Link
          target='_blank'
          rel='noreferrer'
          href='https://wa.me/447488863429'
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'fixed right-0 top-1/4 z-50 origin-bottom-right rotate-[-90deg] transform  md:hidden bg-transparent bg-gradient-to-l from-white to-white/75 ',
          )}
        >
          <Whatsapp className='h-9 fill-secondary' />
        </Link>
        {/* fixed bottom  ticket footer */}
        <StickyTicketFooter
          comp_id={activeCompetitionsData[0]?.id ?? ''}
          end_date={activeCompetitionsData[0]?.end_date ?? new Date()}
        />
      </div>
      {/* {!session && !hasUsedReduction && <DiscountPopUp />} */}
      <AgePopUp />
    </>
  );
}
