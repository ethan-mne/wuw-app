import type { CompetitionInterface } from '@/lib/interfaces';
import { LayoutWrapper } from '../layout-wrapper';
import { CompetitionWatches } from './competitions-watches';
import { useTranslations } from 'next-intl';

export function UpcomingCompetitions({
  competitions,
}: {
  competitions: CompetitionInterface[];
}) {
  const Tcomp = useTranslations('competition');
  const Tfooter = useTranslations('footeritems');
  return (
    <div className='bg-foreground mt-[104px] md:mt-[51px]  py-10  overflow-hidden'>
      <LayoutWrapper className='flex flex-col gap-16 lg:gap-16 pl-4 md:pl-0 '>
        <p className='text-start text-[40px]  xs:text-[52px]  md:text-[64px] uppercase  md:text-center font-bold -tracking-[0.05em]  text-background '>
          {Tcomp('Upcoming1')}{' '}
          <span className='text-secondary'>
            {Tfooter('comp').toLowerCase()}
          </span>
        </p>
        <CompetitionWatches competitions_type='UPCOMING' data={competitions} />
      </LayoutWrapper>
      <div
        className='flex h-[280px] w-full items-center justify-center bg-cover bg-center md:h-[479px] '
        style={{
          backgroundImage: `url(https://d9ylgh2z4lcdz.cloudfront.net/upcoming-bg.png)`,
        }}
      >
        <LayoutWrapper>
          <p className='text-center text-[16px] md:text-[24px] leading-[40px] md:leading-normal font-medium uppercase tracking-[0.45em] text-background'>
            {Tcomp('top_ranked_globally')}
          </p>
        </LayoutWrapper>
      </div>
    </div>
  );
}
