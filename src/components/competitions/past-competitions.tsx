import { LayoutWrapper } from '@/components/layout-wrapper';
import { CompetitionWatches } from './competitions-watches';
import { cn } from '@/lib/utils';
import type { CompetitionInterface } from '@/lib/interfaces';
import { SectionTitle } from '../section-title';
import { JoinNextCompetitionButton } from '../animated-button';
import { useTranslations } from 'next-intl';

export function PastCompetitions({
  competitions,
  className,
  withButton = true,
  competitions_type = 'PAST',
}: Readonly<{
  competitions: CompetitionInterface[];
  className?: string;
  withButton?: boolean;
  competitions_type?: 'PAST' | 'UPCOMING';
}>) {
  const Thome = useTranslations('home');
  const Tcompetition = useTranslations('competition');

  return (
    <div className={cn('bg-foreground', className)}>
      <LayoutWrapper className='flex flex-col gap-[80px] py-10 '>
        <div className='w-full md:w-4/5 lg:self-center'>
          <SectionTitle
            subtitleStyle='text-white lg:text-white'
            subtitle={Thome('subtitle')}
          >
            <p className='text-background -tracking-[0.05em]'>
              {Tcompetition('our_community')}
            </p>
            <p className='text-secondary -tracking-[0.05em]'>
              {Tcompetition('has_won')}
            </p>
          </SectionTitle>
        </div>

        <CompetitionWatches
          competitions_type={competitions_type}
          data={competitions}
        />
        {withButton && (
          <JoinNextCompetitionButton
            href='/competitions'
            text={Thome('join_the_next_competition')}
            containerStyle='self-center mr-4 md:mr-0'
          />
        )}
      </LayoutWrapper>
    </div>
  );
}
