import { EnterCompetitionCarousel } from './enter-competition-carousel';
import type { CompetitionInterface } from '@/lib/interfaces';
import { cn } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';

export async function EnterCompetition<T extends Array<CompetitionInterface>>({
  competitionsData,
  className,
}: Readonly<{
  competitionsData: Promise<T> | T;
  className?: string;
}>) {
  const [competitions, Thome] = Array.isArray(competitionsData)
    ? [competitionsData, await getTranslations('home')]
    : await Promise.all([competitionsData, getTranslations('home')]);
  return competitions.length > 0 ? (
    <div
      className={cn(
        'mt-[253px] flex flex-col gap-[80px] md:gap-[70x]',
        className,
      )}
    >
      <p className='text-start text-[40px]  xs:text-[52px]  md:text-[64px] uppercase  md:text-center font-bold -tracking-[0.05em] pl-4 md:pl-0'>
        {Thome('enter_the_competition')}{' '}
        <span className='text-primary'>{Thome('competition')}</span>
      </p>
      <EnterCompetitionCarousel competitions={competitions} />
    </div>
  ) : null;
}
